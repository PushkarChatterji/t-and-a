'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/utils/constants';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case ROLES.INDIVIDUAL_STUDENT:
    case ROLES.SCHOOL_STUDENT:
      return [
        { href: '/student', label: 'Practice', icon: '📚' },
        { href: '/student/progress', label: 'My Progress', icon: '📊' },
        { href: '/student/assignments', label: 'Assignments', icon: '📋' },
        { href: '/student/subscription', label: 'Subscription', icon: '⭐' },
      ];
    case ROLES.TEACHER:
      return [
        { href: '/teacher', label: 'Dashboard', icon: '🏠' },
        { href: '/teacher/question-lists', label: 'Question Lists', icon: '📝' },
        { href: '/teacher/assign', label: 'Assign', icon: '📤' },
        { href: '/teacher/monitor', label: 'Monitor Students', icon: '📊' },
        { href: '/teacher/colleagues', label: "Colleagues' Lists", icon: '👥' },
      ];
    case ROLES.MANAGEMENT:
      return [
        { href: '/management', label: 'Dashboard', icon: '🏠' },
        { href: '/management/teachers', label: 'Teacher Activity', icon: '👨‍🏫' },
        { href: '/management/classes', label: 'Class Metrics', icon: '📊' },
      ];
    case ROLES.ADMIN:
      return [
        { href: '/admin', label: 'Dashboard', icon: '🏠' },
        { href: '/admin/users', label: 'Users', icon: '👥' },
        { href: '/admin/schools', label: 'Schools', icon: '🏫' },
        { href: '/admin/questions', label: 'Questions', icon: '❓' },
        { href: '/admin/payments', label: 'Payments', icon: '💳' },
        { href: '/admin/activity', label: 'Activity Logs', icon: '📋' },
      ];
    default:
      return [];
  }
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;
  const navItems = getNavItems(user.role);

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Wordmark */}
      <div className="px-5 py-5 border-b border-slate-100">
        <span
          className="text-xl text-indigo-600 tracking-tight"
          style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
        >
          EduPortal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/student' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User chip */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{user.role.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full text-xs text-slate-400 hover:text-rose-500 text-left transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
