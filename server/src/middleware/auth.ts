import { Request, Response, NextFunction } from 'express';

// Middleware to check if the user is authenticated
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  
  res.status(401).json({ 
    message: "Authentication required",
    error: "Please log in to access this resource" 
  });
};

// Middleware to check if the user has admin role
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ 
      message: "Authentication required",
      error: "Please log in to access this resource" 
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      message: "Admin access required",
      error: "You don't have permission to access this resource" 
    });
  }

  return next();
};

// Middleware to check if the user owns the resource or is admin
export const requireOwnershipOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ 
        message: "Authentication required",
        error: "Please log in to access this resource" 
      });
    }

    // Admin can access any resource
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField] || req.query[resourceUserIdField];
    
    if (resourceUserId && parseInt(resourceUserId) === req.user.id) {
      return next();
    }

    return res.status(403).json({ 
      message: "Access denied",
      error: "You can only access your own resources" 
    });
  };
};