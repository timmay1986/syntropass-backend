import { eq, and } from 'drizzle-orm';
import { AppError } from '../../middleware/error-handler.js';
import { vaultRepo } from './vault.repository.js';
import { db } from '../../database/client.js';
import { vaultShares } from '../../database/schema.js';
import type { CreateVaultInput, CreateItemInput, UpdateItemInput } from './vault.types.js';

async function checkAccess(vaultId: string, tenantId: string, userId: string, requireWrite = false) {
  const vault = await vaultRepo.findVaultById(vaultId, tenantId);
  if (!vault) throw new AppError(404, 'Vault not found');

  // Owner has full access
  if (vault.ownerId === userId) return vault;

  // Check if user has a share
  const [share] = await db.select().from(vaultShares)
    .where(and(eq(vaultShares.vaultId, vaultId), eq(vaultShares.granteeUserId, userId)))
    .limit(1);

  if (!share) throw new AppError(403, 'No access to this vault');

  if (requireWrite && share.permission === 'read') {
    throw new AppError(403, 'Read-only access');
  }

  return vault;
}

export const vaultService = {
  async createVault(tenantId: string, userId: string, input: CreateVaultInput) {
    return vaultRepo.createVault(tenantId, userId, input);
  },

  async getVaults(tenantId: string, userId: string) {
    return vaultRepo.findVaultsByUser(tenantId, userId);
  },

  async deleteVault(vaultId: string, tenantId: string, userId: string) {
    const vault = await vaultRepo.findVaultById(vaultId, tenantId);
    if (!vault) throw new AppError(404, 'Vault not found');
    if (vault.ownerId !== userId) throw new AppError(403, 'Only owner can delete vault');
    await vaultRepo.deleteVault(vaultId, tenantId);
  },

  async createItem(vaultId: string, tenantId: string, userId: string, input: CreateItemInput) {
    await checkAccess(vaultId, tenantId, userId, true);
    return vaultRepo.createItem(vaultId, tenantId, input);
  },

  async getItems(vaultId: string, tenantId: string, userId: string) {
    await checkAccess(vaultId, tenantId, userId);
    return vaultRepo.findItemsByVault(vaultId, tenantId);
  },

  async updateItem(vaultId: string, itemId: string, tenantId: string, userId: string, input: UpdateItemInput) {
    await checkAccess(vaultId, tenantId, userId, true);
    const item = await vaultRepo.updateItem(itemId, tenantId, input);
    if (!item) throw new AppError(404, 'Item not found');
    return item;
  },

  async deleteItem(vaultId: string, itemId: string, tenantId: string, userId: string) {
    await checkAccess(vaultId, tenantId, userId, true);
    await vaultRepo.softDeleteItem(itemId, tenantId);
  },
};
