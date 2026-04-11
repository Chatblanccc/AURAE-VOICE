/**
 * One-time migration: consolidate all UUID-format user_ids
 * to a stable Google provider ID.
 *
 * Usage: node scripts/migrate-userids.mjs <stable_google_sub>
 * Example: node scripts/migrate-userids.mjs 103741234567890123456
 */
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Run: export DATABASE_URL="your_neon_connection_string"');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const stableId = process.argv[2];
if (!stableId) {
  console.error('Usage: node scripts/migrate-userids.mjs <stable_google_sub>');
  console.error('  Log in once with the new code, then check /api/debug for your stable userId');
  process.exit(1);
}

async function main() {
  console.log('Target stable ID:', stableId);

  const uuidPattern = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  console.log('\n--- Before migration ---');
  const oldConvs = await sql`SELECT DISTINCT user_id FROM conversations WHERE user_id ~ ${uuidPattern}`;
  console.log('UUID user_ids in conversations:', oldConvs.map(r => r.user_id));
  const oldMsgs = await sql`SELECT DISTINCT user_id FROM messages WHERE user_id ~ ${uuidPattern}`;
  console.log('UUID user_ids in messages:', oldMsgs.map(r => r.user_id));

  console.log('\n--- Migrating ---');
  await sql`UPDATE conversations SET user_id = ${stableId} WHERE user_id ~ ${uuidPattern} AND user_id != ${stableId}`;
  await sql`UPDATE messages SET user_id = ${stableId} WHERE user_id ~ ${uuidPattern} AND user_id != ${stableId}`;

  // Deduplicate conversations with same id but different (now merged) user_ids
  // The PK is (id, user_id), so after migration there shouldn't be conflicts
  // unless two different sessions created the same conversation_id (unlikely)

  console.log('\n--- After migration ---');
  const newConvs = await sql`SELECT id, user_id, title FROM conversations ORDER BY updated_at DESC`;
  console.log('Conversations:', JSON.stringify(newConvs, null, 2));
  const msgCount = await sql`SELECT COUNT(*) as c FROM messages WHERE user_id = ${stableId}`;
  console.log('Messages for stable ID:', msgCount[0].c);

  console.log('\nDone!');
}

main().catch(console.error);
