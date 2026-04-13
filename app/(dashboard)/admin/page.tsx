'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

interface Metrics {
  totalUsers: number;
  totalStudents: number;
  totalSchools: number;
  totalQuestions: number;
  approvedQuestions: number;
  recentLogins: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    fetch('/api/metrics/summary', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.success) setMetrics(json.data); })
      .catch(() => {});
  }, []);

  const statCards = metrics ? [
    { label: 'Total Users', value: metrics.totalUsers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Students', value: metrics.totalStudents, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Schools', value: metrics.totalSchools, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Questions (approved)', value: `${metrics.approvedQuestions} / ${metrics.totalQuestions}`, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Logins (7 days)', value: metrics.recentLogins, color: 'text-rose-600', bg: 'bg-rose-50' },
  ] : [];

  const navCards = [
    { label: 'Users', icon: '👥', href: '/admin/users', desc: 'Create, edit and manage user accounts' },
    { label: 'Schools', icon: '🏫', href: '/admin/schools', desc: 'Onboard and manage school organisations' },
    { label: 'Questions', icon: '❓', href: '/admin/questions', desc: 'Browse, import and edit the question bank' },
    { label: 'Activity Logs', icon: '📋', href: '/admin/activity', desc: 'Monitor user login and platform activity' },
    { label: 'Payments', icon: '💳', href: '/admin/payments', desc: 'View subscription and payment records' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, {user?.firstName}</p>
      </div>

      {/* Stats */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {statCards.map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {!metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {navCards.map(card => (
          <Link
            key={card.label}
            href={card.href}
            className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <span className="text-2xl block mb-2">{card.icon}</span>
            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">{card.label}</p>
            <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
