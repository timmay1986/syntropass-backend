import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  tenantName: z.string().min(2).max(100),
  tenantSlug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  authKeyHash: z.string().length(64),
  encryptedSymKey: z.string(),
  publicKey: z.string(),
  encryptedPrivateKey: z.string(),
  kdfMemory: z.number().int().min(1024),
  kdfIterations: z.number().int().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  tenantSlug: z.string(),
  authKeyHash: z.string().length(64),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
