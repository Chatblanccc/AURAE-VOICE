import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Run: export DATABASE_URL="your_neon_connection_string"');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log('=== Tables ===');
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  console.log(tables.map(t => t.tablename));

  console.log('\n=== All conversations ===');
  const convs = await sql`SELECT * FROM conversations ORDER BY updated_at DESC`;
  console.log(JSON.stringify(convs, null, 2));

  console.log('\n=== All messages (last 10) ===');
  const msgs = await sql`SELECT id, user_id, conversation_id, role, LEFT(content, 80) as preview, timestamp FROM messages ORDER BY timestamp DESC LIMIT 10`;
  console.log(JSON.stringify(msgs, null, 2));

  console.log('\n=== Distinct user_ids in messages ===');
  const msgUsers = await sql`SELECT DISTINCT user_id FROM messages`;
  console.log(msgUsers);

  console.log('\n=== Distinct user_ids in conversations ===');
  const convUsers = await sql`SELECT DISTINCT user_id FROM conversations`;
  console.log(convUsers);

  console.log('\n=== Messages with conversation_id but no conversation record ===');
  const orphans = await sql`
    SELECT DISTINCT m.conversation_id, m.user_id, COUNT(*) as msg_count
    FROM messages m
    LEFT JOIN conversations c ON c.id = m.conversation_id AND c.user_id = m.user_id
    WHERE m.conversation_id IS NOT NULL AND c.id IS NULL
    GROUP BY m.conversation_id, m.user_id
  `;
  console.log(JSON.stringify(orphans, null, 2));

  console.log('\n=== Message count per conversation ===');
  const msgCounts = await sql`
    SELECT conversation_id, COUNT(*) as cnt
    FROM messages
    WHERE conversation_id IS NOT NULL
    GROUP BY conversation_id
    ORDER BY cnt DESC
  `;
  console.log(JSON.stringify(msgCounts, null, 2));
}

main().catch(console.error);
