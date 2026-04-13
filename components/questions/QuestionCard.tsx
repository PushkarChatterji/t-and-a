'use client';

import { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ── LaTeX renderer ──────────────────────────────────────────────────────────
function LatexRenderer({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const parts = text.split(/(\\$\\$[\s\S]+?\\$\\$|\$[^$\n]+?\$)/g);
    ref.current.innerHTML = parts
      .map(part => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          try {
            return katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false });
          } catch { return part; }
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          try {
            return katex.renderToString(part.slice(1, -1), { displayMode: false, throwOnError: false });
          } catch { return part; }
        }
        return part
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>');
      })
      .join('');
  }, [text]);

  return <div ref={ref} className={`leading-relaxed ${className}`} />;
}

// ── Difficulty badge styles ─────────────────────────────────────────────────
const DIFF_STYLES: Record<string, string> = {
  Focus:     'bg-violet-50  text-violet-700  ring-1 ring-violet-200',
  Practice:  'bg-amber-50   text-amber-700   ring-1 ring-amber-200',
  Challenge: 'bg-rose-50    text-rose-700    ring-1 ring-rose-200',
};

// ── Single answer option row ────────────────────────────────────────────────
function OptionRow({
  letter, text, selected, submitted, isCorrectAnswer, onSelect,
}: {
  letter: string;
  text: string;
  selected: boolean;
  submitted: boolean;
  isCorrectAnswer: boolean;
  onSelect: () => void;
}) {
  let ringClass = 'ring-1 ring-slate-200 hover:ring-indigo-300 hover:bg-indigo-50/40';
  let bgClass = 'bg-white';
  let badgeClass = 'bg-slate-100 text-slate-500';
  let icon: React.ReactNode = null;

  if (submitted) {
    if (isCorrectAnswer) {
      ringClass = 'ring-2 ring-emerald-400';
      bgClass = 'bg-emerald-50';
      badgeClass = 'bg-emerald-500 text-white';
      icon = <span className="ml-auto text-emerald-600 text-base font-bold shrink-0">✓</span>;
    } else if (selected) {
      ringClass = 'ring-2 ring-rose-400';
      bgClass = 'bg-rose-50';
      badgeClass = 'bg-rose-500 text-white';
      icon = <span className="ml-auto text-rose-500 text-base font-bold shrink-0">✗</span>;
    }
  } else if (selected) {
    ringClass = 'ring-2 ring-indigo-400';
    bgClass = 'bg-indigo-50/60';
    badgeClass = 'bg-indigo-600 text-white';
  }

  return (
    <label
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 ${bgClass} ${ringClass} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <input
        type="radio"
        name="answer"
        value={letter}
        checked={selected}
        onChange={onSelect}
        disabled={submitted}
        className="sr-only"
      />
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${badgeClass}`}>
        {letter}
      </span>
      <LatexRenderer text={text} className="text-sm text-slate-800 flex-1" />
      {icon}
    </label>
  );
}

// ── Public question data type ───────────────────────────────────────────────
export interface QuestionData {
  _id: string;
  edu_board: string;
  year: string;
  subject: string;
  chapter_name: string;
  section: string;
  section_name: string;
  question_number: number;
  question: string;
  diagram: string;
  answer_options: Record<string, string>;
  correct_answer_option: string;
  solution_explanation: string;
  difficulty_level: string;
}

export interface QuestionCardProps {
  question: QuestionData;
  onNext?: () => void;
  onSkip?: () => void;
  onAnswer?: (questionId: string, correct: boolean) => void;
  questionIndex?: number;
  totalQuestions?: number;
}

// ── Main component ──────────────────────────────────────────────────────────
export function QuestionCard({ question, onNext, onSkip, onAnswer, questionIndex, totalQuestions }: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    setShowSolution(false);
  }, [question._id]);

  const optionEntries = Object.entries(question.answer_options ?? {});
  const correctKey = question.correct_answer_option ?? '';
  const isCorrect = submitted && selected === correctKey;
  const qNum = question.question_number ?? (questionIndex != null ? questionIndex + 1 : undefined);
  const diffStyle = DIFF_STYLES[question.difficulty_level] ?? '';

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    onAnswer?.(question._id, selected === correctKey);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {qNum !== undefined && (
            <span className="text-xs font-semibold text-slate-400 tabular-nums">Q{qNum}</span>
          )}
          {totalQuestions !== undefined && qNum !== undefined && (
            <span className="text-xs text-slate-300">/ {totalQuestions}</span>
          )}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${diffStyle}`}>
            {question.difficulty_level}
          </span>
        </div>
        {question.section_name && (
          <span className="text-xs text-slate-400 truncate max-w-[200px]">
            {question.section_name}
          </span>
        )}
      </div>

      {/* ── Question text ───────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4">
        <LatexRenderer
          text={question.question}
          className="text-slate-900 text-[15px] font-medium"
        />
      </div>

      {/* ── Diagram ─────────────────────────────────────────────────────── */}
      {question.diagram && (
        <div className="px-6 pb-4 flex justify-center">
          <div
            className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
            style={{ width: 500, height: 500 }}
            dangerouslySetInnerHTML={{ __html: question.diagram }}
          />
        </div>
      )}

      {/* ── Answer options ──────────────────────────────────────────────── */}
      {optionEntries.length > 0 && (
        <div className="px-6 pb-5 space-y-2.5">
          {optionEntries.map(([letter, text]) => (
            <OptionRow
              key={letter}
              letter={letter}
              text={text}
              selected={selected === letter}
              submitted={submitted}
              isCorrectAnswer={letter === correctKey}
              onSelect={() => { if (!submitted) setSelected(letter); }}
            />
          ))}
        </div>
      )}

      {/* ── Feedback banner ─────────────────────────────────────────────── */}
      {submitted && (
        <div
          className={`mx-6 mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            isCorrect
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
          }`}
        >
          <span className="text-base">{isCorrect ? '✓' : '✗'}</span>
          {isCorrect
            ? 'Correct! Well done.'
            : `Incorrect. The correct answer is ${correctKey}.`}
        </div>
      )}

      {/* ── Solution panel ──────────────────────────────────────────────── */}
      {showSolution && question.solution_explanation && (
        <div className="mx-6 mb-5 rounded-xl bg-indigo-50/60 border border-indigo-100 p-5">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-3">Solution</p>
          <LatexRenderer
            text={question.solution_explanation}
            className="text-sm text-slate-800"
          />
        </div>
      )}

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
        {!submitted ? (
          <>
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Submit
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowSolution(s => !s)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              {showSolution ? 'Hide Solution' : 'Show Solution'}
            </button>
            <button
              onClick={onNext}
              className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Next Question →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
