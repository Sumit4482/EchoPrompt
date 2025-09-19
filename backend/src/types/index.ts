import { Document, Types } from 'mongoose';

// User types
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isEmailVerified: boolean;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultLanguage: string;
    defaultTone: string;
    defaultOutputFormat: string;
  };
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled';
    expiresAt?: Date;
  };
  usage: {
    promptsGenerated: number;
    templatesCreated: number;
    lastActivity: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  fullName: string; // virtual field
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Prompt Data types
export interface PromptData {
  role: string;
  task: string;
  context: string;
  tone: string;
  outputFormat: string;
  // Advanced fields
  constraints?: string;
  responseLength?: string;
  audience?: string;
  industry?: string;
  mood?: string;
  language?: string;
  complexity?: string;
  customVariables?: string;
}

// Template types
export interface ITemplate extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  promptData: PromptData;
  category: string;
  tags: string[];
  isPublic: boolean;
  createdBy: Types.ObjectId;
  usageCount: number;
  rating: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
  // Methods
  incrementUsage(): Promise<ITemplate>;
  updateRating(rating: number): Promise<ITemplate>;
}

// Generated Prompt types
export interface IPrompt extends Document {
  _id: Types.ObjectId;
  content: string;
  promptData: PromptData;
  templateId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  metadata: {
    version: string;
    generatedAt: Date;
    optimized: boolean;
    aiEnhanced: boolean;
  };
  analytics: {
    views: number;
    copies: number;
    exports: number;
    ratings: Array<{
      userId: Types.ObjectId;
      rating: number;
      feedback?: string;
      createdAt: Date;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  averageRating: number;
  totalInteractions: number;
  wordCount: number;
  characterCount: number;
  // Methods
  incrementViews(): Promise<IPrompt>;
  incrementCopies(): Promise<IPrompt>;
  incrementExports(): Promise<IPrompt>;
  addRating(userId: string, rating: number, feedback?: string): Promise<IPrompt>;
}

// Analytics types
export interface IAnalytics extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  eventType: 'prompt_generated' | 'template_created' | 'template_used' | 'prompt_copied' | 'prompt_exported' | 'ai_generation_success' | 'ai_generation_fallback';
  metadata: {
    promptId?: Types.ObjectId;
    templateId?: Types.ObjectId;
    category?: string;
    outputFormat?: string;
    sessionId?: string;
    aiProvider?: string;
    generationTime?: number;
    wordCount?: number;
    characterCount?: number;
    optimized?: boolean;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Request types
import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface TemplateQuery extends PaginationQuery {
  category?: string;
  tags?: string;
  search?: string;
  isPublic?: string;
  createdBy?: string;
}

export interface PromptQuery extends PaginationQuery {
  templateId?: string;
  createdBy?: string;
  optimized?: string;
}

// OpenAI types (for AI enhancement)
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

// Export formats
export type ExportFormat = 'txt' | 'json' | 'markdown' | 'csv' | 'pdf';

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
