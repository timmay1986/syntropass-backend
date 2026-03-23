import { AppError } from '../../middleware/error-handler.js';
import { sharingRepo } from './sharing.repository.js';
import type { InviteInput } from './sharing.types.js';

export const sharingService = {
  async inviteToVault(tenantId: string, inviterId: string, input: InviteInput) {
    // Find the invitee user (might not exist yet)
    const invitee = await sharingRepo.findUserByEmail(input.email, tenantId);

    const invite = await sharingRepo.createInvite({
      vaultId: input.vaultId,
      inviterId,
      inviteeEmail: input.email,
      inviteeId: invitee?.id || null,
      permission: input.permission,
    });

    return {
      ...invite,
      inviteeExists: !!invitee,
      inviteePublicKey: invitee?.publicKey || null,
    };
  },

  async getPendingInvites(email: string, userId: string) {
    return sharingRepo.findPendingInvitesForUser(email, userId);
  },

  async respondToInvite(inviteId: string, userId: string, accept: boolean, encryptedVaultKey?: string) {
    const invite = await sharingRepo.findInviteById(inviteId);
    if (!invite) throw new AppError(404, 'Invite not found');

    if (accept) {
      if (!encryptedVaultKey) throw new AppError(400, 'encryptedVaultKey required to accept');

      // Create vault share
      await sharingRepo.createShare({
        vaultId: invite.vaultId,
        granteeUserId: userId,
        encryptedVaultKey,
        permission: invite.permission,
      });

      await sharingRepo.updateInviteStatus(inviteId, 'accepted', encryptedVaultKey);
    } else {
      await sharingRepo.updateInviteStatus(inviteId, 'declined');
    }
  },

  async getVaultShares(vaultId: string) {
    const shares = await sharingRepo.findSharesByVault(vaultId);
    const invites = await sharingRepo.findInvitesByVault(vaultId);
    return { shares, invites };
  },

  async getSharedVaults(userId: string) {
    return sharingRepo.findSharesByUser(userId);
  },

  async revokeAccess(vaultId: string, userId: string) {
    await sharingRepo.deleteShareByUserAndVault(userId, vaultId);
  },

  async revokeInvite(inviteId: string) {
    await sharingRepo.deleteInvite(inviteId);
  },

  async getUserPublicKey(userId: string) {
    return sharingRepo.getUserPublicKey(userId);
  },

  async setDefaultVault(userId: string, vaultId: string) {
    await sharingRepo.setDefaultVault(userId, vaultId);
  },

  async getDefaultVault(userId: string) {
    return sharingRepo.getDefaultVault(userId);
  },
};
