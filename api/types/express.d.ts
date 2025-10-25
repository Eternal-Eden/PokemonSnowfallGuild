/**
 * Express type definitions for API backend
 * Extends Express Request interface to include user property
 */

import { Request } from 'express';

// User interface for authenticated requests
export interface AuthenticatedUser {
  id: string;
  username: string;
  role: string;
  email?: string;
  userId?: string; // For backward compatibility
}

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      rawBody?: Buffer;
    }
  }
}

// Export the interface for use in other files
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface OptionalAuthRequest extends Request {
  user?: AuthenticatedUser;
}