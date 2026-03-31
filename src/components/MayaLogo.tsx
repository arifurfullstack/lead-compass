export function MayaLogo({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const textColor = variant === 'light' ? 'text-white' : 'text-foreground';
  const accentColor = variant === 'light' ? 'text-maya-blue' : 'text-maya-navy';
  return (
    <div className="flex items-center gap-2.5">
      {/* Car sketch icon */}
      <svg viewBox="0 0 48 24" className={`h-6 w-auto ${accentColor}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="20" r="3" />
        <circle cx="36" cy="20" r="3" />
        <path d="M3 17h6m21 0h6M9 17h6l3-9h6l6 9h-6" />
        <path d="M15 8c2-4 6-6 12-6" />
        <path d="M3 17c0-3 1-5 3-6l9-3" />
        <path d="M42 17c0-3-1-5-3-6l-3-1" />
      </svg>
      <span className={`text-lg font-bold tracking-tight ${textColor}`}>
        <span className="font-extrabold">AUTO</span>
        <span className="font-light opacity-80">LEAD HUB</span>
      </span>
    </div>
  );
}
