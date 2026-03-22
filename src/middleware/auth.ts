import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from './error-handler.js';
import { tokenService } from '../modules/tokens/token.service.js';

export interface AuthPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  // API token fields (set when authenticating via sp_ token)
  isApiToken?: boolean;
  tokenPermission?: 'read' | 'readwrite';
  tokenVaultIds?: string[] | null;
  tokenEncryptedSymKey?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Missing authorization token');
  }

  const token = header.slice(7);

  // API token (starts with sp_)
  if (token.startsWith('sp_')) {
    handleApiToken(token, req, next);
    return;
  }

  // JWT token
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}

async function handleApiToken(token: string, req: Request, next: NextFunction) {
  try {
    const apiToken = await tokenService.authenticateToken(token);

    req.user = {
      userId: apiToken.userId,
      tenantId: apiToken.tenantId,
      email: '',
      role: 'api-token',
      isApiToken: true,
      tokenPermission: apiToken.permission,
      tokenVaultIds: apiToken.vaultIds as string[] | null,
      tokenEncryptedSymKey: apiToken.encryptedSymKey,
    };

    next();
  } catch (err: any) {
    throw new AppError(401, err.message || 'Invalid API token');
  }
}

// Middleware to check write permission for API tokens
export function requireWrite(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.isApiToken && req.user.tokenPermission === 'read') {
    throw new AppError(403, 'API token has read-only access');
  }
  next();
}

// Middleware to check vault access for API tokens
export function requireVaultAccess(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.isApiToken && req.user.tokenVaultIds) {
    const vaultId = req.params.id as string;
    if (vaultId && !(req.user.tokenVaultIds as string[]).includes(vaultId)) {
      throw new AppError(403, 'API token does not have access to this vault');
    }
  }
  next();
}
