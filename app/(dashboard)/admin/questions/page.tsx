'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { QuestionCard } from '@/components/questions/QuestionCard';
import type { QuestionData } from '@/components/questions/QuestionCard';
import { useAuth } from '@/context/AuthContext';

type AdminTab = 'browser' | 'import';

const DIFFICULTIES = ['Focus', 'Practice', 'Challenge'];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---- Question Browser ----
interface FilterOptions {
  boards: string[];
  years: string[];
  topics: string[];
  difficulties: string[];
}

function QuestionBrowser() {
  const { isLoading: authLoading } = useAuth();
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);

  const [board, setBoard] = useState('');
  const [year, setYear] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const [opts, setOpts] = useState<FilterOptions>({ boards: [], years: [], topics: [], difficulties: [] });

  const [previewQ, setPreviewQ] = useState<QuestionData | null>(null);
  const [editQ, setEditQ] = useState<QuestionData | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    setFiltersLoading(true);
    const params = new URLSearchParams();
    if (board) params.set('board', board);
    if (year)  params.set('year', year);
    fetch(`/api/questions/filters?${params}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) {
          const d = json.data;
          setOpts({
            boards:       Array.isArray(d.boards)       ? d.boards       : [],
            years:        Array.isArray(d.years)        ? d.years        : [],
            topics:       Array.isArray(d.topics)       ? d.topics       : [],
            difficulties: Array.isArray(d.difficulties) ? d.difficulties : [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setFiltersLoading(false));
  }, [authLoading, board, year]);

  const fetchQ = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (board)      params.set('board', board);
      if (year)       params.set('year', year);
      if (topic)      params.set('topic', topic);
      if (difficulty) params.set('difficulty', difficulty);
      const res = await fetch(`/api/questions?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setQuestions(json.data.questions);
        setTotal(json.data.total);
        setPages(json.data.pages);
        setError('');
        if (json.data._debug) {
          console.log('[admin/questions] debug:', json.data._debug);
          if (json.data.total === 0) {
            setError(`0 questions found — DB: ${json.data._debug.db}, collection: ${json.data._debug.collection}`);
          }
        }
      } else {
        setError(`API error (${res.status}): ${json.error ?? 'unknown'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [page, board, year, topic, difficulty]);

  useEffect(() => { if (!authLoading) fetchQ(); }, [authLoading, fetchQ]);

  function selectBoard(val: string) { setBoard(val); setYear(''); setTopic(''); setDifficulty(''); setPage(1); }
  function selectYear(val: string)  { setYear(val);  setTopic(''); setDifficulty(''); setPage(1); }

  const sel = 'text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-black bg-white disabled:opacity-40';

  const diffColour = (d: string) =>
    d === 'Focus'    ? 'bg-violet-100 text-violet-700' :
    d === 'Practice' ? 'bg-amber-100 text-amber-700'   :
                       'bg-red-100 text-red-700';          // Challenge

  return (
    <div>
      {message && <div className="mb-3 text-sm px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700">{message}</div>}
      {error && <div className="mb-3 text-sm px-4 py-2 rounded-lg bg-red-50 text-red-700 font-mono">{error}</div>}

      {/* Cascading filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select value={board} onChange={e => selectBoard(e.target.value)} className={sel}>
          <option value="">All boards</option>
          {opts.boards.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select value={year} onChange={e => selectYear(e.target.value)} className={sel} disabled={filtersLoading}>
          <option value="">All years</option>
          {opts.years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select value={topic} onChange={e => { setTopic(e.target.value); setPage(1); }} className={sel} disabled={filtersLoading}>
          <option value="">All chapters</option>
          {opts.topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(1); }} className={sel} disabled={filtersLoading}>
          <option value="">All difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <span className="text-xs text-slate-400 self-center ml-auto">{total} questions</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Q#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Board / Year</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chapter</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Section</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Difficulty</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No questions found</td></tr>
            ) : questions.map(q => (
              <tr key={q._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{q.question_number}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <span className="font-medium">{q.edu_board}</span>
                  <span className="text-slate-400 ml-1">Yr {q.year}</span>
                </td>
                <td className="px-4 py-3 text-slate-800 text-xs max-w-[200px]">
                  <span className="block truncate">{q.chapter_name}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px]">
                  <span className="block truncate">{q.section_name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${diffColour(q.difficulty_level)}`}>
                    {q.difficulty_level}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setPreviewQ(q)} className="text-xs text-indigo-600 hover:underline">Preview</button>
                    <button onClick={() => setEditQ(q)} className="text-xs text-slate-600 hover:underline">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-400">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-600">← Prev</button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-600">Next →</button>
          </div>
        </div>
      )}

      {previewQ && (
        <Modal title={`Q${previewQ.question_number} · ${previewQ.chapter_name}`} onClose={() => setPreviewQ(null)}>
          <QuestionCard question={previewQ} />
        </Modal>
      )}

      {editQ && (
        <EditQuestionModal
          question={editQ}
          onClose={() => setEditQ(null)}
          onSaved={() => { setEditQ(null); fetchQ(); setMessage('Question updated.'); }}
        />
      )}
    </div>
  );
}

