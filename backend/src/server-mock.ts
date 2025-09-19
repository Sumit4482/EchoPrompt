import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();
const PORT = 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 900000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('dev'));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'development',
    mode: 'mock'
  });
});

// Mock API endpoints for testing
app.post('/api/prompts/generate', (req, res) => {
  const { promptData, optimize } = req.body;
  
  if (!promptData || !promptData.task) {
    return res.status(400).json({
      success: false,
      error: 'Task is required in prompt data'
    });
  }

  // Generate a mock optimized prompt
  let content = "";
  
  if (promptData.role) {
    content += `You are a ${promptData.role}. `;
  }
  
  if (promptData.task) {
    content += `${promptData.task}`;
  }
  
  if (promptData.context) {
    content += `\n\nContext: ${promptData.context}`;
  }
  
  if (promptData.tone) {
    content += `\n\nTone: ${promptData.tone}`;
  }
  
  if (promptData.outputFormat) {
    content += `\n\nOutput Format: ${promptData.outputFormat}`;
  }

  // Add advanced fields
  if (promptData.constraints) {
    content += `\n\nConstraints: ${promptData.constraints}`;
  }
  if (promptData.responseLength) {
    content += `\n\nResponse Length: ${promptData.responseLength}`;
  }
  if (promptData.audience) {
    content += `\n\nTarget Audience: ${promptData.audience}`;
  }
  if (promptData.industry) {
    content += `\n\nIndustry Context: ${promptData.industry}`;
  }
  if (promptData.mood) {
    content += `\n\nMood/Emotion: ${promptData.mood}`;
  }
  if (promptData.language) {
    content += `\n\nLanguage: ${promptData.language}`;
  }
  if (promptData.complexity) {
    content += `\n\nComplexity Level: ${promptData.complexity}`;
  }
  if (promptData.customVariables) {
    content += `\n\nCustom Variables: ${promptData.customVariables}`;
  }

  if (optimize) {
    content += `\n\n--- OPTIMIZATION APPLIED ---\nPlease be specific and provide detailed examples where appropriate.\nStructure your response clearly with appropriate headings or sections.\nProvide actionable steps that can be implemented immediately.`;
  }

  const mockPrompt = {
    _id: 'mock-' + Date.now(),
    content,
    promptData,
    templateId: null,
    metadata: {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      optimized: optimize,
      aiEnhanced: false
    },
    analytics: {
      views: 0,
      copies: 0,
      exports: 0
    },
    wordCount: content.split(' ').length,
    characterCount: content.length,
    createdAt: new Date().toISOString()
  };

  const words = content.split(' ').filter(w => w.length > 2);
  const keywords = [...new Set(words.slice(0, 10))];

  res.json({
    success: true,
    data: {
      prompt: mockPrompt,
      metadata: {
        wordCount: mockPrompt.wordCount,
        characterCount: mockPrompt.characterCount,
        complexityScore: Math.min(10, Math.max(1, Math.floor(content.length / 100))),
        keywords
      }
    },
    message: 'Prompt generated successfully (mock mode)'
  });
});

