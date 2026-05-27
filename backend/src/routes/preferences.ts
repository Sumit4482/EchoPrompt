import express from 'express';
import { body, validationResult } from 'express-validator';
import { UserPreferences } from '../models/UserPreferences';
import { optionalAuth, authenticate } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

const defaultPreferences = {
  theme: 'system' as const,
  language: 'English',
  aiProvider: 'gemini' as const,
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

// Resolve effective userId: logged-in user id, or 'anonymous'
function resolveUserId(req: AuthenticatedRequest, paramId?: string): string {
  if (req.user) return req.user._id.toString();
  return paramId || 'anonymous';
}

// @route   GET /api/user/preferences
// @access  Optional auth
router.get('/:userId?', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = resolveUserId(req, req.params.userId);
    let preferences = await UserPreferences.findOne({ userId });

    if (!preferences) {
      preferences = new UserPreferences({ userId, preferences: defaultPreferences });
      await preferences.save();
    }

    res.json({ success: true, data: preferences } as ApiResponse);
  } catch (error) {
    console.error('Error retrieving user preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve user preferences' } as ApiResponse);
  }
});

// @route   POST /api/user/preferences
// @access  Optional auth
router.post('/:userId?', optionalAuth, [
  body('preferences').isObject().withMessage('Preferences object is required'),
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() } as ApiResponse);
    }

    const userId = resolveUserId(req, req.params.userId);
    const { preferences } = req.body;

    // Merge incoming preferences with stored ones to prevent partial overwrites
    const existing = await UserPreferences.findOne({ userId });
    const merged = { ...defaultPreferences, ...(existing?.preferences ?? {}), ...preferences };

    const savedPreferences = await UserPreferences.findOneAndUpdate(
      { userId },
      { preferences: merged, lastUpdated: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: savedPreferences, message: 'Preferences saved successfully' } as ApiResponse);
  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to save user preferences' } as ApiResponse);
  }
});

// @route   DELETE /api/user/preferences
// @access  Private
router.delete('/:userId?', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = resolveUserId(req, req.params.userId);
    const result = await UserPreferences.findOneAndDelete({ userId });

    if (!result) {
      return res.status(404).json({ success: false, error: 'User preferences not found' } as ApiResponse);
    }

    res.json({ success: true, message: 'User preferences deleted successfully' } as ApiResponse);
  } catch (error) {
    console.error('Error deleting user preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user preferences' } as ApiResponse);
  }
});

export default router;