// ---- LaTeX Editor ----
function LatexEditor({ question, onClose, onSaved }: { question: QuestionData; onClose: () => void; onSaved: () => void }) {
  const [qText, setQText] = useState(question.question);
  const [solText, setSolText] = useState(question.solution_explanation ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [html, setHtml] = useState<{ q: string; sol: string }>({ q: '', sol: '' });

  useEffect(() => {
    import('katex').then(katex => {
      const renderText = (text: string) =>
        text
          .replace(/\$\$([\s\S]+?)\$\$/g, (_m, math) => {
            try { return katex.default.renderToString(math, { displayMode: true }); } catch { return `<span class="text-red-500">${math}</span>`; }
          })
          .replace(/\$([^$\n]+?)\$/g, (_m, math) => {
            try { return katex.default.renderToString(math, { displayMode: false }); } catch { return `<span class="text-red-500">${math}</span>`; }
          });
      setHtml({ q: renderText(qText), sol: renderText(solText) });
    });
  }, [qText, solText]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${question._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: qText, solution_explanation: solText }),
      });
      if (res.ok) { setMessage('Saved!'); onSaved(); }
      else { const j = await res.json(); setMessage(j.error ?? 'Save failed'); }
    } catch {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-xs text-slate-400">
          Q{question.question_number} · {question.chapter_name} · {question.difficulty_level}
        </span>
        <div className="ml-auto flex gap-2">
          {message && <span className={`text-xs ${message === 'Saved!' ? 'text-emerald-600' : 'text-red-600'}`}>{message}</span>}
          <button onClick={onClose} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Close</button>
          <button onClick={save} disabled={saving} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Question (LaTeX)</p>
          <textarea
            value={qText}
            onChange={e => setQText(e.target.value)}
            className="flex-1 text-sm font-mono border border-slate-200 rounded-lg p-3 text-black resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-[200px]"
          />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preview</p>
          <div className="flex-1 border border-slate-100 rounded-lg p-3 bg-slate-50 text-sm text-slate-800 overflow-auto min-h-[100px]"
            dangerouslySetInnerHTML={{ __html: html.q }} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Solution Explanation (LaTeX)</p>
          <textarea
            value={solText}
            onChange={e => setSolText(e.target.value)}
            className="flex-1 text-sm font-mono border border-slate-200 rounded-lg p-3 text-black resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-[200px]"
          />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preview</p>
          <div className="flex-1 border border-slate-100 rounded-lg p-3 bg-slate-50 text-sm text-slate-800 overflow-auto min-h-[100px]"
            dangerouslySetInnerHTML={{ __html: html.sol }} />
        </div>
      </div>
    </div>
  );
}

