import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';

export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user?.tenantId) {
    throw new AppError(403, 'Tenant context required');
  }
  next();
}
