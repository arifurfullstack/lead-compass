import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MayaLogo } from './MayaLogo';
import { LayoutDashboard, Users, FileText, CreditCard, Mail, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/dealers', label: 'Dealers', icon: Users },
  { to: '/admin/leads', label: 'Leads', icon: FileText },
  { to: '/admin/transactions', label: 'Transactions', icon: CreditCard },
  { to: '/admin/delivery-logs', label: 'Delivery Logs', icon: Mail },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-maya-navy text-white flex flex-col">
        <div className="p-4 border-b border-white/10">
          <MayaLogo variant="light" />
          <p className="text-xs text-white/50 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {links.map(l => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-white/10">
          <button onClick={signOut} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white/60 hover:text-white hover:bg-white/5 w-full">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-background overflow-auto">{children}</main>
    </div>
  );
}
