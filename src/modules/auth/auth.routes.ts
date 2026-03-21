import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authLimiter } from '../../middleware/rate-limit.js';

const router = Router();

function asyncHandler(fn: (req: any, res: any, next: any) => Promise<any>) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const isTest = process.env.NODE_ENV === 'test';

router.post('/register', ...(isTest ? [] : [authLimiter]), asyncHandler(authController.register));
router.post('/login', ...(isTest ? [] : [authLimiter]), asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));

export { router as authRoutes };
