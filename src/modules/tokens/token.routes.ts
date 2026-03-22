import { Router } from 'express';
import { tokenController } from './token.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

function asyncHandler(fn: (req: any, res: any, next: any) => Promise<any>) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(requireAuth);

router.post('/', asyncHandler(tokenController.createToken));
router.get('/', asyncHandler(tokenController.listTokens));
router.delete('/:id', asyncHandler(tokenController.revokeToken));

export { router as tokenRoutes };
