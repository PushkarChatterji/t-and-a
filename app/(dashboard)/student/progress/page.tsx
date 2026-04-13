'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TopicStat {
  topic: string;
  attempted: number;
  totalQuestions: number;
  done: number;
  need_help: number;
}


export default function ProgressPage() {
  const [stats, setStats] = useState<TopicStat[]>([]);
  const [totalByTopic, setTotalByTopic] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student-progress/stats?groupBy=topic', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) {
          setStats(json.data.stats ?? []);
          setTotalByTopic(json.data.totalByTopic ?? {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalDone = stats.reduce((s, t) => s + t.done, 0);
  const totalHelp = stats.reduce((s, t) => s + t.need_help, 0);
  const totalAttempted = stats.reduce((s, t) => s + t.attempted, 0);
  const grandTotal = Object.values(totalByTopic).reduce((s, n) => s + n, 0);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Progress</h1>
        <p className="text-slate-500 mt-1">Overview of your practice across all chapters</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Done', value: totalDone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Need Help', value: totalHelp, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Total Attempted', value: totalAttempted, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}

      {!loading && stats.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500 mb-3">No progress yet. Start practising to see your stats here.</p>
          <Link href="/student" className="text-indigo-600 hover:underline text-sm">Browse chapters</Link>
        </div>
      )}

      {!loading && stats.length > 0 && (
        <div className="space-y-4">
          {stats.map(s => {
            const total = totalByTopic[s.topic] ?? s.totalQuestions;
            const donePct = total > 0 ? (s.done / total) * 100 : 0;
            const helpPct = total > 0 ? (s.need_help / total) * 100 : 0;

            return (
              <div key={s.topic} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Link
                    href={`/student/practice?topic=${encodeURIComponent(s.topic)}`}
                    className="text-sm font-semibold text-slate-900 hover:text-indigo-700"
                  >
                    {s.topic}
                  </Link>
                  <span className="text-xs text-slate-400">{s.done}/{total} done</span>
                </div>

                {/* Stacked progress bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-400 transition-all"
                    style={{ width: `${donePct}%` }}
                  />
                  <div
                    className="h-full bg-red-400 transition-all"
                    style={{ width: `${helpPct}%` }}
                  />
                </div>

                <div className="flex gap-4 mt-2">
                  {[
                    { label: 'Done', value: s.done, color: 'text-emerald-600' },
                    { label: 'Need Help', value: s.need_help, color: 'text-red-600' },
                    { label: 'Unattempted', value: total - s.attempted, color: 'text-slate-400' },
                  ].map(item => (
                    <div key={item.label} className="text-center">
                      <p className={`text-xs font-semibold ${item.color}`}>{item.value}</p>
                      <p className="text-xs text-slate-400">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
