import {
  pgTable, uuid, varchar, text, boolean, integer, timestamp,
  pgEnum, jsonb,
} from 'drizzle-orm/pg-core';

export const planEnum = pgEnum('plan', ['free', 'team', 'business']);
export const vaultTypeEnum = pgEnum('vault_type', ['personal', 'shared']);
export const itemTypeEnum = pgEnum('item_type', ['login', 'note', 'card', 'identity', 'custom', 'server', 'database', 'api_credential', 'ssh_key', 'secure_note', 'password', 'document']);
export const permissionEnum = pgEnum('permission', ['read', 'write', 'admin']);
export const roleEnum = pgEnum('role', ['owner', 'admin', 'manager', 'user', 'readonly']);
export const groupRoleEnum = pgEnum('group_role', ['admin', 'manager', 'member']);

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  plan: planEnum('plan').notNull().default('free'),
  maxUsers: integer('max_users').notNull().default(5),
  maxVaults: integer('max_vaults').notNull().default(10),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  email: varchar('email', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  masterPasswordHash: varchar('master_password_hash', { length: 255 }).notNull(),
  encryptedSymKey: text('encrypted_sym_key').notNull(),
  publicKey: text('public_key').notNull(),
  encryptedPrivateKey: text('encrypted_private_key').notNull(),
  kdfIterations: integer('kdf_iterations').notNull().default(3),
  kdfMemory: integer('kdf_memory').notNull().default(65536),
  kdfSalt: text('kdf_salt').notNull().default(''),
  role: roleEnum('role').notNull().default('user'),
  defaultVaultId: uuid('default_vault_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const vaults = pgTable('vaults', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  encryptedName: text('encrypted_name').notNull(),
  encryptedKey: text('encrypted_key').notNull(),
  type: vaultTypeEnum('type').notNull().default('personal'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const vaultItems = pgTable('vault_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  vaultId: uuid('vault_id').notNull().references(() => vaults.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  type: itemTypeEnum('type').notNull().default('login'),
  encryptedData: text('encrypted_data').notNull(),
  favorite: boolean('favorite').notNull().default(false),
  version: integer('version').notNull().default(1),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const vaultShares = pgTable('vault_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  vaultId: uuid('vault_id').notNull().references(() => vaults.id, { onDelete: 'cascade' }),
  granteeUserId: uuid('grantee_user_id').notNull().references(() => users.id),
  groupId: uuid('group_id'),
  encryptedVaultKey: text('encrypted_vault_key').notNull(),
  permission: permissionEnum('permission').notNull().default('read'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const groupMembers = pgTable('group_members', {
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: groupRoleEnum('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tokenPermEnum = pgEnum('token_perm', ['read', 'readwrite']);
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'declined']);

export const vaultInvites = pgTable('vault_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  vaultId: uuid('vault_id').notNull().references(() => vaults.id, { onDelete: 'cascade' }),
  inviterId: uuid('inviter_id').notNull().references(() => users.id),
  inviteeEmail: varchar('invitee_email', { length: 255 }).notNull(),
  inviteeId: uuid('invitee_id').references(() => users.id), // null until user exists
  permission: permissionEnum('permission').notNull().default('read'),
  status: inviteStatusEnum('status').notNull().default('pending'),
  encryptedVaultKey: text('encrypted_vault_key'), // set when accepted (encrypted with invitee's public key)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const apiTokens = pgTable('api_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  // Encrypted symmetric key for this token (encrypted with token-derived key)
  encryptedSymKey: text('encrypted_sym_key').notNull(),
  // Which vaults this token can access (null = all user's vaults)
  vaultIds: jsonb('vault_ids'),  // string[] or null
  permission: tokenPermEnum('permission').notNull().default('read'),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const itemTemplates = pgTable('item_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  fields: jsonb('fields').notNull(),
  isBuiltin: boolean('is_builtin').notNull().default(false),
});
