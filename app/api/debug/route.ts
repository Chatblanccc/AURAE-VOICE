import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

type S = { user?: { id?: string } | null } | null;

export async function GET() {
  const session = await auth() as S;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: 'No DATABASE_URL' }, { status: 500 });

  const sql = neon(url);
  try {
    const [convCount] = await sql`SELECT COUNT(*) as c FROM conversations WHERE user_id = ${userId}`;
    const [msgCount] = await sql`SELECT COUNT(*) as c FROM messages WHERE user_id = ${userId}`;
    const recentConvs = await sql`SELECT id, title, updated_at FROM conversations WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 5`;
    return NextResponse.json({
      userId,
      conversations: Number(convCount.c),
      messages: Number(msgCount.c),
      recentConversations: recentConvs,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), userId }, { status: 500 });
  }
}
