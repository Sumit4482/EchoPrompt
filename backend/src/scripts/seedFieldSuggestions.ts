import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { FieldSuggestion } from '../models/FieldSuggestion';
import { buildCatalogDocuments, getCatalogStats } from '../data/fieldSuggestionCatalog';

export async function seedFieldSuggestions(clearExisting = true): Promise<number> {
  const documents = buildCatalogDocuments();

  if (clearExisting) {
    await FieldSuggestion.deleteMany({});
  }

  const BATCH = 500;
  let inserted = 0;

  for (let i = 0; i < documents.length; i += BATCH) {
    const batch = documents.slice(i, i + BATCH);
    try {
      await FieldSuggestion.insertMany(batch, { ordered: false });
      inserted += batch.length;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'insertedDocs' in error) {
        inserted += (error as { insertedDocs?: unknown[] }).insertedDocs?.length ?? 0;
      } else {
        throw error;
      }
    }
  }

  return inserted;
}

async function runStandalone() {
  try {
    console.log('🌱 Seeding field suggestions catalog...');
    await connectDatabase();

    const stats = getCatalogStats();
    const total = Object.values(stats).reduce((sum, n) => sum + n, 0);
    console.log('📊 Catalog sizes per field:', stats);
    console.log(`📦 Total unique values: ${total}`);

    const inserted = await seedFieldSuggestions(true);
    console.log(`✅ Seeded ${inserted} field suggestion documents`);
  } catch (error) {
    console.error('❌ Field suggestion seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

if (require.main === module) {
  runStandalone();
}
