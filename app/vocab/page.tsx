'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import type { VocabCard, VocabReviewRating } from '@/types';

type Banner = {
  tone: 'success' | 'error';
  text: string;
} | null;

type Tab = 'review' | 'all';

type CardsResponse = {
  cards?: VocabCard[];
};

type CardMutationResponse = {
  card?: VocabCard;
};

const REVIEW_BUTTONS: Array<{ rating: VocabReviewRating; label: string; hint: string }> = [
  { rating: 'again', label: 'Again', hint: '忘了，明天再来' },
  { rating: 'hard', label: 'Hard', hint: '有点难，间隔短一些' },
  { rating: 'good', label: 'Good', hint: '正常记住，按标准间隔' },
  { rating: 'easy', label: 'Easy', hint: '很熟，拉长间隔' },
];

function sortCards(cards: VocabCard[]): VocabCard[] {
  return [...cards].sort((a, b) => {
    if (a.dueAt !== b.dueAt) return a.dueAt - b.dueAt;
    return b.updatedAt - a.updatedAt;
  });
}

function formatDue(ts: number): string {
  const now = Date.now();
  const diff = ts - now;
  const dayMs = 24 * 60 * 60 * 1000;
  if (Math.abs(diff) < dayMs) return 'Today';
  if (diff > 0 && diff < 2 * dayMs) return 'Tomorrow';
  if (diff < 0 && diff > -2 * dayMs) return 'Yesterday';
  return new Date(ts).toLocaleDateString();
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message = data && typeof data === 'object' && 'error' in data
      ? String((data as { error?: unknown }).error ?? 'Request failed')
      : `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

async function mutateJson<T>(url: string, method: 'POST' | 'PATCH' | 'DELETE', body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message = data && typeof data === 'object' && 'error' in data
      ? String((data as { error?: unknown }).error ?? 'Request failed')
      : `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export default function VocabPage() {
  const [tab, setTab] = useState<Tab>('review');
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [dueCards, setDueCards] = useState<VocabCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  const [phrase, setPhrase] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPhrase, setEditPhrase] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const [editExample, setEditExample] = useState('');
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dueCount = dueCards.length;
  const totalCount = cards.length;
  const reviewTotal = reviewedCount + dueCount;
  const currentCard = dueCards[0] ?? null;

  const filteredCards = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return cards;
    return cards.filter((card) => {
      const hay = `${card.phrase} ${card.meaning} ${card.example}`.toLowerCase();
      return hay.includes(keyword);
    });
  }, [cards, search]);

  const resetBannerLater = useCallback(() => {
    window.setTimeout(() => {
      setBanner(null);
    }, 3000);
  }, []);

  const loadCards = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [allData, dueData] = await Promise.all([
        getJson<CardsResponse>('/api/vocab/cards?limit=300'),
        getJson<CardsResponse>('/api/vocab/cards?dueOnly=1&limit=100'),
      ]);

      const allCards = sortCards(allData.cards ?? []);
      const due = sortCards(dueData.cards ?? []);
      setCards(allCards);
      setDueCards(due);
      setReviewedCount(0);
      setShowAnswer(false);
      if (!silent) {
        setBanner(null);
      }
    } catch (error) {
      setBanner({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to load cards',
      });
      resetBannerLater();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [resetBannerLater]);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  const upsertCard = (next: VocabCard) => {
    setCards((prev) => {
      const has = prev.some((item) => item.id === next.id);
      return sortCards(has ? prev.map((item) => (item.id === next.id ? next : item)) : [...prev, next]);
    });
    if (next.dueAt <= Date.now()) {
      setDueCards((prev) => {
        const has = prev.some((item) => item.id === next.id);
        const nextDue = has
          ? prev.map((item) => (item.id === next.id ? next : item))
          : [...prev, next];
        return sortCards(nextDue);
      });
    } else {
      setDueCards((prev) => prev.filter((item) => item.id !== next.id));
    }
  };

  const handleAddCard = async (event: FormEvent) => {
    event.preventDefault();
    const p = phrase.trim();
    if (!p) {
      setBanner({ tone: 'error', text: '请先输入单词或短语。' });
      resetBannerLater();
      return;
    }

    setIsAdding(true);
    try {
      const data = await mutateJson<CardMutationResponse>('/api/vocab/cards', 'POST', {
        phrase: p,
        meaning: meaning.trim(),
        example: example.trim(),
        source: 'manual',
      });
      if (!data.card) throw new Error('Card create failed');

      upsertCard(data.card);
      setPhrase('');
      setMeaning('');
      setExample('');
      setBanner({ tone: 'success', text: `已保存词卡：${data.card.phrase}` });
      resetBannerLater();
      if (tab === 'review') {
        setShowAnswer(false);
      }
    } catch (error) {
      setBanner({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Create card failed',
      });
      resetBannerLater();
    } finally {
      setIsAdding(false);
    }
  };

  const handleReview = async (rating: VocabReviewRating) => {
    if (!currentCard || isSubmittingReview) return;

    setIsSubmittingReview(true);
    try {
      const data = await mutateJson<CardMutationResponse>('/api/vocab/review', 'POST', {
        cardId: currentCard.id,
        rating,
      });
      if (!data.card) throw new Error('Review failed');

      setDueCards((prev) => prev.filter((card) => card.id !== currentCard.id));
      setCards((prev) => sortCards(prev.map((card) => (card.id === data.card!.id ? data.card! : card))));
      setReviewedCount((prev) => prev + 1);
      setShowAnswer(false);
    } catch (error) {
      setBanner({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Review failed',
      });
      resetBannerLater();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const beginEdit = (card: VocabCard) => {
    setEditingId(card.id);
    setEditPhrase(card.phrase);
    setEditMeaning(card.meaning);
    setEditExample(card.example);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPhrase('');
    setEditMeaning('');
    setEditExample('');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const p = editPhrase.trim();
    if (!p) {
      setBanner({ tone: 'error', text: '词条不能为空。' });
      resetBannerLater();
      return;
    }

    setSavingEditId(editingId);
    try {
      const data = await mutateJson<CardMutationResponse>('/api/vocab/cards', 'PATCH', {
        cardId: editingId,
        phrase: p,
        meaning: editMeaning.trim(),
        example: editExample.trim(),
      });
      if (!data.card) throw new Error('Update failed');

      upsertCard(data.card);
      cancelEdit();
      setBanner({ tone: 'success', text: '词卡已更新。' });
      resetBannerLater();
    } catch (error) {
      setBanner({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Update failed',
      });
      resetBannerLater();
    } finally {
      setSavingEditId(null);
    }
  };

  const handleDelete = async (cardId: string) => {
    const target = cards.find((card) => card.id === cardId);
    const ok = window.confirm(`确认删除词卡「${target?.phrase ?? cardId}」吗？`);
    if (!ok) return;

    setDeletingId(cardId);
    try {
      await mutateJson<{ ok?: boolean }>('/api/vocab/cards', 'DELETE', { cardId });
      setCards((prev) => prev.filter((card) => card.id !== cardId));
      setDueCards((prev) => prev.filter((card) => card.id !== cardId));
      if (editingId === cardId) {
        cancelEdit();
      }
      setBanner({ tone: 'success', text: '词卡已删除。' });
      resetBannerLater();
    } catch (error) {
      setBanner({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Delete failed',
      });
      resetBannerLater();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Vocabulary SRS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">词卡复习</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            先看题面，再揭晓释义并打分，系统会自动安排下一次复习时间。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/chat" className="rounded-xl border px-3 py-2 text-sm hover:bg-muted">
            回到对话
          </Link>
          <Link href="/reports" className="rounded-xl border px-3 py-2 text-sm hover:bg-muted">
            学习周报
          </Link>
        </div>
      </header>

      {banner && (
        <section
          className={[
            'mb-5 rounded-xl border px-4 py-3 text-sm',
            banner.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700',
          ].join(' ')}
        >
          {banner.text}
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-base font-semibold">新增词卡</h2>
            <form className="mt-4 space-y-3" onSubmit={handleAddCard}>
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">单词 / 短语</span>
                <input
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  placeholder="例如: break the ice"
                  className="w-full rounded-xl border bg-background px-3 py-2 outline-none ring-0 focus:border-primary"
                  maxLength={200}
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">释义（可选）</span>
                <textarea
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  placeholder="例如: 打破沉默，活跃气氛"
                  className="min-h-[70px] w-full rounded-xl border bg-background px-3 py-2 outline-none focus:border-primary"
                  maxLength={600}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">例句（可选）</span>
                <textarea
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  placeholder="例如: I told a joke to break the ice."
                  className="min-h-[70px] w-full rounded-xl border bg-background px-3 py-2 outline-none focus:border-primary"
                  maxLength={600}
                />
              </label>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
              >
                {isAdding ? '保存中...' : '保存词卡'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-base font-semibold">当前状态</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">待复习</p>
                <p className="mt-1 text-2xl font-semibold">{dueCount}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">总词卡</p>
                <p className="mt-1 text-2xl font-semibold">{totalCount}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>1. 在左侧录入词卡。</li>
              <li>2. 在“复习模式”先回忆，再点“显示答案”。</li>
              <li>3. 根据掌握程度打分，系统自动排期。</li>
            </ul>
          </section>
        </aside>

        <section className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div className="flex rounded-xl border p-1">
              <button
                onClick={() => setTab('review')}
                className={[
                  'rounded-lg px-3 py-1.5 text-sm',
                  tab === 'review' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                ].join(' ')}
              >
                复习模式
              </button>
              <button
                onClick={() => setTab('all')}
                className={[
                  'rounded-lg px-3 py-1.5 text-sm',
                  tab === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                ].join(' ')}
              >
                全部词卡
              </button>
            </div>

            <button
              onClick={() => void loadCards(true)}
              disabled={isRefreshing || isLoading}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
            >
              {isRefreshing ? '刷新中...' : '刷新数据'}
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-xl border bg-background px-4 py-6 text-sm text-muted-foreground">
              正在加载词卡...
            </div>
          ) : tab === 'review' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>进度：{reviewedCount} / {reviewTotal}</span>
                <span>待复习：{dueCount}</span>
              </div>

              {!currentCard ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center">
                  <h3 className="text-lg font-semibold text-emerald-700">今天的到期词卡已经复习完成</h3>
                  <p className="mt-2 text-sm text-emerald-600">你可以先去全部词卡里补充新词，系统会在后续自动安排复习。</p>
                  <button
                    onClick={() => setTab('all')}
                    className="mt-4 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm text-emerald-700"
                  >
                    去管理词卡
                  </button>
                </div>
              ) : (
                <>
                  <article className="rounded-2xl border bg-background px-5 py-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Prompt</p>
                    <h3 className="mt-2 text-2xl font-semibold">{currentCard.phrase}</h3>

                    {showAnswer ? (
                      <div className="mt-5 space-y-3 rounded-xl border bg-card px-4 py-4 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Meaning</p>
                          <p className="mt-1 whitespace-pre-wrap">{currentCard.meaning || '未填写释义'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Example</p>
                          <p className="mt-1 whitespace-pre-wrap">{currentCard.example || '未填写例句'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-6 rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                        先自己回忆释义与用法，然后点击“显示答案”。
                      </p>
                    )}
                  </article>

                  {!showAnswer ? (
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="w-full rounded-xl border bg-background px-4 py-2 text-sm hover:bg-muted"
                    >
                      显示答案
                    </button>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-4">
                      {REVIEW_BUTTONS.map((item) => (
                        <button
                          key={item.rating}
                          onClick={() => void handleReview(item.rating)}
                          disabled={isSubmittingReview}
                          className="rounded-xl border bg-background px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-60"
                        >
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.hint}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索单词、释义或例句"
                  className="w-full flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <span className="text-xs text-muted-foreground">{filteredCards.length} / {cards.length}</span>
              </div>

              {filteredCards.length === 0 ? (
                <div className="rounded-xl border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                  没有匹配的词卡，试试换个关键词。
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCards.map((card) => {
                    const isEditing = editingId === card.id;
                    const isSaving = savingEditId === card.id;
                    const isDeleting = deletingId === card.id;

                    return (
                      <article key={card.id} className="rounded-xl border bg-background px-4 py-4">
                        {isEditing ? (
                          <div className="space-y-3 text-sm">
                            <input
                              value={editPhrase}
                              onChange={(e) => setEditPhrase(e.target.value)}
                              className="w-full rounded-lg border bg-card px-3 py-2 outline-none focus:border-primary"
                              maxLength={200}
                            />
                            <textarea
                              value={editMeaning}
                              onChange={(e) => setEditMeaning(e.target.value)}
                              className="min-h-[60px] w-full rounded-lg border bg-card px-3 py-2 outline-none focus:border-primary"
                              maxLength={600}
                            />
                            <textarea
                              value={editExample}
                              onChange={(e) => setEditExample(e.target.value)}
                              className="min-h-[60px] w-full rounded-lg border bg-card px-3 py-2 outline-none focus:border-primary"
                              maxLength={600}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => void handleSaveEdit()}
                                disabled={isSaving}
                                className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
                              >
                                {isSaving ? '保存中...' : '保存'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <h3 className="text-lg font-semibold">{card.phrase}</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Due: {formatDue(card.dueAt)} · Reviews: {card.reviewCount} · Source: {card.source}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => beginEdit(card)}
                                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={() => void handleDelete(card.id)}
                                  disabled={isDeleting}
                                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                                >
                                  {isDeleting ? '删除中...' : '删除'}
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 space-y-2 text-sm">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-muted-foreground">Meaning</p>
                                <p className="mt-1 whitespace-pre-wrap">{card.meaning || '未填写释义'}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-muted-foreground">Example</p>
                                <p className="mt-1 whitespace-pre-wrap">{card.example || '未填写例句'}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
