import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Prompt from '../models/Prompt';
import Template from '../models/Template';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse, PromptQuery, ExportFormat } from '../types';
import { PromptGenerator } from '../utils/promptGenerator';
import { geminiService } from '../services/geminiService';

const router = express.Router();

// @route   POST /api/prompts/generate
// @desc    Generate a new prompt
// @access  Public/Private (optional auth)
router.post('/generate', optionalAuth, [
  body('promptData.task')
    .notEmpty()
    .withMessage('Task is required'),
  body('templateId')
    .optional()
    .isMongoId()
    .withMessage('Invalid template ID'),
  body('optimize')
    .optional()
    .isBoolean()
    .withMessage('Optimize must be a boolean'),
], async (req: AuthenticatedRequest, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const { promptData, templateId, optimize = false } = req.body;

    // Validate prompt data
    const validation = PromptGenerator.validatePromptData(promptData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid prompt data',
        details: validation.errors
      } as ApiResponse);
    }

    // Generate the prompt content using Gemini AI
    let content: string;
    try {
      content = await geminiService.generatePrompt(promptData, optimize);
    } catch (error) {
      console.error('Gemini generation failed, using fallback:', error);
      // Fallback to local generation
      content = PromptGenerator.generatePrompt(promptData);
      if (optimize) {
        content = PromptGenerator.optimizePrompt(content);
      }
    }

    // Create and save the prompt
    const prompt = new Prompt({
      content,
      promptData,
      templateId: templateId || null,
      createdBy: req.user?._id || null,
      metadata: {
        version: '1.0.0',
        generatedAt: new Date(),
        optimized: optimize,
        aiEnhanced: false // TODO: Implement AI enhancement
      }
    });

    await prompt.save();

    // Update user's prompt count if authenticated
    if (req.user) {
      req.user.usage.promptsGenerated += 1;
      await req.user.save();
    }

    // If generated from a template, increment its usage
    if (templateId) {
      const template = await Template.findById(templateId);
      if (template) {
        await template.incrementUsage();
      }
    }

    res.status(201).json({
      success: true,
      data: {
        prompt,
        metadata: {
          wordCount: prompt.wordCount,
          characterCount: prompt.characterCount,
          complexityScore: PromptGenerator.calculateComplexityScore(promptData),
          keywords: PromptGenerator.extractKeywords(promptData)
        }
      },
      message: 'Prompt generated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Generate prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   GET /api/prompts
// @desc    Get prompts with filtering and pagination
// @access  Private
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('templateId').optional().isMongoId().withMessage('Invalid template ID'),
  query('sort').optional().isIn(['createdAt', 'views', 'copies']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
], async (req: AuthenticatedRequest, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const {
      page = '1',
      limit = '10',
      templateId,
      createdBy,
      optimized,
      sort = 'createdAt',
      order = 'desc'
    } = req.query as PromptQuery;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query - user can only see their own prompts
    const query: any = {
      createdBy: req.user!._id
    };

    if (templateId) {
      query.templateId = templateId;
    }

    if (createdBy) {
      query.createdBy = createdBy;
    }

    if (optimized !== undefined) {
      query['metadata.optimized'] = optimized === 'true';
    }

    // Build sort object
    const sortObj: any = {};
    if (sort === 'views') {
      sortObj['analytics.views'] = order === 'desc' ? -1 : 1;
    } else if (sort === 'copies') {
      sortObj['analytics.copies'] = order === 'desc' ? -1 : 1;
    } else {
      sortObj[sort] = order === 'desc' ? -1 : 1;
    }

    // Execute query
    const prompts = await Prompt.find(query)
      .populate('templateId', 'name category')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Prompt.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: prompts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get prompts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   GET /api/prompts/:id
// @desc    Get a single prompt
// @access  Private
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id)
      .populate('templateId', 'name category')
      .populate('createdBy', 'username firstName lastName');

    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found'
      } as ApiResponse);
    }

    // Check if user owns this prompt
    if (prompt.createdBy && prompt.createdBy._id.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
    }

    // Increment view count
    await prompt.incrementViews();

    res.json({
      success: true,
      data: prompt
    } as ApiResponse);

  } catch (error) {
    console.error('Get prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   DELETE /api/prompts/:id
// @desc    Delete a prompt
// @access  Private
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);

    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found'
      } as ApiResponse);
    }

    // Check if user owns this prompt
    if (prompt.createdBy && prompt.createdBy.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
    }

    await Prompt.findByIdAndDelete(req.params.id);

    // Update user's prompt count
    if (req.user!.usage.promptsGenerated > 0) {
      req.user!.usage.promptsGenerated -= 1;
      await req.user!.save();
    }

    res.json({
      success: true,
      message: 'Prompt deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Delete prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   POST /api/prompts/:id/copy
// @desc    Increment copy count
// @access  Public
router.post('/:id/copy', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);

    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found'
      } as ApiResponse);
    }

    await prompt.incrementCopies();

    res.json({
      success: true,
      data: { copies: prompt.analytics.copies },
      message: 'Copy count updated'
    } as ApiResponse);

  } catch (error) {
    console.error('Copy prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   POST /api/prompts/:id/export
// @desc    Export prompt in various formats
// @access  Public
router.post('/:id/export', optionalAuth, [
  body('format')
    .isIn(['txt', 'json', 'markdown', 'csv'])
    .withMessage('Format must be txt, json, markdown, or csv'),
], async (req: AuthenticatedRequest, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const { format } = req.body as { format: ExportFormat };
    const prompt = await Prompt.findById(req.params.id);

    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found'
      } as ApiResponse);
    }

    // Increment export count
    await prompt.incrementExports();

    let content: string;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'txt':
        content = prompt.content;
        mimeType = 'text/plain';
        filename = `echoprompt-${prompt._id}.txt`;
        break;
      case 'json':
        content = PromptGenerator.generateJSON(prompt.content, {
          id: prompt._id,
          promptData: prompt.promptData,
          metadata: prompt.metadata,
          analytics: prompt.analytics
        });
        mimeType = 'application/json';
        filename = `echoprompt-${prompt._id}.json`;
        break;
      case 'markdown':
        content = PromptGenerator.generateMarkdown(prompt.content);
        mimeType = 'text/markdown';
        filename = `echoprompt-${prompt._id}.md`;
        break;
      case 'csv':
        // Simple CSV format for prompt data
        content = 'Field,Value\n';
        Object.entries(prompt.promptData).forEach(([key, value]) => {
          if (value) {
            content += `"${key}","${value.replace(/"/g, '""')}"\n`;
          }
        });
        content += `"Generated Content","${prompt.content.replace(/"/g, '""')}"`;
        mimeType = 'text/csv';
        filename = `echoprompt-${prompt._id}.csv`;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported format'
        } as ApiResponse);
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);

  } catch (error) {
    console.error('Export prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   POST /api/prompts/:id/rate
// @desc    Rate a prompt
// @access  Private
router.post('/:id/rate', authenticate, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Feedback cannot exceed 500 characters'),
], async (req: AuthenticatedRequest, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const { rating, feedback } = req.body;
    const prompt = await Prompt.findById(req.params.id);

    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found'
      } as ApiResponse);
    }

    await prompt.addRating(req.user!._id.toString(), rating, feedback);

    res.json({
      success: true,
      data: {
        averageRating: prompt.averageRating,
        totalRatings: prompt.analytics.ratings.length
      },
      message: 'Rating added successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Rate prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   POST /api/prompts/format
// @desc    Format prompt content in different styles
// @access  Public
router.post('/format', [
  body('content')
    .notEmpty()
    .withMessage('Content is required'),
  body('format')
    .isIn(['markdown', 'json', 'table'])
    .withMessage('Format must be markdown, json, or table'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const { content, format } = req.body;
    let formattedContent: string;

    switch (format) {
      case 'markdown':
        formattedContent = PromptGenerator.generateMarkdown(content);
        break;
      case 'json':
        formattedContent = PromptGenerator.generateJSON(content);
        break;
      case 'table':
        formattedContent = PromptGenerator.generateTable(content);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported format'
        } as ApiResponse);
    }

    res.json({
      success: true,
      data: {
        original: content,
        formatted: formattedContent,
        format
      },
      message: 'Content formatted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Format content error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   POST /api/prompts/suggestions
// @desc    Get AI-powered suggestions for fields
// @access  Public
router.post('/suggestions', [
  body('field')
    .notEmpty()
    .withMessage('Field is required'),
  body('partialText')
    .optional()
    .isString()
    .withMessage('Partial text must be a string'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const { field, partialText = '' } = req.body;

    try {
      const suggestions = await geminiService.getSuggestions(field, partialText);
      
      res.json({
        success: true,
        data: {
          field,
          partialText,
          suggestions
        },
        message: 'Suggestions generated successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      
      // Fallback suggestions
      const fallbackSuggestions = getFallbackSuggestions(field, partialText);
      
      res.json({
        success: true,
        data: {
          field,
          partialText,
          suggestions: fallbackSuggestions
        },
        message: 'Fallback suggestions provided'
      } as ApiResponse);
    }

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   POST /api/prompts/complete
// @desc    Get AI-powered auto-completion for partial text
// @access  Public
router.post('/complete', [
  body('field')
    .notEmpty()
    .withMessage('Field is required'),
  body('partialText')
    .notEmpty()
    .withMessage('Partial text is required'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const { field, partialText } = req.body;

    try {
      const completions = await geminiService.getFieldCompletion(field, partialText);
      
      res.json({
        success: true,
        data: {
          field,
          partialText,
          completions
        },
        message: 'Completions generated successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting completions:', error);
      
      // Fallback completions
      const fallbackCompletions = getFallbackCompletions(field, partialText);
      
      res.json({
        success: true,
        data: {
          field,
          partialText,
          completions: fallbackCompletions
        },
        message: 'Fallback completions provided'
      } as ApiResponse);
    }

  } catch (error) {
    console.error('Completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// Helper functions for fallback suggestions
function getFallbackSuggestions(field: string, partialText: string): string[] {
  const suggestions: Record<string, string[]> = {
    role: [
      'Software Engineer', 'Full Stack Developer', 'Data Scientist', 'Product Manager',
      'UX/UI Designer', 'DevOps Engineer', 'Technical Writer', 'Marketing Specialist',
      'Content Creator', 'Business Analyst', 'Project Manager', 'Cybersecurity Expert'
    ],
    task: [
      'Write comprehensive documentation for',
      'Create a detailed guide on how to',
      'Develop a strategy for implementing',
      'Analyze and provide insights on',
      'Design a user-friendly solution for',
      'Build a scalable system that can'
    ],
    context: [
      'Enterprise software development',
      'Startup environment with limited resources',
      'Educational content for beginners',
      'Production system with high availability',
      'Mobile-first application design',
      'Cloud-native architecture'
    ],
    tone: [
      'Professional and authoritative',
      'Friendly and conversational',
      'Technical and precise',
      'Creative and engaging',
      'Casual and approachable',
      'Formal and structured'
    ],
    outputFormat: [
      'Markdown with code examples',
      'JSON structured data',
      'Step-by-step bullet points',
      'Professional documentation',
      'Interactive tutorial format',
      'Executive summary format'
    ]
  };

  return suggestions[field.toLowerCase()] || [];
}

function getFallbackCompletions(field: string, partialText: string): string[] {
  const completions: Record<string, Record<string, string[]>> = {
    role: {
      'full': ['Full Stack Developer', 'Full Stack Engineer', 'Full Stack Architect'],
      'senior': ['Senior Software Engineer', 'Senior Developer', 'Senior Data Scientist'],
      'lead': ['Lead Developer', 'Lead Engineer', 'Lead Designer'],
      'data': ['Data Scientist', 'Data Engineer', 'Data Analyst'],
      'product': ['Product Manager', 'Product Owner', 'Product Designer'],
      'tech': ['Technical Writer', 'Technical Lead', 'Technical Architect'],
      'ux': ['UX Designer', 'UX Researcher', 'UX Writer'],
      'dev': ['DevOps Engineer', 'Developer', 'Development Manager']
    }
  };

  const fieldCompletions = completions[field.toLowerCase()];
  if (!fieldCompletions) return [];

  const lowerPartial = partialText.toLowerCase();
  for (const [key, values] of Object.entries(fieldCompletions)) {
    if (key.startsWith(lowerPartial)) {
      return values;
    }
  }

  return [];
}

export default router;
