import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Template from '../models/Template';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse, TemplateQuery } from '../types';
import { PromptGenerator } from '../utils/promptGenerator';

const router = express.Router();

// @route   GET /api/templates
// @desc    Get templates with filtering and pagination
// @access  Public/Private (optional auth)
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sort').optional().isIn(['createdAt', 'usageCount', 'rating', 'name']).withMessage('Invalid sort field'),
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
      category,
      tags,
      search,
      isPublic,
      createdBy,
      sort = 'createdAt',
      order = 'desc'
    } = req.query as TemplateQuery;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};

    // If user is not authenticated, only show public templates
    if (!req.user) {
      query.isPublic = true;
    } else {
      // If user is authenticated, show public templates and their own templates
      if (isPublic !== undefined) {
        query.isPublic = isPublic === 'true';
      } else {
        query.$or = [
          { isPublic: true },
          { createdBy: req.user._id }
        ];
      }
    }

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (createdBy) {
      query.createdBy = createdBy;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sortObj: any = {};
    if (search) {
      sortObj.score = { $meta: 'textScore' };
    }
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Execute query
    const templates = await Template.find(query)
      .populate('createdBy', 'username firstName lastName')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Template.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   GET /api/templates/:id
// @desc    Get a single template
// @access  Public/Private
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('createdBy', 'username firstName lastName avatar');

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      } as ApiResponse);
    }

    // Check if user can access this template
    if (!template.isPublic && (!req.user || template.createdBy._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: template
    } as ApiResponse);

  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   POST /api/templates
// @desc    Create a new template
// @access  Private
router.post('/', authenticate, [
  body('name')
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Name is required and cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('promptData.task')
    .notEmpty()
    .withMessage('Task is required in prompt data'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
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

    const { name, description, promptData, category, tags, isPublic } = req.body;

    // Validate prompt data
    const validation = PromptGenerator.validatePromptData(promptData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid prompt data',
        details: validation.errors
      } as ApiResponse);
    }

    // Check if template name already exists for this user
    const existingTemplate = await Template.findOne({
      name,
      createdBy: req.user!._id
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        error: 'Template with this name already exists'
      } as ApiResponse);
    }

    // Create new template
    const template = new Template({
      name,
      description,
      promptData,
      category,
      tags: tags || [],
      isPublic: isPublic || false,
      createdBy: req.user!._id
    });

    await template.save();

    // Update user's template count
    req.user!.usage.templatesCreated += 1;
    await req.user!.save();

    // Populate creator info
    await template.populate('createdBy', 'username firstName lastName');

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   PUT /api/templates/:id
// @desc    Update a template
// @access  Private
router.put('/:id', authenticate, [
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('promptData.task')
    .optional()
    .notEmpty()
    .withMessage('Task cannot be empty'),
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

    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      } as ApiResponse);
    }

    // Check if user owns this template
    if (template.createdBy.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
    }

    const { name, description, promptData, category, tags, isPublic } = req.body;

    // Validate prompt data if provided
    if (promptData) {
      const validation = PromptGenerator.validatePromptData(promptData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid prompt data',
          details: validation.errors
        } as ApiResponse);
      }
    }

    // Update fields
    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (promptData !== undefined) template.promptData = promptData;
    if (category !== undefined) template.category = category;
    if (tags !== undefined) template.tags = tags;
    if (isPublic !== undefined) template.isPublic = isPublic;

    await template.save();
    await template.populate('createdBy', 'username firstName lastName');

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   DELETE /api/templates/:id
// @desc    Delete a template
// @access  Private
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      } as ApiResponse);
    }

    // Check if user owns this template
    if (template.createdBy.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
    }

    await Template.findByIdAndDelete(req.params.id);

    // Update user's template count
    if (req.user!.usage.templatesCreated > 0) {
      req.user!.usage.templatesCreated -= 1;
      await req.user!.save();
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   POST /api/templates/:id/use
// @desc    Increment template usage count
// @access  Public
router.post('/:id/use', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      } as ApiResponse);
    }

    // Check if user can access this template
    if (!template.isPublic && (!req.user || template.createdBy.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
    }

    await template.incrementUsage();

    res.json({
      success: true,
      data: { usageCount: template.usageCount },
      message: 'Usage count updated'
    } as ApiResponse);

  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   GET /api/templates/categories/list
// @desc    Get list of all categories
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Template.distinct('category');
    
    res.json({
      success: true,
      data: categories.sort()
    } as ApiResponse);

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

export default router;
