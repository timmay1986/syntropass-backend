import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { cleanDatabase } from './setup.js';
import { createTestUser, registerAndLogin } from './helpers.js';

beforeEach(async () => {
  await cleanDatabase();
});

describe('POST /api/auth/register', () => {
  it('creates tenant and user, returns tokens', async () => {
    const userData = createTestUser();
    const res = await request(app).post('/api/auth/register').send(userData);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.tenant.slug).toBe('test-corp');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects duplicate tenant slug', async () => {
    const userData = createTestUser();
    await request(app).post('/api/auth/register').send(userData);
    const res = await request(app).post('/api/auth/register').send({
      ...userData,
      email: 'bob@test.com',
    });

    expect(res.status).toBe(409);
  });

  it('validates input', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await registerAndLogin();
    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@test.com',
      tenantSlug: 'test-corp',
      authKeyHash: 'a'.repeat(64),
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.encryptedSymKey).toBeDefined();
  });

  it('rejects wrong password', async () => {
    await registerAndLogin();
    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@test.com',
      tenantSlug: 'test-corp',
      authKeyHash: 'b'.repeat(64),
    });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears refresh cookie', async () => {
    const { response } = await registerAndLogin();
    const cookies = response.headers['set-cookie'];

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
  });
});
