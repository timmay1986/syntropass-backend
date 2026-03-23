import type { Request, Response } from 'express';
import { sharingService } from './sharing.service.js';
import { inviteSchema, respondInviteSchema, setDefaultVaultSchema } from './sharing.types.js';

export const sharingController = {
  // Send invite
  async invite(req: Request, res: Response) {
    const input = inviteSchema.parse(req.body);
    const result = await sharingService.inviteToVault(req.user!.tenantId, req.user!.userId, input);
    res.status(201).json(result);
  },

  // Get my pending invites
  async getInvites(req: Request, res: Response) {
    const invites = await sharingService.getPendingInvites(req.user!.email, req.user!.userId);
    res.json(invites);
  },

  // Accept or decline invite
  async respondToInvite(req: Request, res: Response) {
    const { accept, encryptedVaultKey } = respondInviteSchema.parse(req.body);
    const id = req.params.id as string;
    await sharingService.respondToInvite(id, req.user!.userId, accept, encryptedVaultKey);
    res.json({ ok: true });
  },

  // Get shares + invites for a vault (owner only)
  async getVaultShares(req: Request, res: Response) {
    const vaultId = req.params.id as string;
    const result = await sharingService.getVaultShares(vaultId);
    res.json(result);
  },

  // Get vaults shared with me
  async getSharedVaults(req: Request, res: Response) {
    const shared = await sharingService.getSharedVaults(req.user!.userId);
    res.json(shared);
  },

  // Revoke access (owner removes a user)
  async revokeAccess(req: Request, res: Response) {
    const vaultId = req.params.id as string;
    const userId = req.params.userId as string;
    await sharingService.revokeAccess(vaultId, userId);
    res.status(204).send();
  },

  // Revoke invite
  async revokeInvite(req: Request, res: Response) {
    const inviteId = req.params.id as string;
    await sharingService.revokeInvite(inviteId);
    res.status(204).send();
  },

  // Get public key of a user (for encrypting vault key)
  async getPublicKey(req: Request, res: Response) {
    const userId = req.params.userId as string;
    const publicKey = await sharingService.getUserPublicKey(userId);
    if (!publicKey) return res.status(404).json({ error: 'User not found' });
    res.json({ publicKey });
  },

  // Find user by email (for sharing — returns userId + publicKey)
  async findUserByEmail(req: Request, res: Response) {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: 'email query parameter required' });
    const user = await sharingService.findUserByEmail(email, req.user!.tenantId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ userId: user.id, publicKey: user.publicKey });
  },

  // Set default vault
  async setDefaultVault(req: Request, res: Response) {
    const { vaultId } = setDefaultVaultSchema.parse(req.body);
    await sharingService.setDefaultVault(req.user!.userId, vaultId);
    res.json({ ok: true });
  },

  // Get default vault
  async getDefaultVault(req: Request, res: Response) {
    const vaultId = await sharingService.getDefaultVault(req.user!.userId);
    res.json({ defaultVaultId: vaultId });
  },
};
