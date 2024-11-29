import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { IUser } from '../models/User';
import User from '../models/User';
import { Schema, ValidationErrorItem } from 'joi';

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    lastActivity?: number;
  }
}

interface TokenPayload {
  userId: string;
  deviceId?: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      deviceId?: string;
    }
  }
}

// Strict rate limiting for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per window
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Less strict rate limiting for general API endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 requests per window
  message: 'Too many requests, please try again after 5 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Emergency endpoints have no rate limiting
export const emergencyRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Higher limit for emergency situations
  message: 'Emergency system is currently overwhelmed, please try alternative emergency contacts',
  standardHeaders: true,
  legacyHeaders: false,
});

// Token blacklist with expiration (in memory for demonstration, use Redis in production)
interface BlacklistedToken {
  token: string;
  expiry: number;
}
const tokenBlacklist = new Map<string, number>();

// Clean up expired blacklisted tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (expiry < now) {
      tokenBlacklist.delete(token);
    }
  }
}, 60 * 60 * 1000);

export const blacklistToken = (token: string) => {
  // Store token in blacklist with 24h expiry
  tokenBlacklist.set(token, Date.now() + 24 * 60 * 60 * 1000);
};

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ message: 'Token has been revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as TokenPayload;

    // Check token expiration
    if (Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ message: 'Token has expired' });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Check for suspicious activity
    if (user.lastLoginIP && user.lastLoginIP !== req.ip) {
      // Log suspicious activity
      console.warn(`Suspicious login attempt for user ${user.id} from IP ${req.ip}`);
    }

    // Check session timeout
    if (req.session?.lastActivity) {
      const lastActivity = req.session.lastActivity;
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        return res.status(401).json({ message: 'Session has expired, please login again' });
      }
    }

    // Update last activity
    if (req.session) {
      req.session.lastActivity = Date.now();
    }

    req.user = user;
    req.deviceId = decoded.deviceId;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token has expired' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Role-based authorization with emergency override
export const authorize = (roles: string[], allowEmergency = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Allow emergency access if enabled and user has emergency flag
    if (allowEmergency && req.user.hasEmergencyAccess) {
      // Log emergency access
      console.warn(`Emergency access granted to ${req.user.id} for ${req.path}`);
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Request validation with strict security checks
export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Sanitize input
    const sanitizedBody = sanitizeInput(req.body);
    req.body = sanitizedBody;

    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map((detail: ValidationErrorItem) => ({
          message: detail.message,
          path: detail.path.map(p => String(p)),
          type: detail.type
        }))
      });
    }
    next();
  };
};

// Input sanitization function
const sanitizeInput = (input: any): any => {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      // Remove potential XSS content
      sanitized[key] = value
        .replace(/[<>]/g, '')
        .trim();
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
