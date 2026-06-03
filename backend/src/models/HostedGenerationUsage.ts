import mongoose, { Document, Schema } from 'mongoose';

export interface IHostedGenerationUsage extends Document {
  usageKey: string;
  date: string;
  count: number;
}

const HostedGenerationUsageSchema = new Schema<IHostedGenerationUsage>(
  {
    usageKey: { type: String, required: true },
    date: { type: String, required: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

HostedGenerationUsageSchema.index({ usageKey: 1, date: 1 }, { unique: true });

export const HostedGenerationUsage = mongoose.model<IHostedGenerationUsage>(
  'HostedGenerationUsage',
  HostedGenerationUsageSchema,
);
