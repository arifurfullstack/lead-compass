import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Dealer {
  id: string;
  dealership_name: string;
  contact_person: string;
  email: string;
  phone: string;
  approval_status: string;
  subscription_tier: string;
  wallet_balance: number;
  avatar_url: string | null;
  delivery_preference: string;
  notification_email: string | null;
  webhook_url: string | null;
  business_type: string | null;
  province: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  dealer: Dealer | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshDealer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  dealer: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshDealer: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDealer = async (userId: string) => {
    const { data } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setDealer(data as Dealer | null);
  };

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const refreshDealer = async () => {
    if (user) await fetchDealer(user.id);
  };

  useEffect(() => {
    let active = true;

    const hydrate = async (session: Session | null) => {
      if (!active) return;
      try {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await Promise.allSettled([
            fetchDealer(session.user.id),
            checkAdmin(session.user.id),
          ]);
        } else {
          setDealer(null);
          setIsAdmin(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void hydrate(session);
      }
    );

    void supabase.auth.getSession().then(({ data: { session } }) => hydrate(session));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setDealer(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, dealer, isAdmin, loading, signOut, refreshDealer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
