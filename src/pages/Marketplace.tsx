import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { isLeadUnlocked, getUnlockTime, getGradeColor } from '@/lib/constants';
import { LeadCard } from '@/components/marketplace/LeadCard';
import { FilterSidebar } from '@/components/marketplace/FilterSidebar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart, Filter, X, Loader2, ChevronRight, ArrowUpDown, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
  const { dealer, refreshDealer } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mobileFilters, setMobileFilters] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [search, setSearch] = useState('');

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

  const gradeOrder: Record<string, number> = { 'A+': 0, 'A': 1, 'B': 2, 'C': 3 };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result = leads.filter(l => {
      if (q && !l.city.toLowerCase().includes(q) && !l.reference_code.toLowerCase().includes(q) && !l.province.toLowerCase().includes(q)) return false;
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

    result.sort((a, b) => {
      switch (sortBy) {
        case 'grade-asc': return (gradeOrder[a.quality_grade] ?? 9) - (gradeOrder[b.quality_grade] ?? 9);
        case 'grade-desc': return (gradeOrder[b.quality_grade] ?? 9) - (gradeOrder[a.quality_grade] ?? 9);
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'ai-asc': return a.ai_score - b.ai_score;
        case 'ai-desc': return b.ai_score - a.ai_score;
        case 'date-asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [leads, filters, sortBy]);

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
        <div className={`${mobileFilters ? 'block' : 'hidden'} lg:block w-full lg:w-72 shrink-0 border-r border-border/50 filter-glass overflow-y-auto`}>
          <FilterSidebar filters={filters} setFilters={setFilters} onClear={() => setFilters(defaultFilters)} />
        </div>

        {/* Main grid */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-4 lg:p-6 flex-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">
                Leads <span className="text-muted-foreground font-normal text-sm ml-1">({filtered.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="grade-asc">Grade: A+ → C</SelectItem>
                    <SelectItem value="grade-desc">Grade: C → A+</SelectItem>
                    <SelectItem value="price-asc">Price: Low → High</SelectItem>
                    <SelectItem value="price-desc">Price: High → Low</SelectItem>
                    <SelectItem value="ai-desc">AI Score: High → Low</SelectItem>
                    <SelectItem value="ai-asc">AI Score: Low → High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 bg-muted animate-pulse rounded-xl" />
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
          <div className="sticky bottom-0 border-t border-border/50 nav-glass px-4 lg:px-6 py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setFilters(defaultFilters)} className="text-muted-foreground font-medium">
              Clear Filters <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                Total: <span className="text-maya-green font-bold text-base">${totalPrice.toFixed(2)}</span>
              </span>
              <Button
                disabled={selected.size === 0 || totalPrice === 0 || purchasing}
                className="bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground font-bold tracking-wide"
                onClick={() => setConfirmOpen(true)}
              >
                {purchasing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-1" />}
                BUY LEAD{selected.size > 1 ? 'S' : ''} ({selected.size})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} for a total of <strong>${totalPrice.toFixed(2)}</strong>. This amount will be deducted from your wallet balance (${dealer?.wallet_balance?.toFixed(2) ?? '0.00'}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-40 overflow-y-auto text-sm">
            {selectedLeads.map(l => (
              <div key={l.id} className="flex justify-between py-1 border-b last:border-0">
                <span>{l.reference_code} — {l.initials} ({l.quality_grade})</span>
                <span className="font-semibold">${l.price}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button className="bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground" onClick={handlePurchase}>
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
