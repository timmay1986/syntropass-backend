import { Router } from 'express';
import { requireAuth, requireVaultAccess, requireWrite } from '../../middleware/auth.js';
import { db } from '../../database/client.js';
import { vaults, vaultItems, users } from '../../database/schema.js';
import { eq, and, isNull } from 'drizzle-orm';

const router = Router();

function asyncHandler(fn: (req: any, res: any, next: any) => Promise<any>) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// All routes require API token auth
router.use(requireAuth);

// GET /api/v1/token/info — Get token info + encrypted key material
router.get('/info', asyncHandler(async (req, res) => {
  const user = req.user!;
  if (!user.isApiToken) {
    return res.status(400).json({ error: 'This endpoint is for API tokens only' });
  }

  // Get user's public key and encrypted keys
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);

  res.json({
    userId: user.userId,
    tenantId: user.tenantId,
    permission: user.tokenPermission,
    vaultIds: user.tokenVaultIds,
    encryptedSymKey: user.tokenEncryptedSymKey,
    publicKey: dbUser?.publicKey,
  });
}));

// GET /api/v1/token/vaults — List accessible vaults
router.get('/vaults', asyncHandler(async (req, res) => {
  const user = req.user!;
  let query = db.select().from(vaults)
    .where(and(eq(vaults.tenantId, user.tenantId), eq(vaults.ownerId, user.userId)));

  const allVaults = await query;

  // Filter by allowed vault IDs if scoped
  const filtered = user.tokenVaultIds
    ? allVaults.filter(v => (user.tokenVaultIds as string[]).includes(v.id))
    : allVaults;

  res.json(filtered);
}));

// GET /api/v1/token/vaults/:id/items — List items in a vault
router.get('/vaults/:id/items', requireVaultAccess, asyncHandler(async (req, res) => {
  const vaultId = req.params.id as string;
  const items = await db.select().from(vaultItems)
    .where(and(
      eq(vaultItems.vaultId, vaultId),
      eq(vaultItems.tenantId, req.user!.tenantId),
      isNull(vaultItems.deletedAt),
    ));
  res.json(items);
}));

// POST /api/v1/token/vaults/:id/items — Create item (requires readwrite)
router.post('/vaults/:id/items', requireVaultAccess, requireWrite, asyncHandler(async (req, res) => {
  const vaultId = req.params.id as string;
  const { type, encryptedData } = req.body;

  const [item] = await db.insert(vaultItems).values({
    vaultId,
    tenantId: req.user!.tenantId,
    type: type || 'login',
    encryptedData,
  }).returning();

  res.status(201).json(item);
}));

export { router as tokenAuthRoutes };
