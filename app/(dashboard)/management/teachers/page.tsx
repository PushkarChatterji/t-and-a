'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TeacherMetrics {
  teacher: Teacher;
  loginCount30d: number;
  loginCount7d: number;
  listsCreated: number;
  listsAssigned: number;
  recentActivity: { action: string; createdAt: string }[];
}

export default function ManagementTeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [metrics, setMetrics] = useState<Record<string, TeacherMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.schoolId) return;
    fetch(`/api/schools/${user.schoolId}/teachers`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => setTeachers(json.data?.teachers ?? []))
      .catch(() => setError('Failed to load teachers'))
      .finally(() => setLoading(false));
  }, [user]);

  async function loadMetrics(teacherId: string) {
    if (metrics[teacherId]) { setSelected(teacherId); return; }
    setLoadingMetrics(true);
    setSelected(teacherId);
    try {
      const res = await fetch(`/api/metrics/teacher/${teacherId}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setMetrics(prev => ({ ...prev, [teacherId]: json.data }));
    } catch {
      setError('Failed to load teacher metrics');
    } finally {
      setLoadingMetrics(false);
    }
  }

  const selectedMetrics = selected ? metrics[selected] : null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Teacher Activity</h1>
      <p className="text-slate-500 text-sm mb-6">Click a teacher to view their activity metrics.</p>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Teacher list */}
          <div className="w-64 shrink-0 space-y-2">
            {teachers.length === 0 ? (
              <p className="text-sm text-slate-400">No teachers found</p>
            ) : (
              teachers.map(t => (
                <button
                  key={t._id}
                  onClick={() => loadMetrics(t._id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    selected === t._id
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-medium text-slate-900">{t.firstName} {t.lastName}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.email}</div>
                </button>
              ))
            )}
          </div>

          {/* Metrics panel */}
          <div className="flex-1">
            {!selected && (
              <div className="text-center py-16 text-slate-400">
                <p>Select a teacher to view their metrics</p>
              </div>
            )}
            {selected && loadingMetrics && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            )}
            {selectedMetrics && !loadingMetrics && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedMetrics.teacher.firstName} {selectedMetrics.teacher.lastName}
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Logins (7 days)', value: selectedMetrics.loginCount7d },
                    { label: 'Logins (30 days)', value: selectedMetrics.loginCount30d },
                    { label: 'Lists Created', value: selectedMetrics.listsCreated },
                    { label: 'Lists Assigned', value: selectedMetrics.listsAssigned },
                  ].map(c => (
                    <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                      <p className="text-xl font-bold text-slate-900">{c.value}</p>
                    </div>
                  ))}
                </div>

                {selectedMetrics.recentActivity.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Activity</h3>
                    <div className="space-y-2">
                      {selectedMetrics.recentActivity.map((a, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 capitalize">{a.action.replace(/_/g, ' ')}</span>
                          <span className="text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
