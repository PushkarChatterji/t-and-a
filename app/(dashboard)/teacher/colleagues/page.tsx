'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface ColleagueList {
  _id: string;
  title: string;
  description: string;
  questionIds: string[];
  topic?: string;
  board: string;
  class: string;
  subject: string;
  createdAt: string;
  creatorName: string;
}

export default function TeacherColleaguesPage() {
  const { user } = useAuth();
  const [lists, setLists] = useState<ColleagueList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    if (!user?.schoolId) return;
    fetch(`/api/question-lists/school/${user.schoolId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => setLists(json.data?.lists ?? []))
      .catch(() => setError('Failed to load colleague lists'))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleAdopt(list: ColleagueList) {
    if (!user?.schoolId) return;
    setCopying(list._id);
    setCopySuccess('');
    try {
      const res = await fetch('/api/question-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: `${list.title} (copy)`,
          description: list.description,
          schoolId: user.schoolId,
          questionIds: list.questionIds,
          board: list.board,
          class: list.class,
          subject: list.subject,
          topic: list.topic,
          isPublished: false,
        }),
      });
      if (!res.ok) throw new Error();
      setCopySuccess(`"${list.title}" adopted into your lists!`);
    } catch {
      setError('Failed to adopt list');
    } finally {
      setCopying(null);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Colleagues' Lists</h1>
      <p className="text-slate-500 text-sm mb-6">Browse published question lists from your school's teachers.</p>

      {copySuccess && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm">
          {copySuccess} <Link href="/teacher/question-lists" className="underline font-medium">View your lists →</Link>
        </div>
      )}
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-medium">No published lists yet</p>
          <p className="text-sm mt-1">Your colleagues haven't published any lists yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(list => (
            <div key={list._id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900">{list.title}</h3>
                    {list.topic && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{list.topic}</span>
                    )}
                  </div>
                  {list.description && (
                    <p className="text-xs text-slate-500 mt-1">{list.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    By {list.creatorName} · {list.questionIds.length} questions ·
                    {list.board} · Class {list.class} ·
                    {new Date(list.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleAdopt(list)}
                  disabled={copying === list._id}
                  className="shrink-0 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-100 disabled:opacity-60 transition-colors"
                >
                  {copying === list._id ? 'Adopting…' : 'Adopt'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
