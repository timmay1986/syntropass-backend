import { eq, and } from 'drizzle-orm';
import { db } from '../../database/client.js';
import { apiTokens } from '../../database/schema.js';

export const tokenRepo = {
  async create(params: {
    tenantId: string;
    userId: string;
    name: string;
    tokenHash: string;
    encryptedSymKey: string;
    vaultIds: string[] | null;
    permission: 'read' | 'readwrite';
    expiresAt: Date | null;
  }) {
    const [token] = await db.insert(apiTokens).values({
      tenantId: params.tenantId,
      userId: params.userId,
      name: params.name,
      tokenHash: params.tokenHash,
      encryptedSymKey: params.encryptedSymKey,
      vaultIds: params.vaultIds,
      permission: params.permission,
      expiresAt: params.expiresAt,
    }).returning();
    return token;
  },

  async findByHash(tokenHash: string) {
    const [token] = await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.tokenHash, tokenHash))
      .limit(1);
    return token ?? null;
  },

  async findByUser(tenantId: string, userId: string) {
    return db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        permission: apiTokens.permission,
        vaultIds: apiTokens.vaultIds,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
        createdAt: apiTokens.createdAt,
      })
      .from(apiTokens)
      .where(and(eq(apiTokens.tenantId, tenantId), eq(apiTokens.userId, userId)));
  },

  async updateLastUsed(id: string) {
    await db.update(apiTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiTokens.id, id));
  },

  async delete(id: string, tenantId: string) {
    await db.delete(apiTokens)
      .where(and(eq(apiTokens.id, id), eq(apiTokens.tenantId, tenantId)));
  },
};
