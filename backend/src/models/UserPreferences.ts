import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    aiProvider: 'gemini' | 'openai' | 'claude';
    autoSave: boolean;
    enableNotifications: boolean;
    defaultOutputFormat: string;
    defaultTone: string;
    promptOptimization: boolean;
    maxTokens: number;
    temperature: number;
    enableAnalytics: boolean;
    privateMode: boolean;
  };
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'English'
    },
    aiProvider: {
      type: String,
      enum: ['gemini', 'openai', 'claude'],
      default: 'gemini'
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    enableNotifications: {
      type: Boolean,
      default: true
    },
    defaultOutputFormat: {
      type: String,
      default: 'Markdown'
    },
    defaultTone: {
      type: String,
      default: 'Professional'
    },
    promptOptimization: {
      type: Boolean,
      default: true
    },
    maxTokens: {
      type: Number,
      default: 2048,
      min: 256,
      max: 4096
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1
    },
    enableAnalytics: {
      type: Boolean,
      default: true
    },
    privateMode: {
      type: Boolean,
      default: false
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
UserPreferencesSchema.index({ userId: 1 });
UserPreferencesSchema.index({ lastUpdated: -1 });

// Middleware to update lastUpdated on save
UserPreferencesSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

export const UserPreferences = mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);

