'use client';

import { useEffect, useState, useCallback } from 'react';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  subscriptionTier: string;
  isActive: boolean;
  emailVerified: boolean;
  schoolId: string | null;
  createdAt: string;
}

const ROLES = ['individual_student', 'school_student', 'teacher', 'management', 'admin'];
const ROLE_LABELS: Record<string, string> = {
  individual_student: 'Individual Student',
  school_student: 'School Student',
  teacher: 'Teacher',
  management: 'Management',
  admin: 'Admin',
};

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`bg-white rounded-xl shadow-xl w-full mx-4 flex flex-col max-h-[90vh] ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [clearProgressUser, setClearProgressUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/users?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setTotal(json.data.total);
        setPages(json.data.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function toggleActive(user: User) {
    await fetch(`/api/users/${user._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    fetchUsers();
  }

  async function confirmDelete(user: User) {
    const res = await fetch(`/api/users/${user._id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setDeleteUser(null);
    if (res.ok) {
      setMessage(`User "${user.firstName} ${user.lastName}" deleted.`);
      fetchUsers();
    } else {
      const json = await res.json().catch(() => ({}));
      setMessage(`Error: ${json.error ?? 'Failed to delete user'}`);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">{total} total users</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New User
        </button>
      </div>

      {message && (
        <div className={`mb-4 text-sm px-4 py-2 rounded-lg ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email…"
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-60 text-black focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-black"
        >
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.subscriptionTier === 'level_1' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.subscriptionTier === 'level_1' ? 'Level 1' : 'Free'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditUser(u)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className={`text-xs hover:underline ${u.isActive ? 'text-amber-600' : 'text-emerald-600'}`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setClearProgressUser(u)}
                      className="text-xs text-amber-600 hover:underline"
                    >
                      Clear Progress
                    </button>
                    <button
                      onClick={() => setDeleteUser(u)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchUsers(); setMessage('User created successfully.'); }}
          onError={(e) => setMessage(`Error: ${e}`)}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); fetchUsers(); setMessage('User updated.'); }}
          onError={(e) => setMessage(`Error: ${e}`)}
        />
      )}

      {deleteUser && (
        <DeleteConfirmModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={() => confirmDelete(deleteUser)}
        />
      )}

      {clearProgressUser && (
        <ClearProgressModal
          user={clearProgressUser}
          onClose={() => setClearProgressUser(null)}
          onCleared={(count) => {
            setClearProgressUser(null);
            setMessage(`Cleared ${count} progress record${count !== 1 ? 's' : ''} for ${clearProgressUser.firstName} ${clearProgressUser.lastName}.`);
          }}
          onError={(e) => setMessage(`Error: ${e}`)}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated, onError }: { onClose: () => void; onCreated: () => void; onError: (e: string) => void }) {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', gender: 'm', country: 'India', role: 'individual_student', boardOfEducation: '' });
  const [boards, setBoards] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/questions/boards', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data?.length) {
          setBoards(json.data);
          setForm(f => ({ ...f, boardOfEducation: f.boardOfEducation || json.data[0] }));
        }
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) onCreated();
      else onError(json.error ?? 'Failed to create user');
    } catch {
      onError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create User" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="First name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
          <input required placeholder="Last name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
        </div>
        <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
        <input required type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black">
            <option value="m">Male</option>
            <option value="f">Female</option>
          </select>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black">
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <select
          value={form.boardOfEducation}
          onChange={e => setForm(f => ({ ...f, boardOfEducation: e.target.value }))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full"
        >
          {boards.length === 0
            ? <option value="">Loading boards…</option>
            : boards.map(b => <option key={b} value={b}>{b}</option>)
          }
        </select>
        <input placeholder="Country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full" />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConfirmModal({ user, onClose, onConfirm }: { user: User; onClose: () => void; onConfirm: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handle() {
    setDeleting(true);
    await onConfirm();
  }

  return (
    <Modal title="Delete User" onClose={onClose}>
      <p className="text-sm text-slate-600 mb-1">
        Are you sure you want to permanently delete:
      </p>
      <p className="text-sm font-semibold text-slate-900 mb-1">{user.firstName} {user.lastName}</p>
      <p className="text-xs text-slate-400 mb-5">{user.email}</p>
      <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-5">
        This action is irreversible. All data associated with this user will be permanently removed.
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handle}
          disabled={deleting}
          className="px-4 py-2 text-sm font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete permanently'}
        </button>
      </div>
    </Modal>
  );
}

function ClearProgressModal({ user, onClose, onCleared, onError }: { user: User; onClose: () => void; onCleared: (count: number) => void; onError: (e: string) => void }) {
  const [clearing, setClearing] = useState(false);

  async function handle() {
    setClearing(true);
    try {
      const res = await fetch(`/api/users/${user._id}/progress`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok) onCleared(json.data?.deleted ?? 0);
      else onError(json.error ?? 'Failed to clear progress');
    } catch {
      onError('Network error');
    } finally {
      setClearing(false);
    }
  }

  return (
    <Modal title="Clear Progress" onClose={onClose}>
      <p className="text-sm text-slate-600 mb-1">
        Are you sure you want to clear all progress for:
      </p>
      <p className="text-sm font-semibold text-slate-900 mb-1">{user.firstName} {user.lastName}</p>
      <p className="text-xs text-slate-400 mb-5">{user.email}</p>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
        This will permanently delete all question attempt records for this user. It cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handle}
          disabled={clearing}
          className="px-4 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
        >
          {clearing ? 'Clearing…' : 'Clear progress'}
        </button>
      </div>
    </Modal>
  );
}

interface FullUser extends User {
  gender: string;
  country: string;
  boardOfEducation: string;
  class: string;
  subject: string;
  adaptiveLearningEnabled: boolean;
  classId: string | null;
}

interface ActivityLog {
  _id: string;
  action: string;
  ipAddress: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-emerald-100 text-emerald-700',
  logout: 'bg-slate-100 text-slate-600',
  signup: 'bg-indigo-100 text-indigo-700',
  password_reset: 'bg-amber-100 text-amber-700',
  subscription_upgraded: 'bg-purple-100 text-purple-700',
  auto_logoff: 'bg-orange-100 text-orange-700',
  question_list_created: 'bg-blue-100 text-blue-700',
  question_list_assigned: 'bg-cyan-100 text-cyan-700',
  question_imported: 'bg-teal-100 text-teal-700',
};

function EditUserModal({ user, onClose, onSaved, onError }: { user: User; onClose: () => void; onSaved: () => void; onError: (e: string) => void }) {
  const [tab, setTab] = useState<'details' | 'logs'>('details');
  const [fullUser, setFullUser] = useState<FullUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [boards, setBoards] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    gender: 'm',
    country: 'India',
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    boardOfEducation: '',
    class: '',
    subject: '',
    adaptiveLearningEnabled: true,
  });
  const [saving, setSaving] = useState(false);

  // Activity logs state
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPages, setLogsPages] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch full user detail
  useEffect(() => {
    fetch(`/api/users/${user._id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const u: FullUser = json?.data?.user;
        if (!u) return;
        setFullUser(u);
        setForm({
          firstName: u.firstName,
          lastName: u.lastName,
          gender: u.gender ?? 'm',
          country: u.country ?? 'India',
          role: u.role,
          subscriptionTier: u.subscriptionTier,
          isActive: u.isActive,
          emailVerified: u.emailVerified,
          boardOfEducation: u.boardOfEducation ?? '',
          class: u.class ?? '',
          subject: u.subject ?? '',
          adaptiveLearningEnabled: u.adaptiveLearningEnabled ?? true,
        });
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, [user._id]);

  // Fetch filter options
  useEffect(() => {
    fetch('/api/questions/filters', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) {
          setBoards(json.data.boards ?? []);
          setYears(json.data.years ?? []);
        }
      })
      .catch(() => {});
  }, []);

  // Subject is set by the user — show a static display list
  useEffect(() => {
    setSubjects(['Maths', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Commerce']);
  }, []);

  // Fetch activity logs
  useEffect(() => {
    if (tab !== 'logs') return;
    setLoadingLogs(true);
    const p = new URLSearchParams({ userId: user._id, page: String(logsPage), limit: '15' });
    fetch(`/api/activity-logs?${p}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) {
          setLogs(json.data.logs ?? []);
          setLogsTotal(json.data.total ?? 0);
          setLogsPages(json.data.pages ?? 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLogs(false));
  }, [tab, user._id, logsPage]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          subscriptionTier: form.subscriptionTier,
          isActive: form.isActive,
          boardOfEducation: form.boardOfEducation,
          class: form.class,
          adaptiveLearningEnabled: form.adaptiveLearningEnabled,
        }),
      });
      const json = await res.json();
      if (res.ok) onSaved();
      else onError(json.error ?? 'Failed to update user');
    } catch {
      onError('Network error');
    } finally {
      setSaving(false);
    }
  }

  const inp = 'text-sm border border-slate-200 rounded-lg px-3 py-2 text-black w-full focus:outline-none focus:ring-2 focus:ring-indigo-300';
  const label = 'block text-xs font-medium text-slate-500 mb-1';

  return (
    <Modal title={`Edit — ${user.firstName} ${user.lastName}`} onClose={onClose} wide>
      {/* Tab bar */}
      <div className="flex gap-1 mb-5 border-b border-slate-100 -mx-6 px-6">
        {(['details', 'logs'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t === 'details' ? 'Details' : `Activity Logs${logsTotal > 0 ? ` (${logsTotal})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        loadingUser ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {/* Identity */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Identity</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={label}>First name</label>
                  <input required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className={label}>Last name</label>
                  <input required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={label}>Email</label>
                  <input value={user.email} disabled className={`${inp} bg-slate-50 text-slate-400 cursor-not-allowed`} />
                </div>
                <div>
                  <label className={label}>Gender</label>
                  <select value={form.gender} disabled className={`${inp} bg-slate-50 text-slate-400 cursor-not-allowed`}>
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={label}>Country</label>
                <input value={form.country} disabled className={`${inp} bg-slate-50 text-slate-400 cursor-not-allowed`} />
              </div>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={label}>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inp}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Subscription tier</label>
                  <select value={form.subscriptionTier} onChange={e => setForm(f => ({ ...f, subscriptionTier: e.target.value }))} className={inp}>
                    <option value="free_trial">Free Trial</option>
                    <option value="level_1">Level 1</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-not-allowed" title="Email verification is set automatically">
                  <input type="checkbox" checked={form.emailVerified} disabled className="rounded opacity-50" />
                  Email verified
                </label>
              </div>
            </div>

            {/* Academic profile */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Academic profile</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className={label}>Board</label>
                  <select value={form.boardOfEducation} onChange={e => setForm(f => ({ ...f, boardOfEducation: e.target.value }))} className={inp}>
                    <option value="">— none —</option>
                    {boards.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Class / Year</label>
                  <select value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} className={inp}>
                    <option value="">— none —</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Subject</label>
                  <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className={`${inp} bg-slate-50 text-slate-400 cursor-not-allowed`} disabled>
                    <option value="">— none —</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    {form.subject && !subjects.includes(form.subject) && <option value={form.subject}>{form.subject}</option>}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Set by the user</p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.adaptiveLearningEnabled} onChange={e => setForm(f => ({ ...f, adaptiveLearningEnabled: e.target.checked }))} className="rounded" />
                Adaptive learning enabled
              </label>
            </div>

            {/* School linkage (read-only) */}
            {fullUser?.schoolId && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">School</p>
                <p className="text-sm text-slate-600 font-mono bg-slate-50 rounded-lg px-3 py-2">{fullUser.schoolId}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )
      )}

      {tab === 'logs' && (
        <div>
          {loadingLogs ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No activity logs found for this user.</p>
          ) : (
            <>
              <div className="space-y-1">
                {logs.map(log => (
                  <div key={log._id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 min-w-0">
                      {Object.keys(log.metadata ?? {}).length > 0 && (
                        <p className="text-xs text-slate-500 truncate">{JSON.stringify(log.metadata).slice(0, 100)}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">{log.ipAddress}</p>
                    </div>
                    <p className="text-xs text-slate-400 shrink-0 tabular-nums">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              {logsPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Page {logsPage} of {logsPages} · {logsTotal} total</p>
                  <div className="flex gap-2">
                    <button disabled={logsPage <= 1} onClick={() => setLogsPage(p => p - 1)}
                      className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-600">← Prev</button>
                    <button disabled={logsPage >= logsPages} onClick={() => setLogsPage(p => p + 1)}
                      className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-600">Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
