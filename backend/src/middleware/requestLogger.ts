import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Log request
  console.log(`📨 ${req.method} ${req.path} - ${req.ip}`);
  
  // Override res.end to log response time
  const originalEnd = res.end.bind(res);
  res.end = function(...args: any[]) {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    
    console.log(`📤 ${req.method} ${req.path} - ${res.statusCode} ${statusColor} - ${duration}ms`);
    
    // Call the original end method
    return originalEnd(...args);
  };
  
  next();
};
