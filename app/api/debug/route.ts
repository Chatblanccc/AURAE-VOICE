import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { neon } from '@neondatabase/serverless';
import { ensureSchema } from '@/lib/db';

export const runtime = 'nodejs';

type S = { user?: { id?: string } | null } | null;

export async function GET() {
  const session = await auth() as S;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized, no userId in session', session }, { status: 401 });

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: 'No DATABASE_URL configured' }, { status: 500 });

  try { await ensureSchema(); } catch {}

  const sql = neon(url);
  try {
    const [convCount] = await sql`SELECT COUNT(*) as c FROM conversations WHERE user_id = ${userId}`;
    const [msgCount] = await sql`SELECT COUNT(*) as c FROM messages WHERE user_id = ${userId}`;
    const [orphanCount] = await sql`
      SELECT COUNT(DISTINCT conversation_id) as c FROM messages
      WHERE user_id = ${userId} AND conversation_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM conversations c2
          WHERE c2.id = messages.conversation_id AND c2.user_id = messages.user_id
        )
    `;
    const recentConvs = await sql`
      SELECT id, title, updated_at FROM conversations
      WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 5
    `;
    const recentMsgs = await sql`
      SELECT id, conversation_id, role, LEFT(content, 60) as preview, timestamp
      FROM messages WHERE user_id = ${userId} ORDER BY timestamp DESC LIMIT 5
    `;
    const allUserIds = await sql`SELECT DISTINCT user_id FROM conversations UNION SELECT DISTINCT user_id FROM messages`;

    return NextResponse.json({
      currentUserId: userId,
      stats: {
        conversations: Number(convCount.c),
        messages: Number(msgCount.c),
        orphanedConversationIds: Number(orphanCount.c),
      },
      recentConversations: recentConvs,
      recentMessages: recentMsgs,
      allUserIdsInDb: allUserIds.map(r => r.user_id),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), userId }, { status: 500 });
  }
}
