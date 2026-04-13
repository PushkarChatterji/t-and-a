'use client';

import { useEffect, useState, useCallback } from 'react';

interface School {
  _id: string;
  name: string;
  code: string;
  contactEmail: string;
  boardOfEducation: string;
  address: { city: string; state: string; country: string };
  isActive: boolean;
  createdAt: string;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [message, setMessage] = useState('');

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/schools?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setSchools(json.data.schools);
        setTotal(json.data.total);
        setPages(json.data.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  async function toggleActive(school: School) {
    await fetch(`/api/schools/${school._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !school.isActive }),
    });
    fetchSchools();
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schools</h1>
          <p className="text-slate-500 mt-1">{total} total schools</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New School
        </button>
      </div>

      {message && (
        <div className={`mb-4 text-sm px-4 py-2 rounded-lg ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      <div className="mb-4">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or code…"
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-60 text-black focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Board</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : schools.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No schools found</td></tr>
            ) : schools.map(s => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{s.code}</td>
                <td className="px-4 py-3 text-slate-600">{s.contactEmail}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{s.boardOfEducation}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditSchool(s)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                    <button onClick={() => toggleActive(s)} className={`text-xs hover:underline ${s.isActive ? 'text-red-500' : 'text-emerald-600'}`}>
                      {s.isActive ? 'Deactivate' : 'Activate'}
                    </button>
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

      {showCreate && (
        <SchoolFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); fetchSchools(); setMessage('School created.'); }}
          onError={(e) => setMessage(`Error: ${e}`)}
        />
      )}

      {editSchool && (
        <SchoolFormModal
          school={editSchool}
          onClose={() => setEditSchool(null)}
          onSaved={() => { setEditSchool(null); fetchSchools(); setMessage('School updated.'); }}
          onError={(e) => setMessage(`Error: ${e}`)}
        />
      )}
    </div>
  );
}

function SchoolFormModal({
  school, onClose, onSaved, onError
}: {
  school?: School;
  onClose: () => void;
  onSaved: () => void;
  onError: (e: string) => void;
}) {
  const [form, setForm] = useState({
    name: school?.name ?? '',
    code: school?.code ?? '',
    contactEmail: school?.contactEmail ?? '',
    boardOfEducation: school?.boardOfEducation ?? 'CBSE',
    city: school?.address?.city ?? '',
    state: school?.address?.state ?? '',
    country: school?.address?.country ?? 'India',
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!school;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEdit ? `/api/schools/${school!._id}` : '/api/schools';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          contactEmail: form.contactEmail,
          boardOfEducation: form.boardOfEducation,
          address: { city: form.city, state: form.state, country: form.country },
        }),
      });
      const json = await res.json();
      if (res.ok) onSaved();
      else onError(json.error ?? 'Failed');
    } catch {
      onError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit School' : 'Create School'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input required placeholder="School name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Code (e.g. DPS-DEL)" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" disabled={isEdit} />
          <input required type="email" placeholder="Contact email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
        </div>
        <input placeholder="Board of Education" value={form.boardOfEducation} onChange={e => setForm(f => ({ ...f, boardOfEducation: e.target.value }))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
        <div className="grid grid-cols-3 gap-2">
          <input placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
          <input placeholder="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
          <input placeholder="Country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
