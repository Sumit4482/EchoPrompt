const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all for testing
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

// Simple auth endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('📨 LOGIN REQUEST RECEIVED');
  console.log('Body:', req.body);
  
  const { identifier, password } = req.body || {};
  console.log('📨 Login attempt:', { identifier, hasPassword: !!password });
  
  if (!identifier || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).json({
      success: false,
      error: 'Email/username and password are required'
    });
  }

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

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString()
  });
});

// User preferences endpoints
app.get('/api/user/preferences/:userId?', (req, res) => {
  console.log('📨 GET user preferences request');
  const defaultPreferences = {
    theme: 'dark',
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
  };

  res.status(200).json({
    success: true,
    data: {
      preferences: defaultPreferences
    }
  });
});

app.post('/api/user/preferences/:userId?', (req, res) => {
  console.log('📨 POST user preferences request');
  console.log('Preferences:', req.body);
  
  res.status(200).json({
    success: true,
    message: 'Preferences saved successfully'
  });
});

// Templates endpoints
app.get('/api/templates', (req, res) => {
  console.log('📨 GET templates request');
  const mockTemplates = [
    {
      _id: '1',
      name: 'Code Review Template',
      description: 'Template for code review prompts',
      category: 'Development',
      tags: ['code', 'review'],
      isPublic: true,
      usageCount: 15,
      rating: { average: 4.5, count: 8 },
      promptData: {
        role: 'Senior Software Engineer',
        task: 'Review code for best practices',
        tone: 'Professional',
        outputFormat: 'Markdown'
      },
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      name: 'Marketing Copy Template',
      description: 'Template for marketing content',
      category: 'Marketing',
      tags: ['marketing', 'copy'],
      isPublic: true,
      usageCount: 23,
      rating: { average: 4.2, count: 12 },
      promptData: {
        role: 'Marketing Specialist',
        task: 'Create engaging marketing copy',
        tone: 'Friendly',
        outputFormat: 'Text'
      },
      createdAt: new Date().toISOString()
    }
  ];

  res.status(200).json({
    success: true,
    data: mockTemplates
  });
});

app.post('/api/templates', (req, res) => {
  console.log('📨 POST template request');
  console.log('Template data:', req.body);
  
  const newTemplate = {
    _id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    rating: { average: 0, count: 0 }
  };

  res.status(200).json({
    success: true,
    data: newTemplate,
    message: 'Template saved successfully'
  });
});

// Get template by ID
app.get('/api/templates/:id', (req, res) => {
  console.log('📨 GET template by ID request:', req.params.id);
  
  // Mock single template
  const template = {
    _id: req.params.id,
    name: 'Sample Template',
    description: 'A sample template for demonstration',
    category: 'General',
    tags: ['sample', 'demo'],
    isPublic: true,
    usageCount: 10,
    rating: { average: 4.0, count: 5 },
    promptData: {
      role: 'Assistant',
      task: 'Help with general tasks',
      tone: 'Professional',
      outputFormat: 'Text'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    data: template
  });
});

// Update template
app.put('/api/templates/:id', (req, res) => {
  console.log('📨 PUT template request:', req.params.id);
  console.log('Update data:', req.body);
  
  const updatedTemplate = {
    _id: req.params.id,
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    data: updatedTemplate,
    message: 'Template updated successfully'
  });
});

// Delete template
app.delete('/api/templates/:id', (req, res) => {
  console.log('📨 DELETE template request:', req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'Template deleted successfully'
  });
});

// Use template (increment usage count)
app.post('/api/templates/:id/use', (req, res) => {
  console.log('📨 USE template request:', req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'Template usage recorded'
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Auth Test Server running on port ${PORT}`);
});
