import { z } from 'zod';

export const createVaultSchema = z.object({
  encryptedName: z.string(),
  encryptedKey: z.string(),
  type: z.enum(['personal', 'shared']).default('personal'),
});

export const createItemSchema = z.object({
  type: z.enum(['login', 'note', 'card', 'identity', 'custom', 'server', 'database', 'api_credential', 'ssh_key', 'secure_note', 'password', 'document']).default('login'),
  encryptedData: z.string(),
  favorite: z.boolean().default(false),
});

export const updateItemSchema = z.object({
  encryptedData: z.string().optional(),
  favorite: z.boolean().optional(),
});

export type CreateVaultInput = z.infer<typeof createVaultSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
