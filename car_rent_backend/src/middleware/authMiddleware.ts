import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Explicitly export the AuthRequest interface
export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.log('No token provided in request', { url: req.url, method: req.method });
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; role: string };
    console.log('Decoded token:', { userId: decoded.userId, role: decoded.role, url: req.url });
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', { error, tokenSnippet: token.slice(0, 10) + '...' });
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const roleMiddleware = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.log('Role check failed:', { userRole: req.user?.role, requiredRoles: roles, url: req.url });
      return res.status(403).json({ message: 'Access denied' });
    }
    console.log('Role check passed:', { userRole: req.user.role, url: req.url });
    next();
  };
};

