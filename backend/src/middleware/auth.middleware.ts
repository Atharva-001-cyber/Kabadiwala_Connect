import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'kabadiwala-connect-sih2026-secret-key';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    phone: string;
    role: UserRole;
    name: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      phone: string;
      role: UserRole;
      name: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      phone: string;
      role: UserRole;
      name: string;
    };
    req.user = decoded;
  } catch (err) {
    // Ignore invalid optional token
  }
  next();
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This operation requires one of [${roles.join(', ')}] roles.`
      });
    }
    next();
  };
};

export const requireAuthorizedRecycler = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
  }

  // Only RECYCLER or ADMIN can access recycler operations
  if (req.user.role !== 'RECYCLER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Only registered recyclers can perform this operation.'
    });
  }

  // Admin bypasses recycler-specific facility status check
  if (req.user.role === 'ADMIN') {
    return next();
  }

  const { db } = require('../db/store');
  const recycler = db.recyclers.find(
    (r: any) => r.userId === req.user?.userId || r.contactPhone === req.user?.phone
  );

  if (!recycler) {
    return res.status(403).json({
      success: false,
      authorizationStatus: 'UNREGISTERED',
      message: 'Access denied: No registered recycler facility profile found for this account.'
    });
  }

  if (recycler.authorizationStatus === 'PENDING_VERIFICATION') {
    return res.status(403).json({
      success: false,
      authorizationStatus: 'PENDING_VERIFICATION',
      message: 'Operation restricted: Your facility authorization is pending CPCB/SPCB regulatory verification. Formal operations are locked until approved.'
    });
  }

  if (recycler.authorizationStatus === 'SUSPENDED') {
    return res.status(403).json({
      success: false,
      authorizationStatus: 'SUSPENDED',
      message: 'Operation denied: Your facility authorization has been suspended by regulatory authority. All operations are blocked.'
    });
  }

  next();
};