// Mock authentication endpoints
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'mock-user-1',
        email: req.body.email,
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        fullName: `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim(),
        preferences: {
          theme: 'system',
          defaultLanguage: 'English',
          defaultTone: 'Professional',
          defaultOutputFormat: 'Markdown'
        },
        subscription: {
          plan: 'free',
          status: 'active'
        },
        usage: {
          promptsGenerated: 0,
          templatesCreated: 0,
          lastActivity: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      },
      token: 'mock-jwt-token-' + Date.now()
    },
    message: 'User registered successfully (mock mode)'
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'mock-user-1',
        email: req.body.identifier,
        username: req.body.identifier,
        firstName: 'Demo',
        lastName: 'User',
        fullName: 'Demo User',
        preferences: {
          theme: 'system',
          defaultLanguage: 'English',
          defaultTone: 'Professional',
          defaultOutputFormat: 'Markdown'
        },
        subscription: {
          plan: 'free',
          status: 'active'
        },
        usage: {
          promptsGenerated: 5,
          templatesCreated: 2,
          lastActivity: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      },
      token: 'mock-jwt-token-' + Date.now()
    },
    message: 'Login successful (mock mode)'
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'mock-user-1',
        email: 'demo@echoprompt.com',
        username: 'demouser',
        firstName: 'Demo',
        lastName: 'User',
        fullName: 'Demo User',
        preferences: {
          theme: 'system',
          defaultLanguage: 'English',
          defaultTone: 'Professional',
          defaultOutputFormat: 'Markdown'
        },
        subscription: {
          plan: 'free',
          status: 'active'
        },
        usage: {
          promptsGenerated: 5,
          templatesCreated: 2,
          lastActivity: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      }
    }
  });
});

// Mock templates endpoints
app.get('/api/templates', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        _id: 'template-1',
        name: 'Code Review Template',
        description: 'Template for reviewing code changes',
        promptData: {
          role: 'Senior Software Engineer',
          task: 'Review the following code for best practices and potential issues',
          context: 'This is for a production application',
          tone: 'Professional',
          outputFormat: 'Markdown',
          constraints: 'Focus on security and performance',
          audience: 'Development team',
          industry: 'Technology',
          complexity: 'Advanced'
        },
        category: 'Technical Writing',
        tags: ['code', 'review', 'development'],
        isPublic: true,
        usageCount: 42,
        rating: { average: 4.8, count: 15 },
        createdAt: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      pages: 1
    }
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'EchoPrompt API (Mock Mode)',
    version: '1.0.0',
    description: 'Mock Backend API for EchoPrompt - AI Prompt Generator',
    status: 'Running in mock mode - no database required',
    endpoints: {
      auth: '/api/auth',
      prompts: '/api/prompts',
      templates: '/api/templates'
    },
    note: 'This is a mock server for testing. All data is temporary and not persisted.'
  });
});

// In-memory template storage for mock mode
let mockTemplates: any[] = [
  {
    _id: 'template-1',
    name: 'Code Review Template',
    description: 'Template for reviewing code changes',
    promptData: {
      role: 'Senior Software Engineer',
      task: 'Review the following code for best practices and potential issues',
      context: 'This is for a production application',
      tone: 'Professional',
      outputFormat: 'Markdown',
      constraints: 'Focus on security and performance',
      audience: 'Development team',
      industry: 'Technology',
      complexity: 'Advanced'
    },
    category: 'Technical Writing',
    tags: ['code', 'review', 'development'],
    isPublic: true,
    usageCount: 42,
    rating: { average: 4.8, count: 15 },
    createdAt: new Date().toISOString()
  }
];

// Mock templates endpoints
app.get('/api/templates', (req, res) => {
  res.json({
    success: true,
    data: mockTemplates,
    pagination: {
      page: 1,
      limit: 10,
      total: mockTemplates.length,
      pages: 1
    }
  });
});

app.post('/api/templates', (req, res) => {
  const { name, description, promptData, category, tags, isPublic } = req.body;
  
  if (!name || !promptData) {
    return res.status(400).json({
      success: false,
      error: 'Name and prompt data are required'
    });
  }

  const newTemplate = {
    _id: 'template-' + Date.now(),
    name,
    description: description || '',
    promptData,
    category: category || 'General',
    tags: tags || [],
    isPublic: isPublic || false,
    usageCount: 0,
    rating: { average: 0, count: 0 },
    createdAt: new Date().toISOString()
  };

  mockTemplates.push(newTemplate);

  res.json({
    success: true,
    data: newTemplate,
    message: 'Template saved successfully (mock mode)'
  });
});

app.get('/api/templates/:id', (req, res) => {
  const template = mockTemplates.find(t => t._id === req.params.id);
  
  if (!template) {
    return res.status(404).json({
      success: false,
      error: 'Template not found'
    });
  }

  res.json({
    success: true,
    data: template
  });
});

app.delete('/api/templates/:id', (req, res) => {
  const index = mockTemplates.findIndex(t => t._id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Template not found'
    });
  }

  mockTemplates.splice(index, 1);

  res.json({
    success: true,
    message: 'Template deleted successfully'
  });
});

// Mock AI suggestions endpoint
app.post('/api/prompts/suggestions', (req, res) => {
  const { field, partialText = '' } = req.body;
  
  const mockSuggestions: Record<string, string[]> = {
    role: [
      'Full Stack Developer', 'Full Stack Engineer', 'Full Stack Architect',
      'Senior Software Engineer', 'Lead Developer', 'Technical Lead'
    ],
    task: [
      'Write comprehensive documentation for',
      'Create a detailed guide on how to',
      'Develop a strategy for implementing',
      'Analyze and provide insights on'
    ],
    tone: [
      'Professional and authoritative',
      'Friendly and conversational',
      'Technical and precise',
      'Creative and engaging'
    ]
  };

  let suggestions = mockSuggestions[field] || [];
  
  if (partialText) {
    suggestions = suggestions.filter(s => 
      s.toLowerCase().includes(partialText.toLowerCase())
    );
  }

  res.json({
    success: true,
    data: {
      field,
      partialText,
      suggestions
    },
    message: 'Mock suggestions provided'
  });
});

// Mock AI completion endpoint
app.post('/api/prompts/complete', (req, res) => {
  const { field, partialText } = req.body;
  
  const mockCompletions: Record<string, Record<string, string[]>> = {
    role: {
      'full': ['Full Stack Developer', 'Full Stack Engineer', 'Full Stack Architect'],
      'senior': ['Senior Software Engineer', 'Senior Developer', 'Senior Data Scientist'],
      'lead': ['Lead Developer', 'Lead Engineer', 'Lead Designer'],
      'data': ['Data Scientist', 'Data Engineer', 'Data Analyst']
    }
  };

  let completions: string[] = [];
  
  if (mockCompletions[field]) {
    const lowerPartial = partialText.toLowerCase();
    for (const [key, values] of Object.entries(mockCompletions[field])) {
      if (key.startsWith(lowerPartial)) {
        completions = values;
        break;
      }
    }
  }

  res.json({
    success: true,
    data: {
      field,
      partialText,
      completions
    },
    message: 'Mock completions provided'
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 EchoPrompt Mock API Server running on port ${PORT}`);
  console.log(`🌍 Environment: development (mock mode)`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
  console.log('');
  console.log('⚠️  MOCK MODE: No database required, all data is temporary');
    console.log('🔗 Frontend should connect to: http://localhost:8080');
});

export default app;
