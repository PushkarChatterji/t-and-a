'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ClassItem {
  _id: string;
  name: string;
  grade: string;
  section: string;
  academicYear: string;
}

interface StudentStat {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  loginsLast7Days: number;
  done: number;
  need_help: number;
  totalAttempted: number;
}

interface ClassMetrics {
  class: ClassItem;
  totalStudents: number;
  loggedInLast7Days: number;
  studentStats: StudentStat[];
  histogram: { range: string; count: number }[];
}

export default function ManagementClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [metrics, setMetrics] = useState<ClassMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.schoolId) return;
    fetch(`/api/schools/${user.schoolId}/classes`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => setClasses(json.data?.classes ?? []))
      .catch(() => setError('Failed to load classes'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selectedClass) { setMetrics(null); return; }
    setMetricsLoading(true);
    setError('');
    fetch(`/api/metrics/class/${selectedClass}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => setMetrics(json.data))
      .catch(() => setError('Failed to load class metrics'))
      .finally(() => setMetricsLoading(false));
  }, [selectedClass]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Class Metrics</h1>
      <p className="text-slate-500 text-sm mb-6">View student progress and engagement by class.</p>

      <div className="mb-6">
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-black w-72"
        >
          <option value="">Select a class…</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name} ({c.academicYear})</option>)}
        </select>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}

      {metricsLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}

      {metrics && !metricsLoading && (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 mb-1">Total Students</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.totalStudents}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 mb-1">Logged In (7 days)</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.loggedInLast7Days}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 mb-1">Engagement Rate</p>
              <p className="text-2xl font-bold text-slate-900">
                {metrics.totalStudents > 0
                  ? Math.round((metrics.loggedInLast7Days / metrics.totalStudents) * 100)
                  : 0}%
              </p>
            </div>
          </div>

          {/* Histogram */}
          {metrics.histogram.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Questions Done — Distribution</h3>
              <div className="flex items-end gap-3 h-32">
                {metrics.histogram.map(b => {
                  const maxCount = Math.max(...metrics.histogram.map(h => h.count), 1);
                  const heightPct = (b.count / maxCount) * 100;
                  return (
                    <div key={b.range} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-slate-600">{b.count}</span>
                      <div
                        className="w-full bg-indigo-400 rounded-t"
                        style={{ height: `${Math.max(4, heightPct)}%` }}
                      />
                      <span className="text-xs text-slate-400">{b.range}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Student</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-600">Logins (7d)</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-600">Done</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-600">Need Help</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.studentStats.map(s => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{s.firstName} {s.lastName}</div>
                      <div className="text-xs text-slate-400">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">{s.loginsLast7Days}</td>
                    <td className="px-4 py-3 text-center text-emerald-600 font-medium">{s.done}</td>
                    <td className="px-4 py-3 text-center text-red-600">{s.need_help}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{s.totalAttempted}</td>
                  </tr>
                ))}
                {metrics.studentStats.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No students in this class</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!selectedClass && !loading && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📊</p>
          <p>Select a class to view metrics</p>
        </div>
      )}
    </div>
  );
}
