'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const COUNTRIES = ['India', 'UAE', 'USA', 'UK', 'Singapore', 'Other'];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    gender: '' as 'm' | 'f' | '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'India',
    boardOfEducation: '',
    class: '',
  });
  const [boards, setBoards] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [boardWarning, setBoardWarning] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load available boards on mount
  useEffect(() => {
    fetch('/api/questions/boards')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const list: string[] = json?.data ?? [];
        setBoards(list);
        if (list.length > 0) setForm(f => ({ ...f, boardOfEducation: list[0] }));
      })
      .catch(() => {});
  }, []);

  // Load years whenever board changes
  useEffect(() => {
    if (!form.boardOfEducation) return;
    fetch(`/api/questions/years?board=${encodeURIComponent(form.boardOfEducation)}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const list: string[] = json?.data ?? [];
        setYears(list);
        setForm(f => ({ ...f, class: list[list.length - 1] ?? '' }));
      })
      .catch(() => {});
  }, [form.boardOfEducation]);

  function set(field: string, value: string) {
    if (field === 'boardOfEducation') {
      setBoardWarning(value !== 'CBSE');
      setForm(f => ({ ...f, boardOfEducation: value, class: '' }));
    } else {
      setForm(f => ({ ...f, [field]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!form.gender) {
      setError('Please select your gender');
      return;
    }
    if (!form.class) {
      setError('Please select your year / class');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          gender: form.gender,
          email: form.email,
          password: form.password,
          country: form.country,
          boardOfEducation: form.boardOfEducation,
          class: form.class,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Signup failed');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
        <div className="text-4xl">📧</div>
        <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
        <p className="text-sm text-slate-500">
          We sent a verification link to <strong>{form.email}</strong>. Click it to activate your account.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="text-sm text-indigo-600 hover:underline"
        >
          Go to login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="text-sm text-slate-500 mt-1">Start your free trial — no credit card needed</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
            <input
              value={form.firstName}
              onChange={e => set('firstName', e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
            <input
              value={form.lastName}
              onChange={e => set('lastName', e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
          <div className="flex gap-4">
            {(['m', 'f'] as const).map(g => (
              <label key={g} className="flex items-center gap-2 text-sm text-black cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={form.gender === g}
                  onChange={() => set('gender', g)}
                  className="accent-indigo-600"
                />
                {g === 'm' ? 'Male' : 'Female'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
            <select
              value={form.country}
              onChange={e => set('country', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Board of education</label>
            <select
              value={form.boardOfEducation}
              onChange={e => set('boardOfEducation', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {boards.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Year / Class</label>
          <select
            value={form.class}
            onChange={e => set('class', e.target.value)}
            disabled={years.length === 0}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-50"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {boardWarning && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
            ⚠️ Switching your board of education later will require a new subscription. Your current subscription will not carry forward.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 hover:underline">Log in</Link>
      </p>
    </div>
  );
}
