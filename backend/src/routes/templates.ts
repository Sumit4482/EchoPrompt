import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Template } from '../models/Template';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse, TemplateQuery } from '../types';
import { PromptGenerator } from '../utils/promptGenerator';

const router = express.Router();

// ─── IMPORTANT: specific routes MUST come before /:id ─────────────────────────

// @route   GET /api/templates/categories/list
// @desc    Get list of all unique categories
// @access  Public
router.get('/categories/list', async (_req, res) => {
  try {
    const categories = await Template.distinct('category', { category: { $ne: null } });
    res.json({ success: true, data: (categories as string[]).sort() } as ApiResponse);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Server error' } as ApiResponse);
  }
});

// @route   GET /api/templates
// @desc    Get templates with filtering and pagination
//          ?mine=true   → only the authenticated user's own templates
//          ?isPublic=true → only public templates (unauthenticated default)
// @access  Public/Private (optional auth)
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('mine').optional().isIn(['true', 'false']),
  query('sort').optional().isIn(['createdAt', 'usageCount', 'rating', 'name']),
  query('order').optional().isIn(['asc', 'desc']),
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() } as ApiResponse);
    }

    const {
      page = '1', limit = '10',
      category, tags, search,
      isPublic, mine, createdBy,
      sort = 'createdAt', order = 'desc',
    } = req.query as TemplateQuery & { mine?: string };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build visibility filter
    const filter: any = {};

    if (!req.user) {
      // Unauthenticated: public only
      filter.isPublic = true;
    } else if (mine === 'true') {
      // My templates only
      filter.createdBy = req.user._id;
    } else if (isPublic !== undefined) {
      // Explicit isPublic filter
      filter.isPublic = isPublic === 'true';
    } else if (createdBy) {
      filter.createdBy = createdBy;
    } else {
      // Authenticated default: public OR own
      filter.$or = [{ isPublic: true }, { createdBy: req.user._id }];
    }

    if (category) filter.category = category;
    if (tags) {
      const tagArray = (tags as string).split(',').map(t => t.trim());
      filter.tags = { $in: tagArray };
    }
    if (search) filter.$text = { $search: search };

    // Build sort
    const sortObj: any = {};
    if (search) sortObj.score = { $meta: 'textScore' };
    if (sort === 'rating') {
      sortObj['rating.average'] = order === 'desc' ? -1 : 1;
    } else {
      sortObj[sort] = order === 'desc' ? -1 : 1;
    }

    const [templates, total] = await Promise.all([
      Template.find(filter)
        .populate('createdBy', 'username firstName lastName')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Template.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: templates,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    } as ApiResponse);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, error: 'Server error' } as ApiResponse);
  }
});

// @route   GET /api/templates/:id
// @access  Public/Private
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('createdBy', 'username firstName lastName');

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' } as ApiResponse);
    }

    const ownerId = _resolveOwnerId(template.createdBy);
    if (!template.isPublic && (!req.user || ownerId !== req.user._id.toString())) {
      return res.status(403).json({ success: false, error: 'Access denied' } as ApiResponse);
    }

    res.json({ success: true, data: template } as ApiResponse);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ success: false, error: 'Server error' } as ApiResponse);
  }
});

// @route   POST /api/templates
// @access  Private
router.post('/', authenticate, [
  body('name').notEmpty().isLength({ max: 100 }).withMessage('Name is required and cannot exceed 100 characters'),
  body('description').optional().isLength({ max: 500 }),
  body('promptData.task').notEmpty().withMessage('Task is required in prompt data'),
  body('category').notEmpty().withMessage('Category is required'),
  body('tags').optional().isArray(),
  body('isPublic').optional().isBoolean(),
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() } as ApiResponse);
    }

    const { name, description, promptData, category, tags, isPublic } = req.body;

    const validation = PromptGenerator.validatePromptData(promptData);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: 'Invalid prompt data', details: validation.errors } as ApiResponse);
    }

    const existingTemplate = await Template.findOne({ name, createdBy: req.user!._id });
    if (existingTemplate) {
      return res.status(400).json({ success: false, error: 'A template with this name already exists' } as ApiResponse);
    }

    const template = new Template({
      name, description, promptData, category,
      tags: tags || [], isPublic: isPublic ?? false,
      createdBy: req.user!._id,
    });

    await template.save();
    req.user!.usage.templatesCreated += 1;
    await req.user!.save();
    await template.populate('createdBy', 'username firstName lastName');

    res.status(201).json({ success: true, data: template, message: 'Template created successfully' } as ApiResponse);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ success: false, error: 'Server error' } as ApiResponse);
  }
});

// @route   PUT /api/templates/:id
// @access  Private (owner only)
router.put('/:id', authenticate, [
  body('name').optional().isLength({ max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('promptData.task').optional().notEmpty().withMessage('Task cannot be empty'),
  body('tags').optional().isArray(),
  body('isPublic').optional().isBoolean(),
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() } as ApiResponse);
    }

    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' } as ApiResponse);
    }

    const ownerId = _resolveOwnerId(template.createdBy);
    if (ownerId !== req.user!._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' } as ApiResponse);
    }

    const { name, description, promptData, category, tags, isPublic } = req.body;

    if (promptData) {
      const validation = PromptGenerator.validatePromptData(promptData);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, error: 'Invalid prompt data', details: validation.errors } as ApiResponse);
      }
    }

    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (promptData !== undefined) template.promptData = promptData;
    if (category !== undefined) template.category = category;
    if (tags !== undefined) template.tags = tags;
    if (isPublic !== undefined) template.isPublic = isPublic;

    await template.save();
    await template.populate('createdBy', 'username firstName lastName');

    res.json({ success: true, data: template, message: 'Template updated successfully' } as ApiResponse);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ success: false, error: 'Server error' } as ApiResponse);
  }
});

// @route   DELETE /api/templates/:id
// @access  Private (owner only)
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' } as ApiResponse);
    }

    const ownerId = _resolveOwnerId(template.createdBy);
    if (ownerId !== req.user!._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' } as ApiResponse);
    }

    await Template.findByIdAndDelete(req.params.id);

    if (req.user!.usage.templatesCreated > 0) {
      req.user!.usage.templatesCreated -= 1;
      await req.user!.save();
    }

    res.json({ success: true, message: 'Template deleted successfully' } as ApiResponse);
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ success: false, error: 'Server error' } as ApiResponse);
  }
});

// @route   POST /api/templates/:id/use
// @access  Public
router.post('/:id/use', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' } as ApiResponse);
    }

    const ownerId = _resolveOwnerId(template.createdBy);
    if (!template.isPublic && (!req.user || ownerId !== req.user._id.toString())) {
      return res.status(403).json({ success: false, error: 'Access denied' } as ApiResponse);
    }

    await template.incrementUsage();

    res.json({ success: true, data: { usageCount: template.usageCount }, message: 'Usage count updated' } as ApiResponse);
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({ success: false, error: 'Server error' } as ApiResponse);
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _resolveOwnerId(createdBy: any): string | undefined {
  if (!createdBy) return undefined;
  if (typeof createdBy === 'object' && '_id' in createdBy) return createdBy._id.toString();
  return createdBy.toString();
}

export default router;
