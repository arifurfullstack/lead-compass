import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MayaLogo } from './MayaLogo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wallet, Menu, X, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function DealerNav() {
  const { dealer, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/upgrade-plan', label: 'Upgrade Plan' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/auto-pay', label: 'Auto Pay' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const initials = dealer?.contact_person?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DL';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full nav-glass">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <Link to="/marketplace" className="shrink-0">
          <MayaLogo variant="dark" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive(l.to)
                  ? 'text-foreground bg-foreground/8 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-foreground text-sm">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">${dealer?.wallet_balance?.toFixed(2) ?? '0.00'}</span>
          </div>
          <Button
            size="sm"
            className="hidden sm:inline-flex bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground font-bold text-xs px-4 shadow-md"
            onClick={() => navigate('/wallet')}
          >
            Add Funds
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-border shadow-sm">
                <AvatarFallback className="bg-maya-blue text-white text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 px-4 py-2 space-y-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded text-sm ${isActive(l.to) ? 'text-foreground bg-foreground/8' : 'text-muted-foreground'}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 px-3 py-2 text-foreground text-sm">
            <Wallet className="h-4 w-4" /> ${dealer?.wallet_balance?.toFixed(2) ?? '0.00'}
          </div>
          <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 text-destructive text-sm">Sign Out</button>
        </div>
      )}
    </nav>
  );
}
