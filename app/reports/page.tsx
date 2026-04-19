'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { WeeklyReport } from '@/types';

type LoadState = 'idle' | 'loading' | 'error';

export default function ReportsPage() {
  const [state, setState] = useState<LoadState>('loading');
  const [report, setReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState('loading');
        const res = await fetch('/api/weekly-report', { cache: 'no-store' });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as WeeklyReport;
        if (cancelled) return;
        setReport(data);
        setState('idle');
      } catch {
        if (cancelled) return;
        setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Learning Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Weekly Report</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          7-day speaking summary, high-frequency words, and next-step actions.
        </p>
      </header>

      {state === 'loading' ? (
        <section className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Loading weekly report...
        </section>
      ) : state === 'error' || !report ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Could not load report right now. Please refresh later.
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-medium">Core Stats</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Practice rounds</p>
                <p className="mt-1 text-2xl font-semibold">{report.practiceRounds}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Speaking turns</p>
                <p className="mt-1 text-2xl font-semibold">{report.messages}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Words</p>
                <p className="mt-1 text-2xl font-semibold">{report.words}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Avg words/turn</p>
                <p className="mt-1 text-2xl font-semibold">{report.avgWordsPerMessage}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-medium">Top Words</h2>
            {report.topWords.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No vocabulary data yet this week.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {report.topWords.map((item) => (
                  <li key={item.word} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="font-medium">{item.word}</span>
                    <span className="text-muted-foreground">{item.count}x</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-6 md:col-span-2">
            <h2 className="text-lg font-medium">Highlights</h2>
            <ul className="mt-3 list-disc pl-6 text-sm leading-7">
              {report.highlights.map((line) => <li key={line}>{line}</li>)}
            </ul>

            <h2 className="mt-6 text-lg font-medium">Next Actions</h2>
            <ul className="mt-3 list-disc pl-6 text-sm leading-7">
              {report.nextActions.map((line) => <li key={line}>{line}</li>)}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/chat" className="rounded-xl border px-4 py-2 text-sm hover:bg-muted">
                Back To Chat
              </Link>
              <Link href="/vocab" className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">
                Review Vocabulary Cards
              </Link>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
