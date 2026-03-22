import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../../config.js';
import { AppError } from '../../middleware/error-handler.js';
import { authRepo } from './auth.repository.js';
import type { RegisterInput, LoginInput } from './auth.types.js';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '24h';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateTokens(userId: string, tenantId: string, email: string, role: string) {
  const accessToken = jwt.sign(
    { userId, tenantId, email, role },
    config.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
  const refreshToken = crypto.randomBytes(32).toString('hex');
  return { accessToken, refreshToken };
}

function userResponse(user: any) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    encryptedSymKey: user.encryptedSymKey,
    publicKey: user.publicKey,
    encryptedPrivateKey: user.encryptedPrivateKey,
    kdfMemory: user.kdfMemory,
    kdfIterations: user.kdfIterations,
    kdfSalt: user.kdfSalt,
  };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await authRepo.findTenantBySlug(input.tenantSlug);
    if (existing) throw new AppError(409, 'Tenant slug already taken');

    const passwordHash = await bcrypt.hash(input.authKeyHash, BCRYPT_ROUNDS);
    const { tenant, user } = await authRepo.createTenantAndUser(input, passwordHash);

    const { accessToken, refreshToken } = generateTokens(user.id, tenant.id, user.email, user.role);
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await authRepo.saveRefreshToken(user.id, refreshHash, new Date(Date.now() + REFRESH_TOKEN_TTL_MS));

    return {
      accessToken,
      refreshToken,
      user: userResponse(user),
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    };
  },

  async login(input: LoginInput) {
    const result = await authRepo.findUserByEmailAndTenant(input.email, input.tenantSlug);
    if (!result) throw new AppError(401, 'Invalid credentials');

    const { user, tenant } = result;
    const valid = await bcrypt.compare(input.authKeyHash, user.masterPasswordHash);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    const { accessToken, refreshToken } = generateTokens(user.id, tenant.id, user.email, user.role);
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await authRepo.saveRefreshToken(user.id, refreshHash, new Date(Date.now() + REFRESH_TOKEN_TTL_MS));

    return {
      accessToken,
      refreshToken,
      user: userResponse(user),
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    };
  },

  async refresh(oldRefreshToken: string) {
    const oldHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
    const stored = await authRepo.findRefreshToken(oldHash);
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError(401, 'Invalid refresh token');
    }

    await authRepo.deleteRefreshToken(oldHash);

    const user = await authRepo.findUserById(stored.userId);
    if (!user) throw new AppError(401, 'User not found');

    const { accessToken, refreshToken } = generateTokens(user.id, user.tenantId, user.email, user.role);
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await authRepo.saveRefreshToken(user.id, refreshHash, new Date(Date.now() + REFRESH_TOKEN_TTL_MS));

    return { accessToken, refreshToken };
  },

  async prelogin(email: string, tenantSlug: string) {
    const result = await authRepo.findUserByEmailAndTenant(email, tenantSlug);
    if (!result) throw new AppError(404, 'User not found');
    const { user } = result;
    return {
      kdfSalt: user.kdfSalt,
      kdfMemory: user.kdfMemory,
      kdfIterations: user.kdfIterations,
    };
  },

  async logout(refreshToken: string) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await authRepo.deleteRefreshToken(hash);
  },
};
