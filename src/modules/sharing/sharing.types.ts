import { z } from 'zod';

export const inviteSchema = z.object({
  vaultId: z.string().uuid(),
  email: z.string().email(),
  permission: z.enum(['read', 'write', 'admin']).default('read'),
});

export const respondInviteSchema = z.object({
  accept: z.boolean(),
  encryptedVaultKey: z.string().optional(), // required when accepting
});

export const setDefaultVaultSchema = z.object({
  vaultId: z.string().uuid(),
});

export type InviteInput = z.infer<typeof inviteSchema>;
export type RespondInviteInput = z.infer<typeof respondInviteSchema>;
