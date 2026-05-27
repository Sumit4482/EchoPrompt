import mongoose, { Document, Schema } from 'mongoose';
import { SUGGESTION_FIELDS, SuggestionField } from '../constants/suggestionFields';

export interface IFieldSuggestion extends Document {
  field: SuggestionField;
  value: string;
  weight: number;
  source: 'catalog' | 'usage';
}

const FieldSuggestionSchema = new Schema<IFieldSuggestion>(
  {
    field: {
      type: String,
      required: true,
      enum: SUGGESTION_FIELDS,
      index: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number,
      default: 1,
      min: 1,
    },
    source: {
      type: String,
      enum: ['catalog', 'usage'],
      default: 'catalog',
    },
  },
  { timestamps: true }
);

FieldSuggestionSchema.index({ field: 1, value: 1 }, { unique: true });
FieldSuggestionSchema.index({ field: 1, weight: -1 });

export const FieldSuggestion = mongoose.model<IFieldSuggestion>(
  'FieldSuggestion',
  FieldSuggestionSchema
);
