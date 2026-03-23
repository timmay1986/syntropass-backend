import { eq, and, isNull, sql, or } from 'drizzle-orm';
import { db } from '../../database/client.js';
import { vaults, vaultItems, vaultShares } from '../../database/schema.js';
import type { CreateVaultInput, CreateItemInput, UpdateItemInput } from './vault.types.js';

export const vaultRepo = {
  async createVault(tenantId: string, ownerId: string, input: CreateVaultInput) {
    const [vault] = await db.insert(vaults).values({
      tenantId,
      ownerId,
      encryptedName: input.encryptedName,
      encryptedKey: input.encryptedKey,
      type: input.type,
    }).returning();
    return vault;
  },

  async findVaultsByUser(tenantId: string, userId: string) {
    // Own vaults
    const ownVaults = await db
      .select()
      .from(vaults)
      .where(and(eq(vaults.tenantId, tenantId), eq(vaults.ownerId, userId)));

    // Shared vaults (via vault_shares)
    const sharedResults = await db
      .select({ vault: vaults, share: vaultShares })
      .from(vaultShares)
      .innerJoin(vaults, eq(vaultShares.vaultId, vaults.id))
      .where(eq(vaultShares.granteeUserId, userId));

    // Merge: own vaults + shared vaults (with encryptedKey from share)
    const sharedVaults = sharedResults.map(r => ({
      ...r.vault,
      encryptedKey: r.share.encryptedVaultKey, // Use the share's encrypted key (encrypted for this user)
      _shared: true,
      _permission: r.share.permission,
    }));

    return [...ownVaults, ...sharedVaults];
  },

  async findVaultById(vaultId: string, tenantId: string) {
    const [vault] = await db
      .select()
      .from(vaults)
      .where(and(eq(vaults.id, vaultId), eq(vaults.tenantId, tenantId)))
      .limit(1);
    return vault ?? null;
  },

  async deleteVault(vaultId: string, tenantId: string) {
    await db.delete(vaults).where(and(eq(vaults.id, vaultId), eq(vaults.tenantId, tenantId)));
  },

  async createItem(vaultId: string, tenantId: string, input: CreateItemInput) {
    const [item] = await db.insert(vaultItems).values({
      vaultId,
      tenantId,
      type: input.type,
      encryptedData: input.encryptedData,
      favorite: input.favorite,
    }).returning();
    return item;
  },

  async findItemsByVault(vaultId: string, tenantId: string) {
    return db
      .select()
      .from(vaultItems)
      .where(and(
        eq(vaultItems.vaultId, vaultId),
        eq(vaultItems.tenantId, tenantId),
        isNull(vaultItems.deletedAt),
      ));
  },

  async findItemById(itemId: string, tenantId: string) {
    const [item] = await db
      .select()
      .from(vaultItems)
      .where(and(
        eq(vaultItems.id, itemId),
        eq(vaultItems.tenantId, tenantId),
        isNull(vaultItems.deletedAt),
      ))
      .limit(1);
    return item ?? null;
  },

  async updateItem(itemId: string, tenantId: string, input: UpdateItemInput) {
    const [item] = await db
      .update(vaultItems)
      .set({
        ...input,
        version: sql`${vaultItems.version} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(vaultItems.id, itemId), eq(vaultItems.tenantId, tenantId)))
      .returning();
    return item ?? null;
  },

  async softDeleteItem(itemId: string, tenantId: string) {
    await db
      .update(vaultItems)
      .set({ deletedAt: new Date() })
      .where(and(eq(vaultItems.id, itemId), eq(vaultItems.tenantId, tenantId)));
  },
};
