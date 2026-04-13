'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface QuestionList {
  _id: string;
  title: string;
  questionIds: string[];
}

interface ClassItem {
  _id: string;
  name: string;
  grade: string;
  section: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function TeacherAssignPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectedListId = searchParams.get('listId');

  const [lists, setLists] = useState<QuestionList[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedList, setSelectedList] = useState(preselectedListId ?? '');
  const [targetType, setTargetType] = useState<'class' | 'student'>('class');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!user?.schoolId) return;
      setLoading(true);
      try {
        const [listsRes, classesRes] = await Promise.all([
          fetch('/api/question-lists', { credentials: 'include' }),
          fetch(`/api/schools/${user.schoolId}/classes`, { credentials: 'include' }),
        ]);
        const listsJson = await listsRes.json();
        const classesJson = await classesRes.json();
        setLists(listsJson.data?.lists ?? []);
        setClasses(classesJson.data?.classes ?? []);
      } catch {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Load students when a class is selected
  useEffect(() => {
    if (!selectedClass || targetType !== 'student') {
      setStudents([]);
      return;
    }
    setStudentsLoading(true);
    fetch(`/api/classes/${selectedClass}/students`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { data: { students: [] } })
      .then(json => setStudents(json.data?.students ?? []))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, [selectedClass, targetType]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedList) { setError('Please select a question list'); return; }
    const targetId = targetType === 'class' ? selectedClass : selectedStudent;
    if (!targetId) { setError(`Please select a ${targetType}`); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/question-lists/${selectedList}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetType, targetId, dueDate: dueDate || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Assignment failed'); return; }
      setSuccess(`List successfully assigned to ${targetType === 'class'
        ? classes.find(c => c._id === selectedClass)?.name ?? 'class'
        : students.find(s => s._id === selectedStudent)?.firstName ?? 'student'
      }!`);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Assign Question List</h1>
      <p className="text-slate-500 text-sm mb-8">Assign a question list to a class or individual student.</p>

      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-4 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleAssign} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        {/* Select list */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Question List *</label>
          <select
            value={selectedList}
            onChange={e => setSelectedList(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black"
            required
          >
            <option value="">Select a list…</option>
            {lists.map(l => (
              <option key={l._id} value={l._id}>
                {l.title} ({l.questionIds.length} questions)
              </option>
            ))}
          </select>
        </div>

        {/* Target type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Assign to</label>
          <div className="flex gap-4">
            {(['class', 'student'] as const).map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value={t}
                  checked={targetType === t}
                  onChange={() => { setTargetType(t); setSelectedStudent(''); }}
                />
                <span className="text-sm capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Select class */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {targetType === 'student' ? 'Class (to filter students)' : 'Class *'}
          </label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black"
          >
            <option value="">Select class…</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Select student (if target is student) */}
        {targetType === 'student' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student *</label>
            {studentsLoading ? (
              <p className="text-sm text-slate-400">Loading students…</p>
            ) : (
              <select
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black"
              >
                <option value="">Select student…</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.email})</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Due date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Due Date (optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-black"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Assigning…' : 'Assign'}
        </button>
      </form>
    </div>
  );
}
