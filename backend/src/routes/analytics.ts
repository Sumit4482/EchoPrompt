import express from 'express';
import { query, validationResult } from 'express-validator';
import { Template } from '../models/Template';
import { Prompt } from '../models/Prompt';
import User from '../models/User';
import Analytics from '../models/Analytics';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// @route   GET /api/analytics/overview
// @desc    Get platform overview statistics
// @access  Public
router.get('/overview', async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments();
    const totalTemplates = await Template.countDocuments({ isPublic: true });
    const totalPrompts = await Prompt.countDocuments();

    // Get total template usage
    const templateUsageStats = await Template.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: null, totalUsage: { $sum: '$usageCount' } } }
    ]);

    const totalTemplateUsage = templateUsageStats[0]?.totalUsage || 0;

    // Get category distribution
    const categoryStats = await Template.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, usage: { $sum: '$usageCount' } } },
      { $sort: { count: -1 } }
    ]);

    // Get top templates
    const topTemplates = await Template.find({ isPublic: true })
      .sort({ usageCount: -1 })
      .limit(5)
      .populate('createdBy', 'username firstName lastName')
      .select('name category usageCount rating createdBy');

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTemplates = await Template.countDocuments({ 
      isPublic: true,
      createdAt: { $gte: sevenDaysAgo } 
    });

    const recentPrompts = await Prompt.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalTemplates,
          totalPrompts,
          totalTemplateUsage
        },
        categoryStats,
        topTemplates,
        recentActivity: {
          newTemplates: recentTemplates,
          promptsGenerated: recentPrompts,
          period: '7 days'
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get overview analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   GET /api/analytics/trending
// @desc    Get trending templates and prompts
// @access  Public
router.get('/trending', [
  query('period').optional().isIn(['24h', '7d', '30d']).withMessage('Period must be 24h, 7d, or 30d'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
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

    const period = req.query.period as string || '7d';
    const limit = parseInt(req.query.limit as string || '10');

    // Calculate date range
    const now = new Date();
    const periodStart = new Date();

    switch (period) {
      case '24h':
        periodStart.setHours(now.getHours() - 24);
        break;
      case '7d':
        periodStart.setDate(now.getDate() - 7);
        break;
      case '30d':
        periodStart.setDate(now.getDate() - 30);
        break;
    }

    // Get trending templates (most used in period)
    const trendingTemplates = await Template.find({
      isPublic: true,
      updatedAt: { $gte: periodStart }
    })
      .sort({ usageCount: -1, 'rating.average': -1 })
      .limit(limit)
      .populate('createdBy', 'username firstName lastName')
      .select('name category usageCount rating createdBy createdAt tags');

    // Get most generated prompts in period
    const trendingPrompts = await Prompt.find({
      createdAt: { $gte: periodStart }
    })
      .sort({ 'analytics.views': -1, 'analytics.copies': -1 })
      .limit(limit)
      .populate('templateId', 'name category')
      .populate('createdBy', 'username firstName lastName')
      .select('content templateId analytics createdAt metadata');

    // Get trending categories
    const trendingCategories = await Template.aggregate([
      { 
        $match: { 
          isPublic: true,
          updatedAt: { $gte: periodStart }
        }
      },
      { 
        $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          totalUsage: { $sum: '$usageCount' },
          avgRating: { $avg: '$rating.average' }
        } 
      },
      { $sort: { totalUsage: -1, count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        period,
        templates: trendingTemplates,
        prompts: trendingPrompts.map(prompt => ({
          ...prompt.toJSON(),
          preview: prompt.content.substring(0, 150) + (prompt.content.length > 150 ? '...' : '')
        })),
        categories: trendingCategories
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get trending analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   GET /api/analytics/user-insights
// @desc    Get user-specific analytics (private)
// @access  Private
router.get('/user-insights', authenticate, [
  query('period').optional().isIn(['7d', '30d', '90d', 'all']).withMessage('Period must be 7d, 30d, 90d, or all'),
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

    const period = req.query.period as string || '30d';
    const userId = req.user!._id;

    // Calculate date range
    let dateFilter: any = {};
    if (period !== 'all') {
      const now = new Date();
      const periodStart = new Date();

      switch (period) {
        case '7d':
          periodStart.setDate(now.getDate() - 7);
          break;
        case '30d':
          periodStart.setDate(now.getDate() - 30);
          break;
        case '90d':
          periodStart.setDate(now.getDate() - 90);
          break;
      }

      dateFilter = { createdAt: { $gte: periodStart } };
    }

    // Get user's template performance
    const templateStats = await Template.aggregate([
      { $match: { createdBy: userId, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalTemplates: { $sum: 1 },
          totalUsage: { $sum: '$usageCount' },
          avgRating: { $avg: '$rating.average' },
          publicTemplates: { $sum: { $cond: ['$isPublic', 1, 0] } }
        }
      }
    ]);

    // Get user's prompt generation stats
    const promptStats = await Prompt.aggregate([
      { $match: { createdBy: userId, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalPrompts: { $sum: 1 },
          totalViews: { $sum: '$analytics.views' },
          totalCopies: { $sum: '$analytics.copies' },
          totalExports: { $sum: '$analytics.exports' },
          optimizedPrompts: { $sum: { $cond: ['$metadata.optimized', 1, 0] } }
        }
      }
    ]);

    // Get template performance by category
    const categoryPerformance = await Template.aggregate([
      { $match: { createdBy: userId, ...dateFilter } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalUsage: { $sum: '$usageCount' },
          avgRating: { $avg: '$rating.average' }
        }
      },
      { $sort: { totalUsage: -1 } }
    ]);

    // Get daily activity for the period
    const dailyActivity = await Prompt.aggregate([
      { $match: { createdBy: userId, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          promptsGenerated: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get top performing templates
    const topTemplates = await Template.find({ 
      createdBy: userId, 
      ...dateFilter 
    })
      .sort({ usageCount: -1, 'rating.average': -1 })
      .limit(5)
      .select('name category usageCount rating isPublic createdAt');

    const stats = {
      templates: templateStats[0] || {
        totalTemplates: 0,
        totalUsage: 0,
        avgRating: 0,
        publicTemplates: 0
      },
      prompts: promptStats[0] || {
        totalPrompts: 0,
        totalViews: 0,
        totalCopies: 0,
        totalExports: 0,
        optimizedPrompts: 0
      },
      categoryPerformance,
      dailyActivity,
      topTemplates,
      period
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse);

  } catch (error) {
    console.error('Get user insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   GET /api/analytics/ai-generation
// @desc    Get AI generation statistics and success rates
// @access  Public
router.get('/ai-generation', async (req, res) => {
  try {
    // Get AI generation stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const aiStats = await Analytics.getAIGenerationStats(thirtyDaysAgo);
    
    // Calculate success rate
    const successCount = aiStats.find(stat => stat.eventType === 'ai_generation_success')?.count || 0;
    const fallbackCount = aiStats.find(stat => stat.eventType === 'ai_generation_fallback')?.count || 0;
    const totalAttempts = successCount + fallbackCount;
    const successRate = totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0;

    // Get recent AI generation events (last 10)
    const recentEvents = await Analytics.find({
      eventType: { $in: ['ai_generation_success', 'ai_generation_fallback'] }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'username')
    .select('eventType metadata createdAt userId');

    res.json({
      success: true,
      data: {
        successRate: Math.round(successRate * 100) / 100,
        totalAttempts,
        successCount,
        fallbackCount,
        stats: aiStats,
        recentEvents: recentEvents.map(event => ({
          eventType: event.eventType,
          aiProvider: event.metadata.aiProvider,
          generationTime: event.metadata.generationTime,
          wordCount: event.metadata.wordCount,
          optimized: event.metadata.optimized,
          createdAt: event.createdAt,
          user: event.userId ? {
            username: (event.userId as any).username
          } : null
        }))
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching AI generation analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

// @route   GET /api/analytics/search
// @desc    Get search analytics and suggestions
// @access  Public
router.get('/search', [
  query('q').optional().isString().withMessage('Query must be a string'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
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

    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string || '10');

    if (!query) {
      // Return popular search suggestions
      const popularCategories = await Template.aggregate([
        { $match: { isPublic: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      const popularTags = await Template.aggregate([
        { $match: { isPublic: true } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      return res.json({
        success: true,
        data: {
          suggestions: {
            categories: popularCategories.map(cat => ({
              name: cat._id,
              count: cat.count
            })),
            tags: popularTags.map(tag => ({
              name: tag._id,
              count: tag.count
            }))
          }
        }
      } as ApiResponse);
    }

    // Search templates
    const templates = await Template.find({
      $text: { $search: query },
      isPublic: true
    }, {
      score: { $meta: 'textScore' }
    })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .populate('createdBy', 'username firstName lastName')
      .select('name description category tags usageCount rating createdBy');

    // Get related categories and tags
    const relatedCategories = await Template.aggregate([
      { 
        $match: { 
          $text: { $search: query },
          isPublic: true
        }
      },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const relatedTags = await Template.aggregate([
      { 
        $match: { 
          $text: { $search: query },
          isPublic: true
        }
      },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        query,
        results: templates,
        related: {
          categories: relatedCategories.map(cat => ({
            name: cat._id,
            count: cat.count
          })),
          tags: relatedTags.map(tag => ({
            name: tag._id,
            count: tag.count
          }))
        },
        total: templates.length
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    } as ApiResponse);
  }
});

export default router;
