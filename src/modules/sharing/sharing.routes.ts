import { Router } from 'express';
import { sharingController } from './sharing.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

function asyncHandler(fn: (req: any, res: any, next: any) => Promise<any>) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(requireAuth);

// Invites
router.post('/invite', asyncHandler(sharingController.invite));
router.get('/invites', asyncHandler(sharingController.getInvites));
router.post('/invites/:id/respond', asyncHandler(sharingController.respondToInvite));
router.delete('/invites/:id', asyncHandler(sharingController.revokeInvite));

// Vault shares
router.get('/vaults/:id/shares', asyncHandler(sharingController.getVaultShares));
router.delete('/vaults/:id/shares/:userId', asyncHandler(sharingController.revokeAccess));

// Shared with me
router.get('/shared', asyncHandler(sharingController.getSharedVaults));

// Public key (for encrypting vault key for recipient)
router.get('/users/by-email', asyncHandler(sharingController.findUserByEmail));
router.get('/users/:userId/public-key', asyncHandler(sharingController.getPublicKey));

// Default vault
router.get('/default-vault', asyncHandler(sharingController.getDefaultVault));
router.put('/default-vault', asyncHandler(sharingController.setDefaultVault));

export { router as sharingRoutes };
