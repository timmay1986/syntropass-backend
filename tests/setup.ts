import { db } from '../src/database/client.js';
import { sql } from 'drizzle-orm';

export async function cleanDatabase() {
  // SAFETY: Only clean if this is the test database
  // NEVER truncate production data
  const result = await db.execute(sql`SELECT count(*) as c FROM users`);
  const userCount = Number((result as any).rows?.[0]?.c || (result as any)[0]?.c || 0);

  if (userCount > 10) {
    throw new Error(
      `SAFETY STOP: Database has ${userCount} users — this looks like production! ` +
      `Tests must use a separate database. Set DATABASE_URL to a test database.`
    );
  }

  await db.execute(sql`TRUNCATE tenants CASCADE`);
}
