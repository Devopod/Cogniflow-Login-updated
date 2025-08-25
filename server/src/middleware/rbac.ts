import { Request, Response, NextFunction } from 'express';

export type Role = 'admin' | 'manager' | 'staff' | 'viewer';

export const requireRole = (role: Role) => (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (!user) return res.status(401).json({ message: 'Authentication required' });
  if (user.role === 'admin') return next();
  if (user.role === role) return next();
  return res.status(403).json({ message: 'Insufficient role' });
};

export const requireAnyRole = (roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (!user) return res.status(401).json({ message: 'Authentication required' });
  if (user.role === 'admin') return next();
  if (roles.includes(user.role)) return next();
  return res.status(403).json({ message: 'Insufficient role' });
};

export const requirePermission = (permission: string) => (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (!user) return res.status(401).json({ message: 'Authentication required' });
  if (user.role === 'admin') return next();
  const perms: string[] = (user.permissions || []) as string[];
  if (perms.includes(permission)) return next();
  return res.status(403).json({ message: 'Missing permission', permission });
};


