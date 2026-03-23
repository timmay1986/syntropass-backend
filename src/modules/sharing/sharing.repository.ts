import { eq, and, or } from 'drizzle-orm';
import { db } from '../../database/client.js';
import { vaultInvites, vaultShares, vaults, users } from '../../database/schema.js';

export const sharingRepo = {
  // Invites
  async createInvite(params: {
    vaultId: string;
    inviterId: string;
    inviteeEmail: string;
    inviteeId: string | null;
    permission: 'read' | 'write' | 'admin';
    encryptedVaultKey?: string | null;
    vaultName?: string | null;
  }) {
    const [invite] = await db.insert(vaultInvites).values({
      vaultId: params.vaultId,
      inviterId: params.inviterId,
      inviteeEmail: params.inviteeEmail,
      inviteeId: params.inviteeId,
      permission: params.permission,
      encryptedVaultKey: params.encryptedVaultKey || null,
      vaultName: params.vaultName || null,
    }).returning();
    return invite;
  },

  async findPendingInvitesForUser(email: string, userId: string) {
    return db.select({
      invite: vaultInvites,
      vault: vaults,
      inviter: {
        id: users.id,
        email: users.email,
      },
    })
    .from(vaultInvites)
    .innerJoin(vaults, eq(vaultInvites.vaultId, vaults.id))
    .innerJoin(users, eq(vaultInvites.inviterId, users.id))
    .where(and(
      or(eq(vaultInvites.inviteeEmail, email), eq(vaultInvites.inviteeId, userId)),
      eq(vaultInvites.status, 'pending'),
    ));
  },

  async findInviteById(inviteId: string) {
    const [invite] = await db.select().from(vaultInvites).where(eq(vaultInvites.id, inviteId)).limit(1);
    return invite ?? null;
  },

  async updateInviteStatus(inviteId: string, status: 'accepted' | 'declined', encryptedVaultKey?: string) {
    const values: any = { status };
    if (encryptedVaultKey) values.encryptedVaultKey = encryptedVaultKey;
    await db.update(vaultInvites).set(values).where(eq(vaultInvites.id, inviteId));
  },

  async findInvitesByVault(vaultId: string) {
    return db.select({
      invite: vaultInvites,
      invitee: {
        id: users.id,
        email: users.email,
      },
    })
    .from(vaultInvites)
    .leftJoin(users, eq(vaultInvites.inviteeId, users.id))
    .where(eq(vaultInvites.vaultId, vaultId));
  },

  async deleteInvite(inviteId: string) {
    await db.delete(vaultInvites).where(eq(vaultInvites.id, inviteId));
  },

  // Shares
  async createShare(params: {
    vaultId: string;
    granteeUserId: string;
    encryptedVaultKey: string;
    permission: 'read' | 'write' | 'admin';
  }) {
    const [share] = await db.insert(vaultShares).values(params).returning();
    return share;
  },

  async findSharesByUser(userId: string) {
    return db.select({
      share: vaultShares,
      vault: vaults,
    })
    .from(vaultShares)
    .innerJoin(vaults, eq(vaultShares.vaultId, vaults.id))
    .where(eq(vaultShares.granteeUserId, userId));
  },

  async findSharesByVault(vaultId: string) {
    return db.select({
      share: vaultShares,
      user: {
        id: users.id,
        email: users.email,
      },
    })
    .from(vaultShares)
    .innerJoin(users, eq(vaultShares.granteeUserId, users.id))
    .where(eq(vaultShares.vaultId, vaultId));
  },

  async deleteShare(shareId: string) {
    await db.delete(vaultShares).where(eq(vaultShares.id, shareId));
  },

  async deleteShareByUserAndVault(userId: string, vaultId: string) {
    await db.delete(vaultShares).where(and(
      eq(vaultShares.granteeUserId, userId),
      eq(vaultShares.vaultId, vaultId),
    ));
  },

  // Users
  async findUserByEmail(email: string, tenantId: string) {
    const [user] = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
      .limit(1);
    return user ?? null;
  },

  async findUserByEmailGlobal(email: string) {
    const [user] = await db.select().from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user ?? null;
  },

  async getUserPublicKey(userId: string) {
    const [user] = await db.select({ publicKey: users.publicKey }).from(users)
      .where(eq(users.id, userId)).limit(1);
    return user?.publicKey ?? null;
  },

  async setDefaultVault(userId: string, vaultId: string | null) {
    await db.update(users).set({ defaultVaultId: vaultId }).where(eq(users.id, userId));
  },

  async getDefaultVault(userId: string) {
    const [user] = await db.select({ defaultVaultId: users.defaultVaultId }).from(users)
      .where(eq(users.id, userId)).limit(1);
    return user?.defaultVaultId ?? null;
  },
};
