'use client';

import { useEffect, useState, useCallback } from 'react';

interface Sub {
  _id: string;
  userId: string;
  tier: string;
  status: string;
  startDate: string;
  endDate: string | null;
  amount: number;
  currency: string;
  createdAt: string;
  user: { _id: string; email: string; firstName: string; lastName: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-red-100 text-red-600',
};

export default function AdminPaymentsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (tierFilter) params.set('tier', tierFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/subscriptions/list?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setSubs(json.data.subscriptions);
        setTotal(json.data.total);
        setPages(json.data.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, tierFilter, statusFilter]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Payments & Subscriptions</h1>
        <p className="text-slate-500 mt-1">{total} subscription records · Payment is stubbed (demo)</p>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={tierFilter} onChange={e => { setTierFilter(e.target.value); setPage(1); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-black">
          <option value="">All tiers</option>
          <option value="free_trial">Free Trial</option>
          <option value="level_1">Level 1</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-black">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Start</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No records found</td></tr>
            ) : subs.map(s => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  {s.user ? (
                    <div>
                      <p className="text-xs font-medium text-slate-800">{s.user.firstName} {s.user.lastName}</p>
                      <p className="text-xs text-slate-400">{s.user.email}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300 font-mono">{String(s.userId).slice(-8)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.tier === 'level_1' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.tier === 'level_1' ? 'Level 1' : 'Free Trial'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {s.amount > 0 ? `${s.currency} ${s.amount}` : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(s.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {s.endDate ? new Date(s.endDate).toLocaleDateString() : <span className="text-slate-300">—</span>}
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
