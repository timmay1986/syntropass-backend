import { Router } from 'express';
import { vaultController } from './vault.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

function asyncHandler(fn: (req: any, res: any, next: any) => Promise<any>) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(requireAuth);

router.post('/', asyncHandler(vaultController.createVault));
router.get('/', asyncHandler(vaultController.getVaults));
router.delete('/:id', asyncHandler(vaultController.deleteVault));

router.post('/:id/items', asyncHandler(vaultController.createItem));
router.get('/:id/items', asyncHandler(vaultController.getItems));
router.put('/:id/items/:itemId', asyncHandler(vaultController.updateItem));
router.delete('/:id/items/:itemId', asyncHandler(vaultController.deleteItem));

export { router as vaultRoutes };
