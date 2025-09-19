import mongoose, { Schema, Model } from 'mongoose';
import { IAnalytics } from '../types';

const analyticsSchema = new Schema<IAnalytics>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: [
      'prompt_generated',
      'template_created',
      'template_used',
      'prompt_copied',
      'prompt_exported',
      'ai_generation_success',
      'ai_generation_fallback'
    ],
  },
  metadata: {
    promptId: {
      type: Schema.Types.ObjectId,
      ref: 'Prompt',
      default: null,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
      default: null,
    },
    category: {
      type: String,
      default: null,
    },
    outputFormat: {
      type: String,
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
    },
    aiProvider: {
      type: String,
      default: null,
    },
    generationTime: {
      type: Number,
      default: null,
    },
    wordCount: {
      type: Number,
      default: null,
    },
    characterCount: {
      type: Number,
      default: null,
    },
    optimized: {
      type: Boolean,
      default: null,
    },
  },
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete (ret as any).__v;
      return ret;
    },
  },
});

// Indexes
analyticsSchema.index({ eventType: 1 });
analyticsSchema.index({ userId: 1 });
analyticsSchema.index({ createdAt: -1 });
analyticsSchema.index({ 'metadata.templateId': 1 });
analyticsSchema.index({ 'metadata.promptId': 1 });

// Compound indexes for common queries
analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ userId: 1, eventType: 1, createdAt: -1 });

// TTL index to automatically delete old analytics data (optional - keep 1 year)
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Static methods
analyticsSchema.statics.logEvent = function(eventData: Partial<IAnalytics>) {
  const analytics = new this(eventData);
  return analytics.save();
};

analyticsSchema.statics.getEventsByType = function(eventType: string, limit = 100) {
  return this.find({ eventType })
    .sort({ createdAt: -1 })
    .limit(limit);
};

analyticsSchema.statics.getUserEvents = function(userId: string, limit = 100) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

analyticsSchema.statics.getEventStats = function(startDate?: Date, endDate?: Date) {
  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = startDate;
    if (endDate) dateFilter.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]);
};

analyticsSchema.statics.getAIGenerationStats = function(startDate?: Date, endDate?: Date) {
  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = startDate;
    if (endDate) dateFilter.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { 
      $match: { 
        ...dateFilter,
        eventType: { $in: ['ai_generation_success', 'ai_generation_fallback'] }
      } 
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        avgGenerationTime: { $avg: '$metadata.generationTime' },
        avgWordCount: { $avg: '$metadata.wordCount' },
        avgCharacterCount: { $avg: '$metadata.characterCount' },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        avgGenerationTime: { $round: ['$avgGenerationTime', 2] },
        avgWordCount: { $round: ['$avgWordCount', 0] },
        avgCharacterCount: { $round: ['$avgCharacterCount', 0] },
        uniqueUsers: { $size: '$uniqueUsers' },
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Define the static methods interface
interface IAnalyticsModel extends Model<IAnalytics> {
  logEvent(eventData: Partial<IAnalytics>): Promise<IAnalytics>;
  getEventsByType(eventType: string, limit?: number): Promise<IAnalytics[]>;
  getUserEvents(userId: string, limit?: number): Promise<IAnalytics[]>;
  getEventStats(startDate?: Date, endDate?: Date): Promise<any[]>;
  getAIGenerationStats(startDate?: Date, endDate?: Date): Promise<any[]>;
}

const Analytics: IAnalyticsModel = mongoose.model<IAnalytics, IAnalyticsModel>('Analytics', analyticsSchema);

export default Analytics;
