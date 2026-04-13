'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QuestionCard } from '@/components/questions/QuestionCard';

interface Question {
  _id: string;
  question: string;
  solution: string;
  difficulty_level: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  q_type: string;
  q_number: number;
}

interface QuestionList {
  _id: string;
  title: string;
  description: string;
  questionIds: string[];
  isPublished: boolean;
  topic?: string;
  board: string;
  class: string;
  subject: string;
}

const TOPICS = [
  'Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants',
  'Continuity and Differentiability', 'Application of Derivatives', 'Integrals',
  'Application of Integrals', 'Differential Equations', 'Vector Algebra',
  'Three Dimensional Geometry', 'Linear Programming', 'Probability', 'Integrated',
];

export default function EditQuestionListPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [list, setList] = useState<QuestionList | null>(null);
  const [listQuestions, setListQuestions] = useState<Question[]>([]);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [bankLoading, setBankLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'bank'>('list');

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`/api/question-lists/${id}`, { credentials: 'include' });
      if (!res.ok) { setError('List not found'); return; }
      const json = await res.json();
      setList(json.data.list);
      setListQuestions(json.data.questions ?? []);
    } catch {
      setError('Failed to load list');
    }
  }, [id]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const fetchBank = useCallback(async () => {
    if (!selectedTopic) return;
    setBankLoading(true);
    try {
      const params = new URLSearchParams({ topic: selectedTopic, limit: '100' });
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
      const res = await fetch(`/api/questions?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setBankQuestions(json.data.questions ?? []);
    } catch {
      setError('Failed to load question bank');
    } finally {
      setBankLoading(false);
    }
  }, [selectedTopic, selectedDifficulty]);

  useEffect(() => { fetchBank(); }, [fetchBank]);

  async function saveQuestionIds(newIds: string[]) {
    setSaving(true);
    try {
      const res = await fetch(`/api/question-lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questionIds: newIds }),
      });
      if (!res.ok) { setError('Failed to save'); return; }
      fetchList();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  function addQuestion(q: Question) {
    if (!list) return;
    if (list.questionIds.includes(q._id)) return;
    saveQuestionIds([...list.questionIds, q._id]);
  }

  function removeQuestion(qId: string) {
    if (!list) return;
    saveQuestionIds(list.questionIds.filter(id => id !== qId));
  }

  if (error && !list) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!list) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  }

  const inListIds = new Set(list.questionIds);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/teacher/question-lists" className="text-slate-400 hover:text-slate-600 text-sm">← Back</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{list.title}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {list.questionIds.length} question{list.questionIds.length !== 1 ? 's' : ''} ·
            {list.isPublished ? ' Published' : ' Draft'}
          </p>
        </div>
        <Link
          href={`/teacher/assign?listId=${list._id}`}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Assign
        </Link>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
      {saving && <p className="text-xs text-slate-400 mb-3">Saving…</p>}

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {(['list', 'bank'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              activeTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'list' ? `My List (${list.questionIds.length})` : 'Add from Bank'}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <div>
          {listQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-3xl mb-2">📋</p>
              <p>No questions in this list yet.</p>
              <button onClick={() => setActiveTab('bank')} className="mt-2 text-indigo-600 hover:underline text-sm">
                Browse question bank →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {listQuestions.map((q, i) => (
                <div key={q._id} className="relative">
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      onClick={() => removeQuestion(q._id)}
                      className="text-xs text-red-500 hover:text-red-700 bg-white border border-red-200 rounded px-2 py-0.5"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 mb-1">#{i + 1}</div>
                  <QuestionCard
                    question={q as unknown as Parameters<typeof QuestionCard>[0]['question']}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bank' && (
        <div>
          <div className="flex gap-3 mb-4">
            <select
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm text-black"
            >
              <option value="">Select topic…</option>
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-black"
            >
              <option value="">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {!selectedTopic && (
            <div className="text-center py-12 text-slate-400">Select a topic to browse questions</div>
          )}

          {selectedTopic && bankLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          )}

          {selectedTopic && !bankLoading && (
            <div className="space-y-4">
              {bankQuestions.map(q => (
                <div key={q._id} className="relative">
                  <div className="absolute top-3 right-3 z-10">
                    {inListIds.has(q._id) ? (
                      <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                        ✓ Added
                      </span>
                    ) : (
                      <button
                        onClick={() => addQuestion(q)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                  <QuestionCard
                    question={q as unknown as Parameters<typeof QuestionCard>[0]['question']}
                  />
                </div>
              ))}
              {bankQuestions.length === 0 && (
                <div className="text-center py-12 text-slate-400">No questions found</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
