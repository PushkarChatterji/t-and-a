'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Assignment {
  targetType: 'class' | 'student';
  targetId: string;
  assignedAt: string;
  dueDate?: string;
}

interface QuestionList {
  _id: string;
  title: string;
  description: string;
  questionIds: string[];
  topic?: string;
  board: string;
  class: string;
  subject: string;
  assignments: Assignment[];
}

export default function AssignmentsPage() {
  const [lists, setLists] = useState<QuestionList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/question-lists/assigned', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => setLists(json.data?.lists ?? []))
      .catch(() => setError('Failed to load assignments'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Assignments</h1>
      <p className="text-slate-500 text-sm mb-6">Question lists assigned to you by your teacher.</p>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      {lists.length === 0 && !error ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">No assignments yet</p>
          <p className="text-sm mt-1">Your teacher hasn't assigned any question lists to you yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map(list => {
            // Find the most relevant assignment (prefer direct student assignment)
            const directAssignment = list.assignments.find(a => a.targetType === 'student');
            const assignment = directAssignment ?? list.assignments[0];
            const isOverdue = assignment?.dueDate && new Date(assignment.dueDate) < new Date();

            return (
              <div key={list._id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900">{list.title}</h3>
                      {list.topic && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{list.topic}</span>
                      )}
                      {assignment?.dueDate && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isOverdue ? 'Overdue: ' : 'Due: '}
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {list.description && (
                      <p className="text-xs text-slate-500 mt-1">{list.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {list.questionIds.length} question{list.questionIds.length !== 1 ? 's' : ''} ·
                      {list.board} · Class {list.class}
                      {assignment?.assignedAt && ` · Assigned ${new Date(assignment.assignedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Link
                    href={`/student/assignments/${list._id}`}
                    className="shrink-0 text-xs bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 transition-colors"
                  >
                    Start →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
