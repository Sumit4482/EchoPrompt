import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { connectDatabase } from './config/database';
import { Template } from './models/Template';
import { Prompt } from './models/Prompt';
import { UserPreferences } from './models/UserPreferences';
import { geminiService } from './services/geminiService';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database connection
let isDbConnected = false;

const initializeDatabase = async () => {
  try {
    const connection = await connectDatabase();
    isDbConnected = !!connection;
    
    if (isDbConnected) {
      console.log('🎉 Application is running with MongoDB persistence');
} else {
      console.log('⚠️  Application is running in fallback mode (no persistence)');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    isDbConnected = false;
  }
};

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - Allow all localhost origins for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }
    
    // Allow specific origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:8084',
      'http://localhost:8085',
      'http://localhost:8086',
      'http://localhost:8087',
      'http://localhost:8088',
      'http://localhost:8089'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204
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
    environment: process.env.NODE_ENV || 'development',
    database: isDbConnected ? 'connected' : 'disconnected',
    mode: isDbConnected ? 'persistent' : 'fallback'
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('📨 LOGIN REQUEST RECEIVED');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  const { identifier, password } = req.body || {};
  console.log('📨 Login attempt:', { identifier, hasPassword: !!password });
  
  // Basic validation
  if (!identifier || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).json({
      success: false,
      error: 'Email/username and password are required'
    });
  }

  // For demo purposes, accept any valid-looking credentials
  try {
    const mockUser = {
      id: 'user-' + Date.now(),
      email: identifier.includes('@') ? identifier : `${identifier}@echoprompt.com`,
      username: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      fullName: identifier === 'demo@echoprompt.com' ? 'Demo User' : 'User',
      avatar: null,
      plan: 'Free',
      createdAt: new Date().toISOString()
    };

    const token = 'demo-token-' + Date.now();
    
    console.log('✅ Login successful for:', identifier);
    res.status(200).json({
      success: true,
      data: {
        user: mockUser,
        token: token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('❌ Login error details:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  console.log('📨 REGISTER REQUEST RECEIVED');
  console.log('Body:', req.body);
  
  const { email, username, password, firstName, lastName } = req.body || {};
  console.log('📨 Registration attempt:', { email, username });
  
  if (!email || !username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  try {
    const mockUser = {
      id: 'user-' + Date.now(),
      email,
      username,
      fullName: `${firstName || ''} ${lastName || ''}`.trim() || username,
      avatar: null,
      plan: 'Free',
      createdAt: new Date().toISOString()
    };

    const token = 'demo-token-' + Date.now();
    
    console.log('✅ Registration successful for:', email);
    res.status(200).json({
      success: true,
      data: {
        user: mockUser,
        token: token
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

app.get('/api/auth/me', (req, res) => {
  console.log('📨 Get current user request');
  
  try {
    const mockUser = {
      id: 'user-demo',
      email: 'demo@echoprompt.com',
      username: 'demo',
      fullName: 'Demo User',
      avatar: null,
      plan: 'Free',
      createdAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: {
        user: mockUser
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

// Fallback in-memory storage for when MongoDB is not available
let fallbackTemplates: any[] = [
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

// API Routes

// Generate Prompt endpoint (with AI)
app.post('/api/prompts/generate', async (req, res) => {
  try {
    const startTime = Date.now();
    const { promptData, optimize } = req.body;
    
    if (!promptData || !promptData.task) {
      return res.status(400).json({
        success: false,
        error: 'Task is required in prompt data'
      });
    }

    // Generate prompt content using Gemini AI
    let content: string;
    let aiEnhanced = false;
    
    try {
      console.log('🤖 Generating prompt with Gemini AI...');
      content = await geminiService.generatePrompt(promptData, optimize);
      aiEnhanced = true;
      console.log('✅ Gemini AI generation successful');
    } catch (geminiError) {
      console.error('❌ Gemini AI failed, falling back to template generation:', geminiError);
      
      // Fallback to template-based generation
      content = "";
      
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
        content += `\n\n--- OPTIMIZATION APPLIED (Template Mode) ---\nPlease be specific and provide detailed examples where appropriate.\nStructure your response clearly with appropriate headings or sections.\nProvide actionable steps that can be implemented immediately.`;
      }
      
      aiEnhanced = false;
    }

    // Calculate metrics
    const wordCount = content.split(' ').length;
    const characterCount = content.length;
    const words = content.split(' ').filter(w => w.length > 2);
    const keywords = [...new Set(words.slice(0, 10))];
    const generationTime = Date.now() - startTime;

    // Create prompt object
    const promptObj = {
      content,
      promptData,
      templateId: null,
      userId: 'anonymous',
      metadata: {
        version: '1.0.0',
        generatedAt: new Date(),
        optimized: optimize,
        aiEnhanced,
        generationTime
      },
      analytics: {
        views: 0,
        copies: 0,
        exports: 0
      },
      wordCount,
      characterCount,
      keywords
    };

    // Save to MongoDB if connected, otherwise just return
    let savedPrompt = promptObj;
    if (isDbConnected) {
      try {
        const prompt = new Prompt(promptObj);
        savedPrompt = await prompt.save();
        console.log(`💾 Prompt saved to MongoDB: ${savedPrompt._id}`);
      } catch (dbError) {
        console.error('Error saving to MongoDB:', dbError);
        // Continue with in-memory object
      }
    }

    res.json({
      success: true,
      data: {
        prompt: savedPrompt,
        metadata: {
          wordCount,
          characterCount,
          complexityScore: Math.min(10, Math.max(1, Math.floor(content.length / 100))),
          keywords,
          generationTime
        }
      },
      message: `Prompt generated successfully ${aiEnhanced ? '🤖 with Gemini AI' : '📝 with template'} ${isDbConnected ? '(saved to database)' : '(temporary)'}`
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate Prompt endpoint (local templates only)
app.post('/api/prompts/generate/local', async (req, res) => {
  try {
    const startTime = Date.now();
    const { promptData, optimize } = req.body;
    
    if (!promptData || !promptData.task) {
      return res.status(400).json({
        success: false,
        error: 'Task is required in prompt data'
      });
    }

    console.log('📝 Generating prompt with local templates...');
    
    // Force local template generation (no AI)
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
      content += `\n\n--- LOCAL OPTIMIZATION ---\nPlease be specific and provide detailed examples where appropriate.\nStructure your response clearly with appropriate headings or sections.\nProvide actionable steps that can be implemented immediately.\nFocus on clarity and practical implementation.`;
    }

    console.log('✅ Local template generation successful');

    // Calculate metrics
    const wordCount = content.split(' ').length;
    const characterCount = content.length;
    const words = content.split(' ').filter(w => w.length > 2);
    const keywords = [...new Set(words.slice(0, 10))];
    const generationTime = Date.now() - startTime;

    // Create prompt object
    const promptObj = {
      content,
      promptData,
      templateId: null,
      userId: 'anonymous',
      metadata: {
        version: '1.0.0',
        generatedAt: new Date(),
        optimized: optimize,
        aiEnhanced: false,
        generationTime
      },
      analytics: {
        views: 0,
        copies: 0,
        exports: 0
      },
      wordCount,
      characterCount,
      keywords
    };

    // Save to MongoDB if connected
    let savedPrompt = promptObj;
    if (isDbConnected) {
      try {
        const prompt = new Prompt(promptObj);
        savedPrompt = await prompt.save();
        console.log(`💾 Local prompt saved to MongoDB: ${savedPrompt._id}`);
      } catch (dbError) {
        console.error('Error saving to MongoDB:', dbError);
        // Continue with in-memory object
      }
    }

    res.json({
      success: true,
      data: {
        prompt: savedPrompt,
        metadata: {
          wordCount,
          characterCount,
          complexityScore: Math.min(10, Math.max(1, Math.floor(content.length / 100))),
          keywords,
          generationTime
        }
      },
      message: `Prompt generated successfully 📝 with local templates ${isDbConnected ? '(saved to database)' : '(temporary)'}`
    });

  } catch (error) {
    console.error('Error generating local prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate local prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Templates endpoints
app.get('/api/templates', async (req, res) => {
  try {
    let templates;
    
    if (isDbConnected) {
      templates = await Template.find()
        .sort({ createdAt: -1 })
        .limit(50);
      console.log(`📋 Retrieved ${templates.length} templates from MongoDB`);
    } else {
      templates = fallbackTemplates;
      console.log(`📋 Retrieved ${templates.length} templates from fallback storage`);
    }

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: 1,
        limit: 50,
        total: templates.length,
        pages: 1
      },
      source: isDbConnected ? 'database' : 'fallback'
    });
  } catch (error) {
    console.error('Error retrieving templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const { name, description, promptData, category, tags, isPublic } = req.body;
    
    if (!name || !promptData) {
      return res.status(400).json({
        success: false,
        error: 'Name and prompt data are required'
      });
    }

    const templateObj = {
      name,
      description: description || '',
      promptData,
      category: category || 'General',
      tags: tags || [],
      isPublic: isPublic || false,
      userId: 'anonymous',
      usageCount: 0,
      rating: { average: 0, count: 0 }
    };

    let savedTemplate;

    if (isDbConnected) {
      try {
        const template = new Template(templateObj);
        savedTemplate = await template.save();
        console.log(`💾 Template saved to MongoDB: ${savedTemplate._id}`);
      } catch (dbError) {
        console.error('Error saving to MongoDB:', dbError);
        // Fall back to in-memory storage
        savedTemplate = {
          _id: 'template-' + Date.now(),
          ...templateObj,
          createdAt: new Date().toISOString()
        };
        fallbackTemplates.push(savedTemplate);
      }
    } else {
      savedTemplate = {
        _id: 'template-' + Date.now(),
        ...templateObj,
        createdAt: new Date().toISOString()
      };
      fallbackTemplates.push(savedTemplate);
    }

    res.json({
      success: true,
      data: savedTemplate,
      message: `Template saved successfully ${isDbConnected ? '(saved to database)' : '(temporary storage)'}`
    });

  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/templates/:id', async (req, res) => {
  try {
    let template;

    if (isDbConnected) {
      template = await Template.findById(req.params.id);
    } else {
      template = fallbackTemplates.find(t => t._id === req.params.id);
    }
    
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
  } catch (error) {
    console.error('Error retrieving template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/templates/:id', async (req, res) => {
  try {
    let deleted = false;

    if (isDbConnected) {
      const result = await Template.findByIdAndDelete(req.params.id);
      deleted = !!result;
    } else {
      const index = fallbackTemplates.findIndex(t => t._id === req.params.id);
      if (index !== -1) {
        fallbackTemplates.splice(index, 1);
        deleted = true;
      }
    }
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI-powered suggestion endpoints
app.post('/api/prompts/suggestions', async (req, res) => {
  try {
    const { field, partialText = '' } = req.body;
    
    if (!field) {
      return res.status(400).json({
        success: false,
        error: 'Field name is required'
      });
    }

    console.log(`🔍 Getting AI suggestions for field: ${field}, partial: "${partialText}"`);
    
    const suggestions = await geminiService.getSuggestions(field, partialText);
    
    res.json({
      success: true,
      data: {
        field,
        partialText,
        suggestions
      },
      message: 'AI suggestions generated successfully'
    });
    
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/prompts/complete', async (req, res) => {
  try {
    const { field, partialText } = req.body;
    
    if (!field || !partialText) {
      return res.status(400).json({
        success: false,
        error: 'Field and partial text are required'
      });
    }

    console.log(`⚡ Getting AI completions for field: ${field}, partial: "${partialText}"`);
    
    const completions = await geminiService.getFieldCompletion(field, partialText);
    
    res.json({
      success: true,
      data: {
        field,
        partialText,
        completions
      },
      message: 'AI completions generated successfully'
    });
    
  } catch (error) {
    console.error('Error getting AI completions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI completions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/prompts/auto-populate', async (req, res) => {
  try {
    const { task } = req.body;
    
    if (!task) {
      return res.status(400).json({
        success: false,
        error: 'Task is required for auto-populate'
      });
    }

    console.log(`🔮 Auto-populating fields based on task: "${task}"`);
    
    const fieldSuggestions = await geminiService.getFieldAutoPopulate(task);
    
    res.json({
      success: true,
      data: {
        task,
        suggestions: fieldSuggestions
      },
      message: 'Field auto-populate suggestions generated successfully'
    });
    
  } catch (error) {
    console.error('Error auto-populating fields:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-populate fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User Preferences endpoints
app.get('/api/user/preferences/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || 'anonymous';
    
    let preferences;
    
    if (isDbConnected) {
      preferences = await UserPreferences.findOne({ userId });
      if (!preferences) {
        // Create default preferences if none exist
        preferences = new UserPreferences({
          userId,
          preferences: {
            theme: 'system',
            language: 'English',
            aiProvider: 'gemini',
            autoSave: true,
            enableNotifications: true,
            defaultOutputFormat: 'Markdown',
            defaultTone: 'Professional',
            promptOptimization: true,
            maxTokens: 2048,
            temperature: 0.7,
            enableAnalytics: true,
            privateMode: false,
          }
        });
        await preferences.save();
        console.log(`✨ Created default preferences for user: ${userId}`);
      }
    } else {
      // Fallback default preferences
      preferences = {
        userId,
        preferences: {
          theme: 'system',
          language: 'English',
          aiProvider: 'gemini',
          autoSave: true,
          enableNotifications: true,
          defaultOutputFormat: 'Markdown',
          defaultTone: 'Professional',
          promptOptimization: true,
          maxTokens: 2048,
          temperature: 0.7,
          enableAnalytics: true,
          privateMode: false,
        }
      };
    }

    res.json({
      success: true,
      data: preferences,
      source: isDbConnected ? 'database' : 'fallback'
    });
    
  } catch (error) {
    console.error('Error retrieving user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/user/preferences/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || 'anonymous';
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'Preferences object is required'
      });
    }

    let savedPreferences;

    if (isDbConnected) {
      try {
        savedPreferences = await UserPreferences.findOneAndUpdate(
          { userId },
          { 
            preferences,
            lastUpdated: new Date()
          },
          { 
            new: true, 
            upsert: true,
            runValidators: true
          }
        );
        console.log(`💾 User preferences saved for: ${userId}`);
      } catch (dbError) {
        console.error('Error saving preferences to MongoDB:', dbError);
        // Continue with fallback response
        savedPreferences = { userId, preferences };
      }
    } else {
      savedPreferences = { userId, preferences };
    }

    res.json({
      success: true,
      data: savedPreferences,
      message: `Preferences saved successfully ${isDbConnected ? '(saved to database)' : '(temporary storage)'}`
    });

  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save user preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/user/preferences/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    let deleted = false;

    if (isDbConnected) {
      const result = await UserPreferences.findOneAndDelete({ userId });
      deleted = !!result;
    } else {
      deleted = true; // Always true for fallback mode
    }
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'User preferences not found'
      });
    }

    res.json({
      success: true,
      message: 'User preferences deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'EchoPrompt API',
    version: '1.0.0',
    description: 'Backend API for EchoPrompt - AI Prompt Generator',
    database: isDbConnected ? 'MongoDB (Connected)' : 'Fallback Mode',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      prompts: '/api/prompts',
      templates: '/api/templates'
    },
    features: {
      persistence: isDbConnected,
      mongodb: isDbConnected,
      fallbackMode: !isDbConnected
    }
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

// Start server
const startServer = async () => {
  await initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 EchoPrompt API Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
    console.log(`🗄️  Database: ${isDbConnected ? 'MongoDB Connected' : 'Fallback Mode'}`);
    console.log('');
    if (isDbConnected) {
      console.log('✅ Full functionality available with persistent storage');
    } else {
      console.log('⚠️  Limited functionality - data will not persist between restarts');
      console.log('💡 To enable MongoDB: Install MongoDB and set MONGODB_URI environment variable');
    }
  });
};

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;