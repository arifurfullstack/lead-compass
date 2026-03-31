import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RequireApproved({ children }: { children: ReactNode }) {
  const { dealer, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (isAdmin) return <>{children}</>;
  if (!dealer) return <Navigate to="/login" replace />;
  if (dealer.approval_status === 'pending') return <Navigate to="/pending-approval" replace />;
  if (dealer.approval_status === 'rejected') return <Navigate to="/rejected" replace />;
  if (dealer.approval_status === 'suspended') return <Navigate to="/suspended" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return <Navigate to="/marketplace" replace />;
  return <>{children}</>;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { session, dealer, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (session && isAdmin) return <Navigate to="/admin" replace />;
  if (session && dealer?.approval_status === 'approved') return <Navigate to="/marketplace" replace />;
  if (session && dealer?.approval_status === 'pending') return <Navigate to="/pending-approval" replace />;
  return <>{children}</>;
}
