import { Car } from 'lucide-react';

export function MayaLogo({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const textColor = variant === 'light' ? 'text-white' : 'text-foreground';
  return (
    <div className="flex items-center gap-2">
      <Car className={`h-6 w-6 ${variant === 'light' ? 'text-maya-blue' : 'text-maya-navy'}`} />
      <span className={`text-lg font-bold tracking-tight ${textColor}`}>
        MAYA<span className="font-extrabold">X</span>
        <span className="ml-1 font-light opacity-80">LEAD HUB</span>
      </span>
    </div>
  );
}
