'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface SchoolStats {
  teachers: number;
  students: number;
  classes: number;
}

export default function ManagementDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SchoolStats | null>(null);

  useEffect(() => {
    if (!user?.schoolId) return;
    Promise.all([
      fetch(`/api/schools/${user.schoolId}/teachers`, { credentials: 'include' }),
      fetch(`/api/schools/${user.schoolId}/classes`, { credentials: 'include' }),
    ])
      .then(async ([teachersRes, classesRes]) => {
        const teachers = await teachersRes.json();
        const classes = await classesRes.json();
        const teacherCount = teachers.data?.total ?? 0;
        const classList = classes.data?.classes ?? [];
        // Estimate students: sum from class endpoint (approximate)
        setStats({
          teachers: teacherCount,
          students: 0, // will refine via class metrics
          classes: classList.length,
        });
      })
      .catch(() => {});
  }, [user]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Management Dashboard</h1>
        <p className="text-slate-500 mt-1">Monitor your school's teachers and classes.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Teachers', value: stats?.teachers ?? '—' },
          { label: 'Classes', value: stats?.classes ?? '—' },
          { label: 'Students', value: stats?.students || '—' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { href: '/management/teachers', icon: '👨‍🏫', title: 'Teacher Activity', desc: 'View login counts, question lists created, and recent activity per teacher' },
          { href: '/management/classes', icon: '📊', title: 'Class Metrics', desc: 'View student progress, engagement histograms and per-student breakdown' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all group"
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
