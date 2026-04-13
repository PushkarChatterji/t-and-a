export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a
            href="/"
            className="text-2xl text-indigo-600"
            style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
          >
            EduPortal
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}
