import { app } from '../src/app.js';
import request from 'supertest';

export function createTestUser(overrides: Record<string, any> = {}) {
  return {
    email: 'alice@test.com',
    tenantName: 'Test Corp',
    tenantSlug: 'test-corp',
    authKeyHash: 'a'.repeat(64),
    encryptedSymKey: '{"ciphertext":"dGVzdA==","nonce":"dGVzdA=="}',
    publicKey: 'dGVzdA==',
    encryptedPrivateKey: '{"ciphertext":"dGVzdA==","nonce":"dGVzdA=="}',
    kdfMemory: 65536,
    kdfIterations: 3,
    kdfSalt: 'dGVzdHNhbHQ=',
    ...overrides,
  };
}

export async function registerAndLogin(overrides: Record<string, any> = {}) {
  const userData = createTestUser(overrides);
  const res = await request(app).post('/api/auth/register').send(userData);
  return { response: res, userData };
}
