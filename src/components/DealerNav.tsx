import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MayaLogo } from './MayaLogo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Wallet, Plus, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function DealerNav() {
  const { dealer, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/upgrade-plan', label: 'Upgrade Plan' },
    { to: '/dashboard', label: 'Dashboard' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const initials = dealer?.contact_person?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DL';

  return (
    <nav className="sticky top-0 z-50 w-full bg-maya-navy">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <Link to="/marketplace" className="shrink-0">
          <MayaLogo variant="light" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isActive(l.to) ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-white text-sm">
            <Wallet className="h-4 w-4 opacity-70" />
            <span className="font-medium">${dealer?.wallet_balance?.toFixed(2) ?? '0.00'}</span>
          </div>
          <Button
            size="sm"
            className="hidden sm:inline-flex bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground text-xs"
            onClick={() => navigate('/wallet')}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Funds
          </Button>
          <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate('/settings')}>
            <AvatarFallback className="bg-maya-blue text-white text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-2 space-y-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded text-sm ${isActive(l.to) ? 'text-white bg-white/10' : 'text-white/70'}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 px-3 py-2 text-white text-sm">
            <Wallet className="h-4 w-4" /> ${dealer?.wallet_balance?.toFixed(2) ?? '0.00'}
          </div>
          <button onClick={signOut} className="block w-full text-left px-3 py-2 text-red-300 text-sm">Sign Out</button>
        </div>
      )}
    </nav>
  );
}
