import { eq, and } from 'drizzle-orm';
import { db } from '../../database/client.js';
import { users, tenants, refreshTokens } from '../../database/schema.js';
import type { RegisterInput } from './auth.types.js';

export const authRepo = {
  async createTenantAndUser(input: RegisterInput, passwordHash: string) {
    return db.transaction(async (tx) => {
      const [tenant] = await tx.insert(tenants).values({
        name: input.tenantName,
        slug: input.tenantSlug,
      }).returning();

      const [user] = await tx.insert(users).values({
        tenantId: tenant.id,
        email: input.email,
        masterPasswordHash: passwordHash,
        encryptedSymKey: input.encryptedSymKey,
        publicKey: input.publicKey,
        encryptedPrivateKey: input.encryptedPrivateKey,
        kdfMemory: input.kdfMemory,
        kdfIterations: input.kdfIterations,
        role: 'owner',
      }).returning();

      return { tenant, user };
    });
  },

  async findUserByEmailAndTenant(email: string, tenantSlug: string) {
    const result = await db
      .select()
      .from(users)
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(and(eq(users.email, email), eq(tenants.slug, tenantSlug)))
      .limit(1);

    if (result.length === 0) return null;
    return { user: result[0].users, tenant: result[0].tenants };
  },

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt });
  },

  async findRefreshToken(tokenHash: string) {
    const [token] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    return token ?? null;
  },

  async deleteRefreshToken(tokenHash: string) {
    await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
  },

  async deleteAllRefreshTokens(userId: string) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  },

  async findTenantBySlug(slug: string) {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    return tenant ?? null;
  },

  async findUserById(userId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user ?? null;
  },
};
