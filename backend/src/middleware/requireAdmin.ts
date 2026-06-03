import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { isAdminUser } from '../utils/admin';

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  if (!isAdminUser(req.user)) {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
};
