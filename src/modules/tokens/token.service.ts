import crypto from 'node:crypto';
import { AppError } from '../../middleware/error-handler.js';
import { tokenRepo } from './token.repository.js';
import type { CreateTokenInput } from './token.types.js';

export const tokenService = {
  async createToken(tenantId: string, userId: string, input: CreateTokenInput) {
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const token = await tokenRepo.create({
      tenantId,
      userId,
      name: input.name,
      tokenHash: input.tokenSecretHash,
      encryptedSymKey: input.encryptedSymKey,
      vaultIds: input.vaultIds || null,
      permission: input.permission,
      expiresAt,
    });

    return {
      id: token.id,
      name: token.name,
      permission: token.permission,
      vaultIds: token.vaultIds,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    };
  },

  async listTokens(tenantId: string, userId: string) {
    return tokenRepo.findByUser(tenantId, userId);
  },

  async authenticateToken(tokenSecret: string) {
    // Hash the token secret to find it in DB
    const tokenHash = crypto.createHash('sha256').update(tokenSecret).digest('hex');
    const token = await tokenRepo.findByHash(tokenHash);

    if (!token) throw new AppError(401, 'Invalid API token');
    if (token.expiresAt && token.expiresAt < new Date()) {
      throw new AppError(401, 'API token expired');
    }

    // Update last used
    await tokenRepo.updateLastUsed(token.id);

    return token;
  },

  async revokeToken(tokenId: string, tenantId: string) {
    await tokenRepo.delete(tokenId, tenantId);
  },
};
