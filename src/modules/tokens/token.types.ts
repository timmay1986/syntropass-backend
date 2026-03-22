import { z } from 'zod';

export const createTokenSchema = z.object({
  name: z.string().min(1).max(255),
  vaultIds: z.array(z.string().uuid()).optional(), // null = all vaults
  permission: z.enum(['read', 'readwrite']).default('read'),
  expiresInDays: z.number().int().min(1).max(365).optional(), // null = never
  // Client sends the encrypted symmetric key (encrypted with the token secret)
  encryptedSymKey: z.string(),
  // The token secret hash (SHA-256 of the random token secret)
  tokenSecretHash: z.string().length(64),
});

export type CreateTokenInput = z.infer<typeof createTokenSchema>;