// ---- Edit Question Modal ----
function EditQuestionModal({ question, onClose, onSaved }: { question: QuestionData; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    chapter_name:    question.chapter_name,
    section_name:    question.section_name,
    difficulty_level: question.difficulty_level,
  });
  const [showLatex, setShowLatex] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${question._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (res.ok) onSaved();
    } finally {
      setSaving(false);
    }
  }

  if (showLatex) {
    return (
      <Modal title="LaTeX Editor" onClose={() => setShowLatex(false)}>
        <div style={{ minHeight: 500 }}>
          <LatexEditor question={question} onClose={() => setShowLatex(false)} onSaved={onSaved} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Edit Q${question.question_number}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Chapter</label>
          <input value={form.chapter_name} onChange={e => setForm(f => ({ ...f, chapter_name: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Section name</label>
          <input value={form.section_name} onChange={e => setForm(f => ({ ...f, section_name: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Difficulty</label>
          <select value={form.difficulty_level} onChange={e => setForm(f => ({ ...f, difficulty_level: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full">
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex justify-between pt-2">
          <button type="button" onClick={() => setShowLatex(true)}
            className="px-4 py-2 text-sm border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50">
            Edit LaTeX
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ---- Bulk Import ----
function BulkImport() {
  const [jsonText, setJsonText] = useState('');
  const [result, setResult] = useState<{ inserted: number; updated: number; skipped: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function loadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setJsonText(String(ev.target?.result ?? ''));
    reader.readAsText(file);
  }

  async function doImport() {
    setImporting(true);
    setResult(null);
    try {
      let questions: unknown[];
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) questions = parsed;
      else if (Array.isArray(parsed.questions)) questions = parsed.questions;
      else { setResult({ inserted: 0, updated: 0, skipped: 0, errors: ['JSON must be an array or { questions: [...] }'] }); return; }

      const res = await fetch('/api/questions/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questions }),
      });
      const json = await res.json();
      if (res.ok) setResult(json.data.results);
      else setResult({ inserted: 0, updated: 0, skipped: 0, errors: [json.error ?? 'Import failed'] });
    } catch (err) {
      setResult({ inserted: 0, updated: 0, skipped: 0, errors: [String(err)] });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-slate-600 mb-4">
        Paste a JSON array of questions or upload a JSON file. Required fields:
        <code className="text-xs bg-slate-100 px-1 rounded ml-1">
          edu_board, year, subject, chapter_name, section, section_name, question_number, question, answer_options, correct_answer_option, solution_explanation, difficulty_level
        </code>
      </p>

      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => fileRef.current?.click()}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
          Upload JSON file
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={loadFile} className="hidden" />
        {jsonText && <span className="text-xs text-slate-400">{jsonText.length.toLocaleString()} chars loaded</span>}
      </div>

      <textarea
        value={jsonText}
        onChange={e => setJsonText(e.target.value)}
        placeholder='[{"edu_board":"CIE","year":"8","subject":"Maths","chapter_name":"Integers","section":"1.1","section_name":"Factors, multiples and primes","question_number":1,"question":"Which is prime?","answer_options":{"A":"17","B":"21"},"correct_answer_option":"A","solution_explanation":"...","difficulty_level":"Focus"}]'
        className="w-full h-48 text-xs font-mono border border-slate-200 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-3"
      />

      <button
        onClick={doImport}
        disabled={importing || !jsonText.trim()}
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {importing ? 'Importing…' : 'Import Questions'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex gap-6 mb-3">
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-600">{result.inserted}</p>
              <p className="text-xs text-slate-500">Inserted</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-indigo-600">{result.updated}</p>
              <p className="text-xs text-slate-500">Updated</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-amber-600">{result.skipped}</p>
              <p className="text-xs text-slate-500">Skipped</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-red-600 mb-1">Errors ({result.errors.length})</p>
              <ul className="text-xs text-red-500 space-y-0.5 max-h-40 overflow-y-auto">
                {result.errors.slice(0, 50).map((e, i) => <li key={i}>{e}</li>)}
                {result.errors.length > 50 && <li>…and {result.errors.length - 50} more</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Main Page ----
export default function AdminQuestionsPage() {
  const [tab, setTab] = useState<AdminTab>('browser');

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Questions</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {(['browser', 'import'] as AdminTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'browser' ? 'Question Bank' : 'Bulk Import'}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'browser' && <QuestionBrowser />}
        {tab === 'import' && <BulkImport />}
      </div>
    </div>
  );
}
