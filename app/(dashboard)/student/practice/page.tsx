'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { QuestionCard } from '@/components/questions/QuestionCard';
import type { QuestionData } from '@/components/questions/QuestionCard';

interface ProgressRecord {
  questionId: string;
  status: string;
}

type AnswerState = 'unattempted' | 'correct' | 'incorrect' | 'skipped';

const DIFFICULTY_ORDER = ['Focus', 'Practice', 'Challenge'] as const;

const DOT_COLORS: Record<AnswerState, string> = {
  correct:     'bg-emerald-400',
  incorrect:   'bg-rose-400',
  skipped:     'bg-amber-400',
  unattempted: 'bg-slate-200',
};

const DOT_ACTIVE: Record<AnswerState, string> = {
  correct:     'bg-emerald-500 ring-2 ring-emerald-300',
  incorrect:   'bg-rose-500 ring-2 ring-rose-300',
  skipped:     'bg-amber-500 ring-2 ring-amber-300',
  unattempted: 'bg-indigo-600 ring-2 ring-indigo-300',
};

export default function PracticePage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const topic = searchParams.get('topic') ?? '';

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [adaptiveMode, setAdaptiveMode] = useState(user?.adaptiveLearningEnabled ?? true);
  const [adaptiveQuestion, setAdaptiveQuestion] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters (non-adaptive only)
  const [filterDifficulty, setFilterDifficulty] = useState('');

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    if (!topic || !user) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ topic, limit: '100' });
      if (filterDifficulty) params.set('difficulty', filterDifficulty);
      if (user?.boardOfEducation) params.set('board', user.boardOfEducation);
      if (user?.class) params.set('year', user.class);
      if (user?.subject) params.set('subject', user.subject);
      const res = await fetch(`/api/questions?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load questions');
      const json = await res.json();
      setQuestions(json.data.questions ?? []);
      setCurrentIdx(0);
    } catch {
      setError('Could not load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [topic, filterDifficulty, user]);

  // Fetch existing progress to restore answer state
  const fetchProgress = useCallback(async () => {
    if (!topic) return;
    try {
      const res = await fetch(`/api/student-progress?topic=${encodeURIComponent(topic)}`, { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      const map: Record<string, AnswerState> = {};
      for (const p of (json.data.progress ?? []) as ProgressRecord[]) {
        if (p.status === 'done') map[p.questionId] = 'correct';
        else if (p.status === 'need_help') map[p.questionId] = 'incorrect';
      }
      setAnswers(map);
    } catch {}
  }, [topic]);

  const fetchAdaptive = useCallback(async () => {
    if (!topic || !user) return;
    try {
      const params = new URLSearchParams({ topic });
      if (user?.boardOfEducation) params.set('board', user.boardOfEducation);
      if (user?.class) params.set('year', user.class);
      if (user?.subject) params.set('subject', user.subject);
      const res = await fetch(`/api/student-progress/adaptive?${params}`, { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      setAdaptiveQuestion(json.data.question ?? null);
    } catch {}
  }, [topic, user]);

  useEffect(() => { fetchQuestions(); fetchProgress(); }, [fetchQuestions, fetchProgress]);
  useEffect(() => { if (adaptiveMode) fetchAdaptive(); }, [adaptiveMode, fetchAdaptive]);

  // Save progress after answering
  async function saveProgress(questionId: string, correct: boolean) {
    const status = correct ? 'done' : 'need_help';
    const answerState: AnswerState = correct ? 'correct' : 'incorrect';
    setAnswers(prev => ({ ...prev, [questionId]: answerState }));
    try {
      const res = await fetch('/api/student-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questionId, status }),
      });
      if (!res.ok) console.error('saveProgress failed', res.status);
    } catch (e) {
      console.error('saveProgress error', e);
    }
  }

  function handleNext() {
    if (adaptiveMode) {
      fetchAdaptive();
    } else {
      setCurrentIdx(i => Math.min(displayedQuestions.length - 1, i + 1));
    }
  }

  function handleSkip() {
    const q = adaptiveMode ? adaptiveQuestion : (displayedQuestions[currentIdx] ?? null);
    if (q) setAnswers(prev => ({ ...prev, [q._id]: 'skipped' }));
    handleNext();
  }

  if (!topic) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">No topic selected.</p>
        <Link href="/student" className="mt-4 inline-block text-indigo-600 hover:underline">
          Back to chapters
        </Link>
      </div>
    );
  }

  const displayedQuestions = filterDifficulty
    ? questions.filter(q => q.difficulty_level === filterDifficulty)
    : questions;

  const currentQuestion = adaptiveMode ? adaptiveQuestion : (displayedQuestions[currentIdx] ?? null);

  const counts = {
    correct:     Object.values(answers).filter(s => s === 'correct').length,
    incorrect:   Object.values(answers).filter(s => s === 'incorrect').length,
    skipped:     Object.values(answers).filter(s => s === 'skipped').length,
    unattempted: questions.filter(q => !answers[q._id]).length,
  };

  return (
    <div className="flex h-full">
      {/* ── Left sidebar ── */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">

        {/* Back + topic */}
        <div className="px-4 py-4 border-b border-slate-100">
          <Link href="/student" className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 mb-2 transition-colors">
            ← All chapters
          </Link>
          <h2 className="text-sm font-semibold text-slate-900 leading-snug">{topic}</h2>
        </div>

        {/* Progress summary */}
        <div className="px-4 py-3 border-b border-slate-100 grid grid-cols-2 gap-2">
          {[
            { label: 'Correct',   count: counts.correct,     color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Incorrect', count: counts.incorrect,   color: 'text-rose-700 bg-rose-50' },
            { label: 'Skipped',   count: counts.skipped,     color: 'text-amber-700 bg-amber-50' },
            { label: 'Remaining', count: counts.unattempted, color: 'text-slate-600 bg-slate-100' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl px-3 py-2 ${s.color}`}>
              <p className="text-lg font-bold tabular-nums leading-none">{s.count}</p>
              <p className="text-xs mt-0.5 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Adaptive toggle */}
        <div className="px-4 py-3 border-b border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setAdaptiveMode(m => !m)}
              className={`relative w-9 h-5 rounded-full transition-colors ${adaptiveMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${adaptiveMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs font-medium text-slate-700">Adaptive mode</span>
          </label>
          {adaptiveMode && (
            <p className="text-xs text-slate-400 mt-1">Questions chosen by your performance</p>
          )}
        </div>

        {/* Difficulty filter (non-adaptive) */}
        {!adaptiveMode && (
          <div className="px-4 py-3 border-b border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Filter</p>
            <select
              value={filterDifficulty}
              onChange={e => { setFilterDifficulty(e.target.value); setCurrentIdx(0); }}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 bg-white"
            >
              <option value="">All difficulties</option>
              {DIFFICULTY_ORDER.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}

        {/* Question dot-navigator (non-adaptive) */}
        {!adaptiveMode && (
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Questions</p>
            <div className="flex flex-wrap gap-1.5">
              {displayedQuestions.map((q, i) => {
                const state: AnswerState = answers[q._id] ?? 'unattempted';
                const isActive = i === currentIdx;
                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIdx(i)}
                    title={`Q${q.question_number} · ${q.difficulty_level}`}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                      isActive ? DOT_ACTIVE[state] + ' text-white' : DOT_COLORS[state] + ' text-slate-600 hover:opacity-80'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
              {displayedQuestions.length === 0 && !loading && (
                <p className="text-xs text-slate-400">No questions match filter</p>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">{error}</div>
        )}

        {!loading && !error && (
          <>
            {currentQuestion ? (
              <QuestionCard
                question={currentQuestion}
                onNext={handleNext}
                onSkip={handleSkip}
                onAnswer={saveProgress}
                questionIndex={adaptiveMode ? undefined : currentIdx}
                totalQuestions={adaptiveMode ? undefined : displayedQuestions.length}
              />
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
                <p className="text-3xl mb-3">🎉</p>
                <p className="font-semibold text-emerald-800 text-lg">All done!</p>
                <p className="text-sm text-emerald-600 mt-1">
                  You have worked through all available questions in this chapter.
                </p>
                <Link href="/student" className="mt-5 inline-block text-indigo-600 hover:underline text-sm font-medium">
                  Choose another chapter →
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
