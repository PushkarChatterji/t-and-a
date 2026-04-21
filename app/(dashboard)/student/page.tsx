'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const CHAPTER_ICONS = ['🔗', '📐', '🔢', '📊', '♾️', '📈', '∫', '📏', '⚡', '→', '🧊', '📉', '🎲', '🔀'];

interface TopicStat {
  topic: string;
  attempted: number;
  totalQuestions: number;
  done: number;
}

export default function StudentHomePage() {
  const { user, isLoading } = useAuth();
  const [topics, setTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [stats, setStats] = useState<Record<string, TopicStat>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isLoading || !user) return;
    const params = new URLSearchParams();
    if (user.boardOfEducation) params.set('board', user.boardOfEducation);
    if (user.class) params.set('class', user.class);
    if (user.subject) params.set('subject', user.subject);
    setLoadingTopics(true);
    fetch(`/api/questions/topics?${params}`, { credentials: 'include', cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(json => { setTopics(json?.data ?? []); })
      .catch(() => { setTopics([]); })
      .finally(() => setLoadingTopics(false));
  }, [user, isLoading]);

  useEffect(() => {
    if (isLoading || !user) return;
    fetch('/api/student-progress/stats?groupBy=topic', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data?.stats) {
          const map: Record<string, TopicStat> = {};
          for (const s of json.data.stats) map[s.topic] = s;
          setStats(map);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [user, isLoading]);

  const totalDone = Object.values(stats).reduce((s, t) => s + (t.done ?? 0), 0);
  const totalAttempted = Object.values(stats).reduce((s, t) => s + (t.attempted ?? 0), 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl text-slate-900"
          style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
        >
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Choose a chapter to start practising</p>
        {!loadingStats && totalAttempted > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            {totalDone} correct · {totalAttempted} attempted across all chapters
          </div>
        )}
      </div>

      {/* Chapter grid */}
      {loadingTopics && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}
      {!loadingTopics && topics.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">No chapters available yet</p>
          <p className="text-sm mt-1">Questions for your board and year are coming soon.</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic, i) => {
          const stat = stats[topic];
          const pct = stat && stat.totalQuestions > 0
            ? Math.round((stat.done / stat.totalQuestions) * 100)
            : 0;
          return (
            <Link
              key={topic}
              href={`/student/practice?topic=${encodeURIComponent(topic)}`}
              className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-[0_4px_16px_-2px_rgb(79_70_229/0.12)] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg group-hover:bg-indigo-100 transition-colors">
                  {CHAPTER_ICONS[i % CHAPTER_ICONS.length]}
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 leading-snug transition-colors mb-3">
                {topic}
              </h3>

              <div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <p className="text-xs text-slate-400">{pct}% complete</p>
                  {stat && (
                    <p className="text-xs text-slate-400">{stat.done}/{stat.totalQuestions}</p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
