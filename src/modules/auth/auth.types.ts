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
  kdfSalt: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  tenantSlug: z.string(),
  authKeyHash: z.string().length(64),
});

export const preloginSchema = z.object({
  email: z.string().email(),
  tenantSlug: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PreloginInput = z.infer<typeof preloginSchema>;
