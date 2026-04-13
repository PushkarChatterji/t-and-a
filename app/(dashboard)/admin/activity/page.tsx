'use client';

import { useEffect, useState, useCallback } from 'react';
import { ACTIVITY_ACTIONS } from '@/lib/utils/constants';

interface LogEntry {
  _id: string;
  userId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: { _id: string; email: string; firstName: string; lastName: string } | null;
}

const ACTION_LABELS = Object.fromEntries(
  Object.values(ACTIVITY_ACTIONS).map(a => [a, a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())])
);

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-indigo-100 text-indigo-700',
  logout: 'bg-slate-100 text-slate-600',
  signup: 'bg-emerald-100 text-emerald-700',
  auto_logoff: 'bg-amber-100 text-amber-700',
  subscription_upgraded: 'bg-purple-100 text-purple-700',
  question_imported: 'bg-blue-100 text-blue-700',
};

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (actionFilter) params.set('action', actionFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const res = await fetch(`/api/activity-logs?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.logs);
        setTotal(json.data.total);
        setPages(json.data.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, fromDate, toDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
        <p className="text-slate-500 mt-1">{total} total entries</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-black"
        >
          <option value="">All actions</option>
          {Object.values(ACTIVITY_ACTIONS).map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">From</label>
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-black" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">To</label>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-black" />
        </div>
        {(actionFilter || fromDate || toDate) && (
          <button onClick={() => { setActionFilter(''); setFromDate(''); setToDate(''); setPage(1); }}
            className="text-xs text-slate-400 hover:text-slate-600 px-2">Clear filters</button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">IP</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No logs found</td></tr>
            ) : logs.map(log => (
              <tr key={log._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {log.user ? (
                    <div>
                      <p className="text-xs font-medium text-slate-800">{log.user.firstName} {log.user.lastName}</p>
                      <p className="text-xs text-slate-400">{log.user.email}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300 font-mono">{String(log.userId).slice(-8)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{log.ipAddress}</td>
                <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">
                  {Object.keys(log.metadata ?? {}).length > 0
                    ? JSON.stringify(log.metadata).slice(0, 80)
                    : '—'}
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
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-600">
              ← Prev
            </button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-600">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
