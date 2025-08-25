import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayloadShape {
  id: number;
  email: string;
  role: string;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring('Bearer '.length);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT secret missing' });
    }

    const decoded = jwt.verify(token, secret) as JwtPayloadShape;

    // Attach a minimal user object compatible with existing code expectations
    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdminJWT = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || (req.user as any).role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
};


