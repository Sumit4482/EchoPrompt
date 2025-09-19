import express from 'express';
import { query, validationResult } from 'express-validator';
import User from '../models/User';
import Template from '../models/Template';
import Prompt from '../models/Prompt';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!._id;

    // Get user's template and prompt counts
    const templateCount = await Template.countDocuments({ createdBy: userId });
    const promptCount = await Prompt.countDocuments({ createdBy: userId });
    const publicTemplateCount = await Template.countDocuments({ 
      createdBy: userId, 
      isPublic: true 
    });

    // Get most used templates
    const popularTemplates = await Template.find({ createdBy: userId })
      .sort({ usageCount: -1 })
      .limit(5)
      .select('name usageCount category');

    // Get recent activity
    const recentPrompts = await Prompt.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('templateId', 'name')
      .select('content createdAt templateId metadata');

    // Calculate total template usage
    const templateUsageStats = await Template.aggregate([
      { $match: { createdBy: userId } },
      { $group: { _id: null, totalUsage: { $sum: '$usageCount' } } }
    ]);

    const totalTemplateUsage = templateUsageStats[0]?.totalUsage || 0;

    // Get category distribution
    const categoryStats = await Template.aggregate([
      { $match: { createdBy: userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          templatesCreated: templateCount,
          promptsGenerated: promptCount,
          publicTemplates: publicTemplateCount,
          totalTemplateUsage,
          joinedDate: req.user!.createdAt,
          lastActivity: req.user!.usage.lastActivity
        },
        popularTemplates,
        recentPrompts,
        categoryStats,
        subscription: req.user!.subscription,
        preferences: req.user!.preferences
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   GET /api/users/activity
// @desc    Get user activity timeline
// @access  Private
router.get('/activity', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('type').optional().isIn(['template', 'prompt', 'all']).withMessage('Type must be template, prompt, or all'),
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
      type = 'all'
    } = req.query as { page?: string; limit?: string; type?: 'template' | 'prompt' | 'all' };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const userId = req.user!._id;

    let activities: any[] = [];

    if (type === 'all' || type === 'template') {
      const templates = await Template.find({ createdBy: userId })
        .sort({ createdAt: -1 })
        .skip(type === 'template' ? skip : 0)
        .limit(type === 'template' ? limitNum : limitNum / 2)
        .select('name category createdAt usageCount isPublic');

      activities.push(...templates.map(template => ({
        type: 'template_created',
        id: template._id,
        title: `Created template: ${template.name}`,
        data: template,
        timestamp: template.createdAt
      })));
    }

    if (type === 'all' || type === 'prompt') {
      const prompts = await Prompt.find({ createdBy: userId })
        .sort({ createdAt: -1 })
        .skip(type === 'prompt' ? skip : 0)
        .limit(type === 'prompt' ? limitNum : limitNum / 2)
        .populate('templateId', 'name')
        .select('content createdAt templateId metadata analytics');

      activities.push(...prompts.map(prompt => ({
        type: 'prompt_generated',
        id: prompt._id,
        title: `Generated ${prompt.metadata.optimized ? 'optimized ' : ''}prompt`,
        data: {
          preview: prompt.content.substring(0, 100) + (prompt.content.length > 100 ? '...' : ''),
          template: prompt.templateId,
          wordCount: prompt.wordCount,
          views: prompt.analytics.views,
          copies: prompt.analytics.copies
        },
        timestamp: prompt.createdAt
      })));
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination for combined results
    if (type === 'all') {
      activities = activities.slice(skip, skip + limitNum);
    }

    // Get total count for pagination
    let total = 0;
    if (type === 'all') {
      const templateCount = await Template.countDocuments({ createdBy: userId });
      const promptCount = await Prompt.countDocuments({ createdBy: userId });
      total = templateCount + promptCount;
    } else if (type === 'template') {
      total = await Template.countDocuments({ createdBy: userId });
    } else {
      total = await Prompt.countDocuments({ createdBy: userId });
    }

    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   GET /api/users/export
// @desc    Export user data
// @access  Private
router.get('/export', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!._id;

    // Get all user's templates
    const templates = await Template.find({ createdBy: userId })
      .select('-__v')
      .lean();

    // Get all user's prompts
    const prompts = await Prompt.find({ createdBy: userId })
      .populate('templateId', 'name')
      .select('-__v')
      .lean();

    // User profile data
    const profile = {
      id: req.user!._id,
      email: req.user!.email,
      username: req.user!.username,
      firstName: req.user!.firstName,
      lastName: req.user!.lastName,
      preferences: req.user!.preferences,
      subscription: req.user!.subscription,
      usage: req.user!.usage,
      createdAt: req.user!.createdAt
    };

    const exportData = {
      profile,
      templates,
      prompts,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="echoprompt-export-${userId}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account and all associated data
// @access  Private
router.delete('/account', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!._id;

    // Delete all user's prompts
    await Prompt.deleteMany({ createdBy: userId });

    // Delete all user's templates
    await Template.deleteMany({ createdBy: userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account and all associated data deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get user leaderboard based on public template usage
// @access  Public
router.get('/leaderboard', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
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

    const limit = parseInt(req.query.limit as string || '10');

    // Get top users by total template usage
    const leaderboard = await Template.aggregate([
      { $match: { isPublic: true } },
      { 
        $group: { 
          _id: '$createdBy', 
          totalUsage: { $sum: '$usageCount' },
          templateCount: { $sum: 1 },
          averageRating: { $avg: '$rating.average' }
        } 
      },
      { $sort: { totalUsage: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: '$user.username',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          totalUsage: 1,
          templateCount: 1,
          averageRating: { $round: ['$averageRating', 2] }
        }
      }
    ]);

    res.json({
      success: true,
      data: leaderboard
    } as ApiResponse);

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

export default router;
