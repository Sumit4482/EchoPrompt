import { Model } from 'mongoose';
import { Template } from '../models/Template';
import { Prompt } from '../models/Prompt';
import {
  SUGGESTION_FIELDS,
  SuggestionField,
  FieldSuggestionsResponse,
} from '../constants/suggestionFields';

const MAX_VALUE_LENGTH: Partial<Record<SuggestionField, number>> = {
  task: 120,
  context: 120,
  constraints: 120,
};

interface AggregatedValue {
  value: string;
  count: number;
}

async function aggregateField(
  model: Model<unknown>,
  field: SuggestionField,
  limit: number,
  countExpression: { $sum: number } | { $sum: { $add: Array<number | { $ifNull: [string, number] }> } }
): Promise<AggregatedValue[]> {
  const path = `promptData.${field}`;

  const rows = await model.aggregate<AggregatedValue>([
    {
      $match: {
        [path]: { $exists: true, $type: 'string', $nin: ['', null] },
      },
    },
    {
      $group: {
        _id: `$${path}`,
        count: countExpression,
      },
    },
    { $match: { _id: { $nin: [null, ''] } } },
    { $sort: { count: -1 } },
    { $limit: limit * 2 },
    {
      $project: {
        _id: 0,
        value: '$_id',
        count: 1,
      },
    },
  ]);

  return rows;
}

async function getCatalogField(field: SuggestionField, limit: number): Promise<AggregatedValue[]> {
  const { FieldSuggestion } = await import('../models/FieldSuggestion');
  const rows = await FieldSuggestion.find({ field })
    .sort({ weight: -1 })
    .limit(limit)
    .select('value weight')
    .lean();

  return rows.map((row) => ({
    value: row.value,
    count: row.weight,
  }));
}

function normalizeValue(field: SuggestionField, raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, ' ');
  if (!value) return null;

  const maxLen = MAX_VALUE_LENGTH[field];
  if (maxLen && value.length > maxLen) return null;

  return value;
}

function mergeAggregated(
  sets: AggregatedValue[][],
  limit: number,
  field: SuggestionField
): string[] {
  const scores = new Map<string, { value: string; count: number }>();

  for (const set of sets) {
    for (const row of set) {
      const normalized = normalizeValue(field, row.value);
      if (!normalized) continue;

      const key = normalized.toLowerCase();
      const existing = scores.get(key);
      if (existing) {
        existing.count += row.count;
      } else {
        scores.set(key, { value: normalized, count: row.count });
      }
    }
  }

  return [...scores.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item) => item.value);
}

export async function getFieldSuggestions(limitPerField = 150): Promise<FieldSuggestionsResponse> {
  const result = {} as FieldSuggestionsResponse;
  const catalogLimit = Math.max(limitPerField, 500);

  await Promise.all(
    SUGGESTION_FIELDS.map(async (field) => {
      const [fromCatalog, fromTemplates, fromPrompts] = await Promise.all([
        getCatalogField(field, catalogLimit),
        aggregateField(Template, field, limitPerField, {
          $sum: { $add: [{ $ifNull: ['$usageCount', 0] }, 1] },
        }),
        aggregateField(Prompt, field, limitPerField, { $sum: 1 }),
      ]);

      result[field] = mergeAggregated(
        [fromCatalog, fromTemplates, fromPrompts],
        limitPerField,
        field
      );
    })
  );

  return result;
}
