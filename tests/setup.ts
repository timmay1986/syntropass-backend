import { db } from '../src/database/client.js';
import { sql } from 'drizzle-orm';

export async function cleanDatabase() {
  await db.execute(sql`TRUNCATE tenants CASCADE`);
}
