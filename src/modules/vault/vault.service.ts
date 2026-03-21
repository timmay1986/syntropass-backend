import { AppError } from '../../middleware/error-handler.js';
import { vaultRepo } from './vault.repository.js';
import type { CreateVaultInput, CreateItemInput, UpdateItemInput } from './vault.types.js';

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
    if (vault.ownerId !== userId) throw new AppError(403, 'Not vault owner');
    await vaultRepo.deleteVault(vaultId, tenantId);
  },

  async createItem(vaultId: string, tenantId: string, userId: string, input: CreateItemInput) {
    const vault = await vaultRepo.findVaultById(vaultId, tenantId);
    if (!vault) throw new AppError(404, 'Vault not found');
    if (vault.ownerId !== userId) throw new AppError(403, 'Not vault owner');
    return vaultRepo.createItem(vaultId, tenantId, input);
  },

  async getItems(vaultId: string, tenantId: string, userId: string) {
    const vault = await vaultRepo.findVaultById(vaultId, tenantId);
    if (!vault) throw new AppError(404, 'Vault not found');
    if (vault.ownerId !== userId) throw new AppError(403, 'Not vault owner');
    return vaultRepo.findItemsByVault(vaultId, tenantId);
  },

  async updateItem(vaultId: string, itemId: string, tenantId: string, userId: string, input: UpdateItemInput) {
    const vault = await vaultRepo.findVaultById(vaultId, tenantId);
    if (!vault) throw new AppError(404, 'Vault not found');
    if (vault.ownerId !== userId) throw new AppError(403, 'Not vault owner');
    const item = await vaultRepo.updateItem(itemId, tenantId, input);
    if (!item) throw new AppError(404, 'Item not found');
    return item;
  },

  async deleteItem(vaultId: string, itemId: string, tenantId: string, userId: string) {
    const vault = await vaultRepo.findVaultById(vaultId, tenantId);
    if (!vault) throw new AppError(404, 'Vault not found');
    if (vault.ownerId !== userId) throw new AppError(403, 'Not vault owner');
    await vaultRepo.softDeleteItem(itemId, tenantId);
  },
};
