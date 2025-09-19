import mongoose, { Document, Schema } from 'mongoose';

export interface IPrompt extends Document {
  content: string;
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
  templateId?: string;
  userId?: string;
  createdBy?: string;
  isPublic?: boolean;
  tags?: string[];
  metadata: {
    version: string;
    generatedAt: Date;
    optimized: boolean;
    aiEnhanced: boolean;
    generationTime?: number;
  };
  analytics: {
    views: number;
    copies: number;
    exports: number;
    ratings?: number[];
  };
  wordCount: number;
  characterCount: number;
  keywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PromptSchema = new Schema<IPrompt>({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
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
  templateId: {
    type: String,
    ref: 'Template'
  },
  userId: {
    type: String,
    default: 'anonymous'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    version: {
      type: String,
      default: '1.0.0'
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    optimized: {
      type: Boolean,
      default: false
    },
    aiEnhanced: {
      type: Boolean,
      default: false
    },
    generationTime: {
      type: Number,
      min: 0
    }
  },
  analytics: {
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    copies: {
      type: Number,
      default: 0,
      min: 0
    },
    exports: {
      type: Number,
      default: 0,
      min: 0
    },
    ratings: [{
      type: Number,
      min: 1,
      max: 5
    }]
  },
  wordCount: {
    type: Number,
    required: true,
    min: 0
  },
  characterCount: {
    type: Number,
    required: true,
    min: 0
  },
  keywords: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
PromptSchema.index({ content: 'text' });
PromptSchema.index({ userId: 1 });
PromptSchema.index({ createdBy: 1 });
PromptSchema.index({ templateId: 1 });
PromptSchema.index({ createdAt: -1 });
PromptSchema.index({ isPublic: 1 });
PromptSchema.index({ tags: 1 });
PromptSchema.index({ 'metadata.optimized': 1 });
PromptSchema.index({ 'metadata.aiEnhanced': 1 });
PromptSchema.index({ wordCount: 1 });
PromptSchema.index({ keywords: 1 });
// Compound indexes for common queries
PromptSchema.index({ isPublic: 1, createdAt: -1 });
PromptSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual for average rating
PromptSchema.virtual('averageRating').get(function() {
  if (!this.analytics.ratings || this.analytics.ratings.length === 0) {
    return 0;
  }
  const sum = this.analytics.ratings.reduce((acc, rating) => acc + rating, 0);
  return sum / this.analytics.ratings.length;
});

// Virtual for engagement score
PromptSchema.virtual('engagementScore').get(function() {
  return (this.analytics.views * 0.3) + 
         (this.analytics.copies * 0.4) + 
         (this.analytics.exports * 0.3);
});

export const Prompt = mongoose.model<IPrompt>('Prompt', PromptSchema);