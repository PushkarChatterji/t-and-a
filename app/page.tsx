import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <span className="text-xl font-bold text-indigo-600">EduPortal</span>
        <div className="flex gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-b from-indigo-50 to-slate-50">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
            Master Maths with&nbsp;
            <span className="text-indigo-600">adaptive practice</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Over 2,000 expertly curated questions across all chapters. Practice at your pace,
            track your progress, and get the help you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="/signup"
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: '🎯',
              title: 'Adaptive Learning',
              desc: 'Questions automatically increase in difficulty as you master each level.',
            },
            {
              icon: '📊',
              title: 'Track Progress',
              desc: 'Mark questions as Done, Need Clarification, or Need Help — synced across sessions.',
            },
            {
              icon: '🏫',
              title: 'School Ready',
              desc: 'Teachers create custom question lists; management monitors class-level metrics.',
            },
          ].map(f => (
            <div key={f.title} className="flex flex-col items-start gap-3">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-100">
        © {new Date().getFullYear()} EduPortal. All rights reserved.
      </footer>
    </main>
  );
}
