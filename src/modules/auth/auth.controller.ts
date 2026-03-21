import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { registerSchema, loginSchema } from './auth.types.js';
import { AppError } from '../../middleware/error-handler.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

export const authController = {
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
      tenant: result.tenant,
    });
  },

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({
      accessToken: result.accessToken,
      user: result.user,
      tenant: result.tenant,
    });
  },

  async refresh(req: Request, res: Response) {
    const oldToken = req.cookies?.refreshToken;
    if (!oldToken) throw new AppError(401, 'No refresh token');
    const result = await authService.refresh(oldToken);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken: result.accessToken });
  },

  async logout(req: Request, res: Response) {
    const token = req.cookies?.refreshToken;
    if (token) await authService.logout(token);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ ok: true });
  },
};
