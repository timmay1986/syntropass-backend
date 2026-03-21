import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { cleanDatabase } from './setup.js';
import { registerAndLogin } from './helpers.js';

let accessToken: string;

beforeEach(async () => {
  await cleanDatabase();
  const { response } = await registerAndLogin();
  accessToken = response.body.accessToken;
});

describe('POST /api/vaults', () => {
  it('creates a vault', async () => {
    const res = await request(app)
      .post('/api/vaults')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        encryptedName: '{"ciphertext":"dmF1bHQ=","nonce":"bm9uY2U="}',
        encryptedKey: '{"ciphertext":"a2V5","nonce":"bm9uY2U="}',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.type).toBe('personal');
  });

  it('requires auth', async () => {
    const res = await request(app).post('/api/vaults').send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /api/vaults', () => {
  it('returns user vaults', async () => {
    await request(app)
      .post('/api/vaults')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        encryptedName: '{"ciphertext":"dGVzdA==","nonce":"bm9uY2U="}',
        encryptedKey: '{"ciphertext":"a2V5","nonce":"bm9uY2U="}',
      });

    const res = await request(app)
      .get('/api/vaults')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

describe('Vault Items', () => {
  let vaultId: string;

  beforeEach(async () => {
    const vaultRes = await request(app)
      .post('/api/vaults')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        encryptedName: '{"ciphertext":"dGVzdA==","nonce":"bm9uY2U="}',
        encryptedKey: '{"ciphertext":"a2V5","nonce":"bm9uY2U="}',
      });
    vaultId = vaultRes.body.id;
  });

  it('creates and retrieves items', async () => {
    const createRes = await request(app)
      .post(`/api/vaults/${vaultId}/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        encryptedData: '{"ciphertext":"aXRlbQ==","nonce":"bm9uY2U="}',
        type: 'login',
      });

    expect(createRes.status).toBe(201);

    const listRes = await request(app)
      .get(`/api/vaults/${vaultId}/items`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].type).toBe('login');
  });

  it('soft-deletes items', async () => {
    const createRes = await request(app)
      .post(`/api/vaults/${vaultId}/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ encryptedData: '{"ciphertext":"eA==","nonce":"eA=="}' });

    const itemId = createRes.body.id;

    await request(app)
      .delete(`/api/vaults/${vaultId}/items/${itemId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const listRes = await request(app)
      .get(`/api/vaults/${vaultId}/items`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listRes.body.length).toBe(0);
  });
});
