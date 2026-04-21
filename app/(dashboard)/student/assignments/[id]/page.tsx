'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { QuestionCard } from '@/components/questions/QuestionCard';
import type { QuestionData } from '@/components/questions/QuestionCard';

interface QuestionList {
  _id: string;
  title: string;
  description: string;
  questionIds: string[];
  topic?: string;
}

type AnswerState = 'unattempted' | 'correct' | 'incorrect' | 'skipped';

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

export default function AssignmentPracticePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [list, setList] = useState<QuestionList | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/question-lists/${id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => {
        setList(json.data.list);
        setQuestions(json.data.questions ?? []);
      })
      .catch(() => setError('Failed to load assignment'))
      .finally(() => setLoading(false));
  }, [id]);

  // Restore progress
  useEffect(() => {
    if (!id) return;
    fetch(`/api/student-progress?questionListId=${id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json?.data?.progress) return;
        const map: Record<string, AnswerState> = {};
        for (const p of json.data.progress) {
          if (p.status === 'done') map[String(p.questionId)] = 'correct';
          else if (p.status === 'need_help') map[String(p.questionId)] = 'incorrect';
        }
        setAnswers(map);
      })
      .catch(() => {});
  }, [id]);

  async function saveProgress(questionId: string, status: 'done' | 'need_help') {
    try {
      const res = await fetch('/api/student-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questionId, status, questionListId: id }),
      });
      if (!res.ok) console.error('saveProgress failed', res.status);
    } catch (e) {
      console.error('saveProgress error', e);
    }
  }

  function handleNext() {
    setCurrentIdx(i => Math.min(questions.length - 1, i + 1));
  }

  function handleSkip() {
    const q = questions[currentIdx];
    if (q) setAnswers(prev => ({ ...prev, [q._id]: 'skipped' }));
    handleNext();
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="p-8">
        <p className="text-rose-600 mb-4">{error || 'Assignment not found'}</p>
        <Link href="/student/assignments" className="text-indigo-600 hover:underline text-sm">
          ← Back to assignments
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx] ?? null;

  const counts = {
    correct:     Object.values(answers).filter(s => s === 'correct').length,
    incorrect:   Object.values(answers).filter(s => s === 'incorrect').length,
    skipped:     Object.values(answers).filter(s => s === 'skipped').length,
    unattempted: questions.filter(q => !answers[q._id]).length,
  };
  const completedPct = questions.length > 0
    ? Math.round((counts.correct / questions.length) * 100)
    : 0;

  return (
    <div className="flex h-full">
      {/* ── Left sidebar ── */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">

        {/* Back + title */}
        <div className="px-4 py-4 border-b border-slate-100">
          <Link href="/student/assignments" className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 mb-2 transition-colors">
            ← Assignments
          </Link>
          <h2 className="text-sm font-semibold text-slate-900 leading-snug">{list.title}</h2>
          {list.description && <p className="text-xs text-slate-400 mt-1">{list.description}</p>}
        </div>

        {/* Progress bar */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progress</span>
            <span className="font-medium">{completedPct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-2 bg-emerald-400 rounded-full transition-all" style={{ width: `${completedPct}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 border-b border-slate-100 grid grid-cols-2 gap-2">
          {[
            { label: 'Correct',     count: counts.correct,     color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Incorrect',   count: counts.incorrect,   color: 'text-rose-700 bg-rose-50' },
            { label: 'Skipped',     count: counts.skipped,     color: 'text-amber-700 bg-amber-50' },
            { label: 'Remaining',   count: counts.unattempted, color: 'text-slate-600 bg-slate-100' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl px-3 py-2 ${s.color}`}>
              <p className="text-lg font-bold tabular-nums leading-none">{s.count}</p>
              <p className="text-xs mt-0.5 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Question dot-navigator */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Questions</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, i) => {
              const state: AnswerState = answers[q._id] ?? 'unattempted';
              const isActive = i === currentIdx;
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIdx(i)}
                  title={`Q${(q.question_number ?? i + 1)} · ${q.difficulty_level}`}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                    isActive ? DOT_ACTIVE[state] + ' text-white' : DOT_COLORS[state] + ' text-slate-600 hover:opacity-80'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {currentQuestion ? (
          <QuestionCard
            question={currentQuestion}
            onNext={handleNext}
            onSkip={handleSkip}
            onAnswer={(qId, correct) => saveProgress(qId, correct ? 'done' : 'need_help')}
            questionIndex={currentIdx}
            totalQuestions={questions.length}
          />
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
            <p className="text-slate-500">No questions in this assignment.</p>
          </div>
        )}
      </main>
    </div>
  );
}
