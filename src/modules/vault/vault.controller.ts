import type { Request, Response } from 'express';
import { vaultService } from './vault.service.js';
import { createVaultSchema, createItemSchema, updateItemSchema } from './vault.types.js';

export const vaultController = {
  async createVault(req: Request, res: Response) {
    const input = createVaultSchema.parse(req.body);
    const vault = await vaultService.createVault(req.user!.tenantId, req.user!.userId, input);
    res.status(201).json(vault);
  },

  async getVaults(req: Request, res: Response) {
    const vaults = await vaultService.getVaults(req.user!.tenantId, req.user!.userId);
    res.json(vaults);
  },

  async deleteVault(req: Request, res: Response) {
    const id = req.params.id as string;
    await vaultService.deleteVault(id, req.user!.tenantId, req.user!.userId);
    res.status(204).send();
  },

  async createItem(req: Request, res: Response) {
    const id = req.params.id as string;
    const input = createItemSchema.parse(req.body);
    const item = await vaultService.createItem(id, req.user!.tenantId, req.user!.userId, input);
    res.status(201).json(item);
  },

  async getItems(req: Request, res: Response) {
    const id = req.params.id as string;
    const items = await vaultService.getItems(id, req.user!.tenantId, req.user!.userId);
    res.json(items);
  },

  async updateItem(req: Request, res: Response) {
    const id = req.params.id as string;
    const itemId = req.params.itemId as string;
    const input = updateItemSchema.parse(req.body);
    const item = await vaultService.updateItem(id, itemId, req.user!.tenantId, req.user!.userId, input);
    res.json(item);
  },

  async deleteItem(req: Request, res: Response) {
    const id = req.params.id as string;
    const itemId = req.params.itemId as string;
    await vaultService.deleteItem(id, itemId, req.user!.tenantId, req.user!.userId);
    res.status(204).send();
  },
};
