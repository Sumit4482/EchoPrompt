const API_BASE_URL = 'http://localhost:3001/api';

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

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultLanguage: string;
    defaultTone: string;
    defaultOutputFormat: string;
  };
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled';
  };
  usage: {
    promptsGenerated: number;
    templatesCreated: number;
    lastActivity: string;
  };
  createdAt: string;
}

export interface Template {
  _id: string;
  name: string;
  description?: string;
  promptData: PromptData;
  category: string;
  tags: string[];
  isPublic: boolean;
  createdBy: any;
  usageCount: number;
  rating: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PromptData {
  role: string;
  task: string;
  context: string;
  tone: string;
  outputFormat: string;
  constraints?: string;
  responseLength?: string;
  audience?: string;
  industry?: string;
  mood?: string;
  language?: string;
  complexity?: string;
  customVariables?: string;
}

export interface GeneratedPrompt {
  _id: string;
  content: string;
  promptData: PromptData;
  templateId?: string;
  metadata: {
    version: string;
    generatedAt: string;
    optimized: boolean;
    aiEnhanced: boolean;
  };
  analytics: {
    views: number;
    copies: number;
    exports: number;
  };
  wordCount: number;
  characterCount: number;
  createdAt: string;
}

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication
  async register(userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const result = await this.handleResponse<{ user: User; token: string }>(response);
    
    if (result.success && result.data?.token) {
      localStorage.setItem('authToken', result.data.token);
    }
    
    return result;
  }

  async login(credentials: {
    identifier: string;
    password: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const result = await this.handleResponse<{ user: User; token: string }>(response);
    
    if (result.success && result.data?.token) {
      localStorage.setItem('authToken', result.data.token);
    }
    
    return result;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ user: User }>(response);
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  // Prompt Generation
  async generatePrompt(promptData: PromptData, optimize: boolean = false): Promise<ApiResponse<{
    prompt: GeneratedPrompt;
    metadata: {
      wordCount: number;
      characterCount: number;
      complexityScore: number;
      keywords: string[];
    };
  }>> {
    const response = await fetch(`${API_BASE_URL}/prompts/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ promptData, optimize }),
    });
    return this.handleResponse(response);
  }

  async generatePromptLocal(promptData: PromptData, optimize: boolean = false): Promise<ApiResponse<{
    prompt: GeneratedPrompt;
    metadata: {
      wordCount: number;
      characterCount: number;
      complexityScore: number;
      keywords: string[];
    };
  }>> {
    const response = await fetch(`${API_BASE_URL}/prompts/generate/local`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ promptData, optimize }),
    });
    return this.handleResponse(response);
  }

  async getPrompts(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<ApiResponse<GeneratedPrompt[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);

    const response = await fetch(`${API_BASE_URL}/prompts?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<GeneratedPrompt[]>(response);
  }

  async copyPrompt(promptId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/prompts/${promptId}/copy`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async exportPrompt(promptId: string, format: 'txt' | 'json' | 'markdown' | 'csv'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/prompts/${promptId}/export`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ format }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // Templates
  async getTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isPublic?: boolean;
  }): Promise<ApiResponse<Template[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isPublic !== undefined) queryParams.append('isPublic', params.isPublic.toString());

    const response = await fetch(`${API_BASE_URL}/templates?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Template[]>(response);
  }

  async getTemplate(id: string): Promise<ApiResponse<Template>> {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Template>(response);
  }

  async createTemplate(template: {
    name: string;
    description?: string;
    promptData: PromptData;
    category: string;
    tags?: string[];
    isPublic?: boolean;
  }): Promise<ApiResponse<Template>> {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(template),
    });
    return this.handleResponse<Template>(response);
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<ApiResponse<Template>> {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return this.handleResponse<Template>(response);
  }

  async deleteTemplate(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async useTemplate(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/templates/${id}/use`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getCategories(): Promise<ApiResponse<string[]>> {
    const response = await fetch(`${API_BASE_URL}/templates/categories/list`);
    return this.handleResponse<string[]>(response);
  }

  // Analytics
  async getOverview(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/analytics/overview`);
    return this.handleResponse(response);
  }

  async getTrending(period: '24h' | '7d' | '30d' = '7d'): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/analytics/trending?period=${period}`);
    return this.handleResponse(response);
  }

  async getUserInsights(period: '7d' | '30d' | '90d' = '30d'): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/analytics/user-insights?period=${period}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // User Management
  async getUserStats(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/users/stats`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getUserActivity(params?: {
    page?: number;
    limit?: number;
    type?: 'template' | 'prompt' | 'all';
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);

    const response = await fetch(`${API_BASE_URL}/users/activity?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any[]>(response);
  }

  // AI Suggestions and Completions
  async getSuggestions(field: string, partialText: string = ''): Promise<ApiResponse<{
    field: string;
    partialText: string;
    suggestions: string[];
  }>> {
    const response = await fetch(`${API_BASE_URL}/prompts/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, partialText }),
    });
    return this.handleResponse(response);
  }

  async getCompletions(field: string, partialText: string): Promise<ApiResponse<{
    field: string;
    partialText: string;
    completions: string[];
  }>> {
    const response = await fetch(`${API_BASE_URL}/prompts/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, partialText }),
    });
    return this.handleResponse(response);
  }

  async getAutoPopulate(task: string): Promise<ApiResponse<{
    task: string;
    suggestions: {
      role?: string;
      tone?: string;
      outputFormat?: string;
      context?: string;
      audience?: string;
      industry?: string;
    };
  }>> {
    const response = await fetch(`${API_BASE_URL}/prompts/auto-populate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    });
    return this.handleResponse(response);
  }

  // Health Check
  async healthCheck(): Promise<any> {
    const response = await fetch('http://localhost:3001/health');
    return response.json();
  }
}

export const apiService = new ApiService();
