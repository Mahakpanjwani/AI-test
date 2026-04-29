import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: { employeeId: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret) as { employeeId: string };
    req.user = { employeeId: payload.employeeId };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
