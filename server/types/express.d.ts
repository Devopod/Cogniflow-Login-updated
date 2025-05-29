import { Express } from 'express';

declare global {
  namespace Express {
    interface User {
      id: number;
      role?: string;
      [key: string]: any;
    }
    
    interface Request {
      user?: User;
    }
  }
}

export {};