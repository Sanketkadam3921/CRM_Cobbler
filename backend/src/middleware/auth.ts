import { Request, Response, NextFunction } from 'express';
import { logAuth } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Get token from header
    const authHeader = req.headers['x-token'] || req.headers['authorization'];
    const token = authHeader?.toString().replace('Bearer ', '');
    
    logAuth.token('Authentication attempt', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      hasToken: !!token
    });
    
    if (!token) {
      logAuth.unauthorized(req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Please provide X-Token in headers'
      });
      return;
    }
    
    // For now, we'll use a simple token validation
    // In production, you'd want to validate against the database
    const expectedToken = process.env.X_TOKEN_SECRET || 'cobbler_super_secret_token_2024';
    
    if (token !== expectedToken) {
      logAuth.unauthorized(req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      res.status(403).json({
        success: false,
        error: 'Invalid token',
        message: 'Access denied'
      });
      return;
    }
    
    // Set user info (for now, using a default user)
    req.user = {
      id: 1,
      username: 'admin'
    };
    
    const duration = Date.now() - startTime;
    logAuth.token('Authentication successful', {
      method: req.method,
      url: req.url,
      duration: `${duration}ms`,
      user: req.user
    });
    
    next();
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logAuth.token('Authentication error', {
      method: req.method,
      url: req.url,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['x-token'] || req.headers['authorization'];
    const token = authHeader?.toString().replace('Bearer ', '');
    
    if (token) {
      const expectedToken = process.env.X_TOKEN_SECRET || 'cobbler_super_secret_token_2024';
      
      if (token === expectedToken) {
        req.user = {
          id: 1,
          username: 'admin'
        };
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't fail the request
    next();
  }
};
