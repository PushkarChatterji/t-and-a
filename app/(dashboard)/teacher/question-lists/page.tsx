'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

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
  createdAt: string;
}

interface CreateListForm {
  title: string;
  description: string;
  topic: string;
  isPublished: boolean;
}

const EMPTY_FORM: CreateListForm = { title: '', description: '', topic: '', isPublished: false };

export default function TeacherQuestionListsPage() {
  const { user } = useAuth();
  const [lists, setLists] = useState<QuestionList[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateListForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/question-lists', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setLists(json.data.lists ?? []);
      setTotal(json.data.total ?? 0);
    } catch {
      setError('Failed to load question lists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!user?.schoolId) { setError('No school associated with your account'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/question-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, schoolId: user.schoolId }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to create'); return; }
      setShowCreate(false);
      setForm(EMPTY_FORM);
      fetchLists();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this question list?')) return;
    await fetch(`/api/question-lists/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchLists();
  }

  async function togglePublish(list: QuestionList) {
    await fetch(`/api/question-lists/${list._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isPublished: !list.isPublished }),
    });
    fetchLists();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Question Lists</h1>
          <p className="text-slate-500 text-sm mt-1">{total} list{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(''); }}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New List
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-medium">No question lists yet</p>
          <p className="text-sm mt-1">Create your first list to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(list => (
            <div key={list._id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900">{list.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${list.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {list.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {list.topic && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{list.topic}</span>
                    )}
                  </div>
                  {list.description && (
                    <p className="text-xs text-slate-500 mt-1">{list.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {list.questionIds.length} question{list.questionIds.length !== 1 ? 's' : ''} ·
                    {list.board} · Class {list.class} ·
                    Created {new Date(list.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/teacher/question-lists/${list._id}`}
                    className="text-xs text-indigo-600 hover:underline px-2 py-1"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => togglePublish(list)}
                    className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 border border-slate-200 rounded"
                  >
                    {list.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDelete(list._id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Create Question List</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black"
                  placeholder="e.g. Chapter 3 Practice Set"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black resize-none"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Topic (optional)</label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black"
                  placeholder="e.g. Matrices"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">Publish immediately (visible to colleagues)</span>
              </label>
              {error && <p className="text-red-600 text-xs">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setError(''); }}
                  className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
