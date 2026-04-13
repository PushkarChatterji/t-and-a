'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Stats {
  listsCreated: number;
  listsAssigned: number;
  loginCount7d: number;
  loginCount30d: number;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/metrics/teacher/${user.id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.data) setStats(json.data); })
      .catch(() => {});
  }, [user]);

  const cards = [
    { label: 'Question Lists Created', value: stats?.listsCreated ?? '—', href: '/teacher/question-lists' },
    { label: 'Lists Assigned', value: stats?.listsAssigned ?? '—', href: '/teacher/question-lists' },
    { label: 'Logins (7 days)', value: stats?.loginCount7d ?? '—', href: null },
    { label: 'Logins (30 days)', value: stats?.loginCount30d ?? '—', href: null },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.firstName} 👋</h1>
        <p className="text-slate-500 mt-1">Manage question lists, assign work, and monitor your students.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: '/teacher/question-lists', icon: '📝', title: 'Question Lists', desc: 'Create and manage question lists from the bank' },
          { href: '/teacher/assign', icon: '📤', title: 'Assign', desc: 'Assign lists to your classes or individual students' },
          { href: '/teacher/monitor', icon: '📊', title: 'Monitor Students', desc: 'Track student progress across your classes' },
          { href: '/teacher/colleagues', icon: '👥', title: "Colleagues' Lists", desc: 'Browse published lists from your colleagues' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <div className="text-2xl mb-3">{item.icon}</div>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">{item.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
