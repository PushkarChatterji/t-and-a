'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { QuestionCard } from '@/components/questions/QuestionCard';

interface Question {
  _id: string;
  // Legacy fields
  topic?: string;
  question: string;
  solution?: string;
  difficulty_level: string;
  q_type?: string;
  q_number?: number;
  DPS_approved: boolean;
  isFreeQuestion: boolean;
  isActive: boolean;
  education_board?: string;
  class?: string;
  subject?: string;
  // New schema fields
  edu_board?: string;
  year?: string;
  chapter_name?: string;
  section?: string;
  section_name?: string;
  question_number?: number;
  answer_options?: Record<string, string>;
  correct_answer_option?: string;
  solution_explanation?: string;
}

type AdminTab = 'browser' | 'import' | 'editor';

const DIFFICULTIES = ['Focus', 'Easy', 'Medium', 'Hard'];
const Q_TYPES = ['MCQ', 'A-R', 'Case-Study', 'LA', 'SA', 'VSA', 'SUBJECTIVE', 'INTEGRATED'];

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
  qTypes: string[];
}

function QuestionBrowser() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);

  // Filter selections — each resets children when changed
  const [board, setBoard] = useState('');
  const [year, setYear] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [qType, setQType] = useState('');

  // Available options from the server
  const [opts, setOpts] = useState<FilterOptions>({ boards: [], years: [], topics: [], difficulties: [], qTypes: [] });

  const [previewQ, setPreviewQ] = useState<Question | null>(null);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [message, setMessage] = useState('');

  // Fetch filter options whenever board or year changes
  useEffect(() => {
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
            qTypes:       Array.isArray(d.qTypes)       ? d.qTypes       : [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setFiltersLoading(false));
  }, [board, year]);

  const fetchQ = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (board)      params.set('board', board);
      if (year)       params.set('year', year);
      if (topic)      params.set('topic', topic);
      if (difficulty) params.set('difficulty', difficulty);
      if (qType)      params.set('q_type', qType);
      const res = await fetch(`/api/questions?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setQuestions(json.data.questions);
        setTotal(json.data.total);
        setPages(json.data.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, board, year, topic, difficulty, qType]);

  useEffect(() => { fetchQ(); }, [fetchQ]);

  function selectBoard(val: string) { setBoard(val); setYear(''); setTopic(''); setDifficulty(''); setQType(''); setPage(1); }
  function selectYear(val: string)  { setYear(val);  setTopic(''); setDifficulty(''); setQType(''); setPage(1); }

  async function toggleApproved(q: Question) {
    const res = await fetch(`/api/questions/${q._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ DPS_approved: !q.DPS_approved }),
    });
    if (res.ok) { setMessage('Updated.'); fetchQ(); }
  }

  const sel = 'text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-black bg-white disabled:opacity-40';

  return (
    <div>
      {message && <div className="mb-3 text-sm px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700">{message}</div>}

      {/* Cascading filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">

        {/* Board */}
        <select value={board} onChange={e => selectBoard(e.target.value)} className={sel}>
          <option value="">All boards</option>
          {opts.boards.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* Year — scoped to board */}
        <select value={year} onChange={e => selectYear(e.target.value)} className={sel} disabled={filtersLoading}>
          <option value="">All years</option>
          {opts.years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Topic — scoped to board + year */}
        <select value={topic} onChange={e => { setTopic(e.target.value); setPage(1); }} className={sel} disabled={filtersLoading}>
          <option value="">All topics</option>
          {opts.topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Difficulty — scoped to board + year */}
        <select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(1); }} className={sel} disabled={filtersLoading}>
          <option value="">All difficulties</option>
          {opts.difficulties.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Question type — scoped to board + year */}
        <select value={qType} onChange={e => { setQType(e.target.value); setPage(1); }} className={sel} disabled={filtersLoading}>
          <option value="">All types</option>
          {opts.qTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <span className="text-xs text-slate-400 self-center ml-auto">{total} questions</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Q#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Topic</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Difficulty</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Approved</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Free</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No questions found</td></tr>
            ) : questions.map(q => (
              <tr key={q._id} className={`hover:bg-slate-50 ${q.isActive === false ? 'opacity-40' : ''}`}>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{q.question_number ?? q.q_number ?? '—'}</td>
                <td className="px-4 py-3 text-slate-800 text-xs max-w-[200px]">
                  <span className="block truncate">{q.chapter_name ?? q.topic ?? '—'}</span>
                  {q.section_name && <span className="block truncate text-slate-400">{q.section_name}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    q.difficulty_level === 'Easy'   ? 'bg-emerald-100 text-emerald-700' :
                    q.difficulty_level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    q.difficulty_level === 'Focus'  ? 'bg-violet-100 text-violet-700' :
                                                      'bg-red-100 text-red-700'
                  }`}>{q.difficulty_level}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{q.q_type ?? (q.answer_options ? 'MCQ' : '—')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleApproved(q)}
                    className={`text-xs px-2 py-0.5 rounded-full ${q.DPS_approved ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                    {q.DPS_approved ? 'Yes' : 'No'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {q.isFreeQuestion ? <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Free</span> : <span className="text-xs text-slate-300">—</span>}
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
        <Modal title={`Q${previewQ.question_number ?? '?'} · ${previewQ.chapter_name ?? ''}`} onClose={() => setPreviewQ(null)}>
          <QuestionCard question={previewQ as unknown as Parameters<typeof QuestionCard>[0]['question']} />
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
function LatexEditor({ question, onClose, onSaved }: { question: Question; onClose: () => void; onSaved: () => void }) {
  const [qText, setQText] = useState(question.question);
  const [solText, setSolText] = useState(question.solution_explanation ?? question.solution ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Dynamic import KaTeX for preview
  const [html, setHtml] = useState<{ q: string; sol: string }>({ q: '', sol: '' });

  useEffect(() => {
    import('katex').then(katex => {
      const renderText = (text: string) => {
        return text
          .replace(/\$\$([\s\S]+?)\$\$/g, (_m, math) => {
            try { return katex.default.renderToString(math, { displayMode: true }); } catch { return `<span class="text-red-500">${math}</span>`; }
          })
          .replace(/\$([^$\n]+?)\$/g, (_m, math) => {
            try { return katex.default.renderToString(math, { displayMode: false }); } catch { return `<span class="text-red-500">${math}</span>`; }
          });
      };
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
        body: JSON.stringify({ question: qText, solution: solText }),
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
        <span className="text-xs text-slate-400">Q{question.question_number ?? question.q_number ?? '?'} · {question.chapter_name ?? question.topic ?? ''} · {question.difficulty_level}</span>
        <div className="ml-auto flex gap-2">
          {message && <span className={`text-xs ${message === 'Saved!' ? 'text-emerald-600' : 'text-red-600'}`}>{message}</span>}
          <button onClick={onClose} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Close</button>
          <button onClick={save} disabled={saving} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Question editor */}
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

        {/* Solution editor */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Solution (LaTeX)</p>
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

// ---- Edit Question Modal (metadata) ----
function EditQuestionModal({ question, onClose, onSaved }: { question: Question; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    topic: question.topic,
    difficulty_level: question.difficulty_level,
    q_type: question.q_type,
    DPS_approved: question.DPS_approved,
    isFreeQuestion: question.isFreeQuestion,
    isActive: question.isActive,
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
    <Modal title={`Edit Q${question.question_number ?? question.q_number ?? '?'}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
          placeholder="Topic" className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.difficulty_level} onChange={e => setForm(f => ({ ...f, difficulty_level: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black">
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={form.q_type} onChange={e => setForm(f => ({ ...f, q_type: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black">
            {Q_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.DPS_approved} onChange={e => setForm(f => ({ ...f, DPS_approved: e.target.checked }))} />
            Approved
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.isFreeQuestion} onChange={e => setForm(f => ({ ...f, isFreeQuestion: e.target.checked }))} />
            Free Question
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            Active
          </label>
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
      // Support both array and { questions: [...] }
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
        Paste a JSON array of questions, or upload a JSON file. Each question must have:
        <code className="text-xs bg-slate-100 px-1 rounded ml-1">topic, question, solution, q_type, difficulty_level</code>.
        <span className="ml-1">Approved questions will automatically have <code className="text-xs bg-slate-100 px-1 rounded">isFreeQuestion</code> flagged (2E+2M+1H per topic by lowest q_number).</span>
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
        placeholder='[{"topic":"Relations and Functions","question":"Let $f(x)=...$","solution":"...","q_type":"MCQ","difficulty_level":"Easy","q_number":1}]'
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {(['browser', 'import', 'editor'] as AdminTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'browser' ? 'Question Bank' : t === 'import' ? 'Bulk Import' : 'LaTeX Editor'}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'browser' && <QuestionBrowser />}
        {tab === 'import' && <BulkImport />}
        {tab === 'editor' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
            Select a question from the Question Bank tab and click &ldquo;Edit LaTeX&rdquo; to open the editor.
          </div>
        )}
      </div>
    </div>
  );
}
