import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  description?: string;
  promptData: {
    role?: string;
    task?: string;
    context?: string;
    tone?: string;
    outputFormat?: string;
    constraints?: string;
    responseLength?: string;
    audience?: string;
    industry?: string;
    mood?: string;
    language?: string;
    complexity?: string;
    customVariables?: string;
  };
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  userId?: string;
  createdBy?: string;
  usageCount: number;
  rating: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
  incrementUsage(): Promise<ITemplate>;
}

const TemplateSchema = new Schema<ITemplate>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  promptData: {
    role: { type: String, trim: true },
    task: { type: String, trim: true },
    context: { type: String, trim: true },
    tone: { type: String, trim: true },
    outputFormat: { type: String, trim: true },
    constraints: { type: String, trim: true },
    responseLength: { type: String, trim: true },
    audience: { type: String, trim: true },
    industry: { type: String, trim: true },
    mood: { type: String, trim: true },
    language: { type: String, trim: true },
    complexity: { type: String, trim: true },
    customVariables: { type: String, trim: true }
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    default: 'anonymous'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
TemplateSchema.index({ name: 'text', description: 'text' });
TemplateSchema.index({ category: 1 });
TemplateSchema.index({ tags: 1 });
TemplateSchema.index({ isPublic: 1 });
TemplateSchema.index({ userId: 1 });
TemplateSchema.index({ createdAt: -1 });
TemplateSchema.index({ usageCount: -1 });
TemplateSchema.index({ 'rating.average': -1 });

// Virtual for template popularity score
TemplateSchema.virtual('popularityScore').get(function() {
  return (this.usageCount * 0.7) + (this.rating.average * this.rating.count * 0.3);
});

// Instance method to increment usage count
TemplateSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);