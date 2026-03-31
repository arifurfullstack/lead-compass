import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { isLeadUnlocked, getUnlockTime, getGradeColor } from '@/lib/constants';
import { LeadCard } from '@/components/marketplace/LeadCard';
import { FilterSidebar } from '@/components/marketplace/FilterSidebar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart, Filter, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface Lead {
  id: string;
  reference_code: string;
  initials: string;
  buyer_type: string;
  credit_range_min: number;
  credit_range_max: number;
  income: number | null;
  city: string;
  province: string;
  vehicle_preference: string | null;
  has_drivers_license: boolean;
  has_paystubs: boolean;
  has_bank_statements: boolean;
  has_credit_report: boolean;
  has_preapproval: boolean;
  ai_score: number;
  quality_grade: string;
  price: number;
  sold_status: string;
  created_at: string;
}

export interface Filters {
  creditMin: number;
  creditMax: number;
  documents: { drivers_license: boolean; paystubs: boolean; bank_statements: boolean; credit_report: boolean; preapproval: boolean };
  location: string;
  vehicle: string;
  leadAge: string;
}

const defaultFilters: Filters = {
  creditMin: 300, creditMax: 900,
  documents: { drivers_license: true, paystubs: true, bank_statements: true, credit_report: true, preapproval: true },
  location: '', vehicle: '', leadAge: 'all',
};

export default function Marketplace() {
  const { dealer } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mobileFilters, setMobileFilters] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const tier = dealer?.subscription_tier || 'basic';

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from('leads_public')
        .select('*')
        .eq('sold_status', 'available')
        .order('created_at', { ascending: false });
      if (!error && data) setLeads(data as Lead[]);
      setLoading(false);
    };
    fetchLeads();

    // Realtime subscription
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newLead = payload.new as Lead;
          if (newLead.sold_status === 'available') {
            setLeads(prev => [newLead, ...prev]);
          }
        }
        if (payload.eventType === 'UPDATE' && (payload.new as Lead).sold_status === 'sold') {
          setLeads(prev => prev.filter(l => l.id !== (payload.new as Lead).id));
          setSelected(prev => { const n = new Set(prev); n.delete((payload.new as Lead).id); return n; });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (l.credit_range_max < filters.creditMin || l.credit_range_min > filters.creditMax) return false;
      if (filters.documents.drivers_license && !l.has_drivers_license) return false;
      if (filters.documents.paystubs && !l.has_paystubs) return false;
      if (filters.documents.bank_statements && !l.has_bank_statements) return false;
      if (filters.documents.credit_report && !l.has_credit_report) return false;
      if (filters.documents.preapproval && !l.has_preapproval) return false;
      if (filters.location && !`${l.city} ${l.province}`.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.vehicle && l.vehicle_preference && !l.vehicle_preference.toLowerCase().includes(filters.vehicle.toLowerCase())) return false;
      if (filters.leadAge !== 'all') {
        const age = Date.now() - new Date(l.created_at).getTime();
        const hours = age / (1000 * 60 * 60);
        if (filters.leadAge === '1h' && hours > 1) return false;
        if (filters.leadAge === 'today' && hours > 24) return false;
        if (filters.leadAge === '3d' && hours > 72) return false;
      }
      return true;
    });
  }, [leads, filters]);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  const totalPrice = useMemo(() => {
    return filtered.filter(l => selected.has(l.id) && isLeadUnlocked(l.created_at, tier)).reduce((s, l) => s + l.price, 0);
  }, [selected, filtered, tier]);

  const selectedLeads = useMemo(() => {
    return filtered.filter(l => selected.has(l.id) && isLeadUnlocked(l.created_at, tier));
  }, [selected, filtered, tier]);

  const handlePurchase = async () => {
    setConfirmOpen(false);
    setPurchasing(true);
    const leadIds = selectedLeads.map(l => l.id);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-leads', {
        body: { lead_ids: leadIds },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Successfully purchased ${data.purchased} lead${data.purchased > 1 ? 's' : ''}!`);
        setSelected(new Set());
        // Refresh dealer balance
        if (refreshDealer) await refreshDealer();
      } else {
        const failedMsg = data?.results?.find((r: any) => !r.success)?.error || 'Purchase failed';
        toast.error(failedMsg);
      }
    } catch (err: any) {
      toast.error(err.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };



  return (
    <div className="flex flex-col flex-1">
      {/* Mobile filter toggle */}
      <div className="lg:hidden p-3 flex items-center gap-2 border-b bg-card">
        <Button variant="outline" size="sm" onClick={() => setMobileFilters(!mobileFilters)}>
          {mobileFilters ? <X className="h-4 w-4 mr-1" /> : <Filter className="h-4 w-4 mr-1" />}
          Filters
        </Button>
        <span className="text-sm text-muted-foreground">{filtered.length} leads</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filter sidebar */}
        <div className={`${mobileFilters ? 'block' : 'hidden'} lg:block w-full lg:w-72 shrink-0 border-r bg-card overflow-y-auto`}>
          <FilterSidebar filters={filters} setFilters={setFilters} onClear={() => setFilters(defaultFilters)} />
        </div>

        {/* Main grid */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-4 lg:p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Leads <span className="text-muted-foreground font-normal text-sm">({filtered.length})</span></h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium">No leads match your filters</p>
                <p className="text-sm mt-1">Try adjusting your filter criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    tier={tier}
                    isSelected={selected.has(lead.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom purchase bar */}
          <div className="sticky bottom-0 border-t bg-card/95 backdrop-blur px-4 lg:px-6 py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setFilters(defaultFilters)} className="text-muted-foreground">
              Clear Filters →
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                Total: <span className="text-maya-green font-bold">${totalPrice.toFixed(2)}</span>
              </span>
              <Button
                disabled={selected.size === 0 || totalPrice === 0}
                className="bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground"
                onClick={() => toast.info('Purchase flow coming in Phase 2!')}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                BUY LEAD{selected.size > 1 ? 'S' : ''} ({selected.size})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
