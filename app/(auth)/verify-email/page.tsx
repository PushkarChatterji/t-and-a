'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found.');
      return;
    }
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setStatus('success');
          setMessage(json.data.message);
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(json.error ?? 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please try again.');
      });
  }, [searchParams, router]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
      {status === 'loading' && (
        <>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-slate-500">Verifying your email…</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-bold text-slate-900">Email verified!</h2>
          <p className="text-sm text-slate-500">{message}</p>
          <p className="text-xs text-slate-400">Redirecting to login…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-4xl">❌</div>
          <h2 className="text-xl font-bold text-slate-900">Verification failed</h2>
          <p className="text-sm text-slate-500">{message}</p>
          <Link href="/signup" className="text-sm text-indigo-600 hover:underline">Sign up again</Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-400 text-sm">Loading…</div>}>
      <VerifyContent />
    </Suspense>
  );
}
