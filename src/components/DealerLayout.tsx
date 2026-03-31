import { ReactNode } from 'react';
import { DealerNav } from './DealerNav';

export function DealerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DealerNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
