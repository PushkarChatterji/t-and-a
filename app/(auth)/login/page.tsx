'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const DUMMY_HINT = [
  { role: 'Admin', email: 'admin@test.com' },
  { role: 'Teacher', email: 'teacher@test.com' },
  { role: 'Management', email: 'management@test.com' },
  { role: 'School Student', email: 'school.student@test.com' },
  { role: 'Individual Student', email: 'student@test.com' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Login failed');
        return;
      }
      login(json.data.accessToken, json.data.user);
      const role = json.data.user.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'teacher') router.push('/teacher');
      else if (role === 'management') router.push('/management');
      else router.push('/student');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">Log in to your EduPortal account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-indigo-600 hover:underline">Forgot password?</Link>
        <Link href="/signup" className="text-slate-500 hover:text-indigo-600">No account? Sign up</Link>
      </div>

      {/* Test account hints */}
      <details className="text-xs text-slate-400 border-t border-slate-100 pt-4">
        <summary className="cursor-pointer hover:text-slate-600">Test accounts (password: Test1234!)</summary>
        <ul className="mt-2 space-y-1">
          {DUMMY_HINT.map(h => (
            <li key={h.role}>
              <button
                type="button"
                onClick={() => { setEmail(h.email); setPassword('Test1234!'); }}
                className="hover:text-indigo-600 transition-colors"
              >
                {h.role}: {h.email}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
