import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  ensureSchema,
  getUsageCount,
  listUserPracticeMessagesSince,
} from '@/lib/db';
import type { WeeklyReport } from '@/types';

type S = { user?: { id?: string } | null } | null;

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'at',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'this', 'that',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'my', 'your', 'our', 'their',
  'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'can', 'could',
  'should', 'from', 'as', 'by', 'if', 'but', 'so', 'not', 'just', 'very',
]);

function tokenise(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z][a-z'-]{1,}/g);
  return matches ?? [];
}

function topWordsFromMessages(messages: Array<{ content: string }>, limit = 10): Array<{ word: string; count: number }> {
  const counter = new Map<string, number>();
  for (const msg of messages) {
    for (const token of tokenise(msg.content)) {
      if (STOP_WORDS.has(token)) continue;
      counter.set(token, (counter.get(token) ?? 0) + 1);
    }
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

export async function GET() {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nowMs = Date.now();
  const fromMs = nowMs - WINDOW_MS;

  try {
    await ensureSchema();
    const [practiceRounds, practiceMessages] = await Promise.all([
      getUsageCount(userId, fromMs),
      listUserPracticeMessagesSince(userId, fromMs),
    ]);

    const words = practiceMessages.reduce((sum, msg) => sum + tokenise(msg.content).length, 0);
    const messageCount = practiceMessages.length;
    const avgWordsPerMessage = messageCount > 0 ? Number((words / messageCount).toFixed(1)) : 0;
    const topWords = topWordsFromMessages(practiceMessages, 8);

    const highlights = [
      `You completed ${practiceRounds} practice rounds in the last 7 days.`,
      `You sent ${messageCount} speaking turns with about ${words} words in total.`,
      avgWordsPerMessage > 0
        ? `Your average response length is ${avgWordsPerMessage} words per turn.`
        : 'No speaking turns detected yet in this window.',
    ];

    const nextActions: string[] = [];
    if (practiceRounds < 7) {
      nextActions.push('Do one focused 10-minute speaking round each day this week.');
    } else {
      nextActions.push('Keep your current consistency and add one extra challenge round this week.');
    }
    if (avgWordsPerMessage < 8) {
      nextActions.push('For each reply, aim for at least two complete English sentences.');
    } else {
      nextActions.push('Start adding one follow-up question in every other turn to improve interaction depth.');
    }
    if (topWords.length > 0) {
      nextActions.push(`Reuse your top words (${topWords.slice(0, 3).map((w) => w.word).join(', ')}) in new sentence patterns.`);
    } else {
      nextActions.push('Pick 5 daily-life words and use each one in two different sentences.');
    }

    const report: WeeklyReport = {
      dateRange: {
        from: new Date(fromMs).toISOString(),
        to: new Date(nowMs).toISOString(),
      },
      practiceRounds,
      messages: messageCount,
      words,
      avgWordsPerMessage,
      topWords,
      highlights,
      nextActions,
    };

    return NextResponse.json(report);
  } catch (e) {
    console.error('[GET /api/weekly-report] error:', String(e));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
