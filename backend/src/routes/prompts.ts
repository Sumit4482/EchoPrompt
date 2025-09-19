import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Prompt } from '../models/Prompt';
import { Template } from '../models/Template';
import Analytics from '../models/Analytics';
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

    const { promptData, templateId, optimize = false, geminiApiKey } = req.body;

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
    let aiEnhanced = false;
    const startTime = Date.now();
    
    try {
      console.log('🤖 Attempting Gemini AI generation...');
      if (geminiApiKey) {
        console.log('🔑 Using user-provided API key');
      }
      content = await geminiService.generatePrompt(promptData, optimize, geminiApiKey);
      aiEnhanced = true;
      console.log('✅ Gemini AI generation successful');
      console.log('📝 Generated content length:', content.length);
    } catch (error) {
      console.error('❌ Gemini generation failed, using fallback:', error);
      // Fallback to local generation
      content = PromptGenerator.generatePrompt(promptData);
      if (optimize) {
        content = PromptGenerator.optimizePrompt(content);
      }
      console.log('🔄 Using local fallback generation');
    }
    
    const generationTime = Date.now() - startTime;

    // Calculate word and character counts
    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = content.length;

    // Create and save the prompt
    const prompt = new Prompt({
      content,
      promptData,
      templateId: templateId || null,
      createdBy: req.user?._id || null,
      wordCount,
      characterCount,
      analytics: {
        views: 0,
        copies: 0,
        exports: 0
      },
      metadata: {
        version: '1.0.0',
        generatedAt: new Date(),
        optimized: optimize,
        aiEnhanced: aiEnhanced
      }
    });

    await prompt.save();

    // Track AI generation analytics
    try {
      await Analytics.logEvent({
        userId: req.user?._id || undefined,
        eventType: aiEnhanced ? 'ai_generation_success' : 'ai_generation_fallback',
        metadata: {
          promptId: prompt._id,
          aiProvider: aiEnhanced ? 'gemini' : 'fallback',
          generationTime: generationTime,
          wordCount: wordCount,
          characterCount: characterCount,
          optimized: optimize,
          sessionId: (req as any).sessionID || undefined
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (analyticsError) {
      console.error('Failed to log AI generation analytics:', analyticsError);
      // Don't fail the request if analytics logging fails
    }

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

// @route   GET /api/prompts/public
// @desc    Get public prompts for library
// @access  Public
router.get('/public', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sort').optional().isIn(['createdAt', 'views', 'copies', 'wordCount']).withMessage('Invalid sort field'),
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
      limit = '20',
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query as any;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query - only public prompts
    const query: any = {
      isPublic: true
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'promptData.role': { $regex: search, $options: 'i' } },
        { 'promptData.task': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
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
      .populate('createdBy', 'username')
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
    console.error('Get public prompts error:', error);
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

// @route   PUT /api/prompts/:id
// @desc    Update a prompt
// @access  Private
router.put('/:id', authenticate, [
  body('content')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Content cannot be empty'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
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

    const { content, isPublic, tags } = req.body;

    // Update fields if provided
    if (content !== undefined) {
      prompt.content = content;
      // Recalculate word and character count
      prompt.wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;
      prompt.characterCount = content.length;
    }
    
    if (isPublic !== undefined) {
      prompt.isPublic = isPublic;
    }
    
    if (tags !== undefined) {
      prompt.tags = tags;
    }

    await prompt.save();

    res.json({
      success: true,
      data: prompt,
      message: 'Prompt updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Update prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   POST /api/prompts/save
// @desc    Save a new prompt (different from generate)
// @access  Private
router.post('/save', authenticate, [
  body('content')
    .notEmpty()
    .withMessage('Content is required'),
  body('promptData.task')
    .notEmpty()
    .withMessage('Task is required in prompt data'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
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

    const { content, promptData, isPublic = false, tags = [] } = req.body;

    // Ensure content is a string
    const contentStr = String(content || '');

    // Calculate word and character count
    const wordCount = contentStr.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
    const characterCount = contentStr.length;

    // Create new prompt
    const prompt = new Prompt({
      content: contentStr,
      promptData,
      isPublic,
      tags,
      createdBy: req.user!._id,
      wordCount,
      characterCount,
      analytics: {
        views: 0,
        copies: 0,
        exports: 0
      },
      metadata: {
        version: '1.0.0',
        generatedAt: new Date(),
        optimized: false,
        aiEnhanced: false
      }
    });

    await prompt.save();

    // Update user's prompt count
    req.user!.usage.promptsGenerated += 1;
    await req.user!.save();

    res.status(201).json({
      success: true,
      data: prompt,
      message: 'Prompt saved successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Save prompt error:', error);
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


export default router;
