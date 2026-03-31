import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Trash2, Zap, ZapOff, DollarSign, Target, MapPin, ShieldCheck } from 'lucide-react';
import { QUALITY_GRADES, PROVINCES } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AutoPayRule {
  id: string;
  dealer_id: string;
  is_active: boolean;
  rule_name: string;
  max_price: number;
  min_ai_score: number;
  quality_grades: string[];
  provinces: string[];
  buyer_types: string[];
  daily_budget: number;
  daily_spent: number;
  max_leads_per_day: number;
  leads_purchased_today: number;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

const BUYER_TYPES = ['Online Buyer', 'In-Store Buyer', 'First-Time Buyer', 'Repeat Buyer'];

const defaultRule = {
  rule_name: '',
  max_price: 150,
  min_ai_score: 70,
  quality_grades: ['A+', 'A'] as string[],
  provinces: [] as string[],
  buyer_types: [] as string[],
  daily_budget: 500,
  max_leads_per_day: 10,
};

export default function AutoPay() {
  const { dealer } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultRule);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['auto-pay-rules', dealer?.id],
    queryFn: async () => {
      if (!dealer) return [];
      const { data, error } = await supabase
        .from('auto_pay_rules')
        .select('*')
        .eq('dealer_id', dealer.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as AutoPayRule[];
    },
    enabled: !!dealer,
  });

  const createRule = useMutation({
    mutationFn: async () => {
      if (!dealer) throw new Error('Not authenticated');
      if (!form.rule_name.trim()) throw new Error('Rule name is required');
      const { error } = await supabase.from('auto_pay_rules').insert({
        dealer_id: dealer.id,
        rule_name: form.rule_name.trim(),
        max_price: form.max_price,
        min_ai_score: form.min_ai_score,
        quality_grades: form.quality_grades,
        provinces: form.provinces,
        buyer_types: form.buyer_types,
        daily_budget: form.daily_budget,
        max_leads_per_day: form.max_leads_per_day,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-pay-rules'] });
      toast.success('Auto Pay rule created');
      setForm(defaultRule);
      setDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('auto_pay_rules').update({ is_active } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auto-pay-rules'] }),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('auto_pay_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-pay-rules'] });
      toast.success('Rule deleted');
    },
  });

  const toggleGrade = (grade: string) =>
    setForm(f => ({ ...f, quality_grades: f.quality_grades.includes(grade) ? f.quality_grades.filter(g => g !== grade) : [...f.quality_grades, grade] }));

  const toggleProvince = (prov: string) =>
    setForm(f => ({ ...f, provinces: f.provinces.includes(prov) ? f.provinces.filter(p => p !== prov) : [...f.provinces, prov] }));

  const toggleBuyerType = (bt: string) =>
    setForm(f => ({ ...f, buyer_types: f.buyer_types.includes(bt) ? f.buyer_types.filter(b => b !== bt) : [...f.buyer_types, bt] }));

  const activeRules = rules.filter(r => r.is_active);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auto Pay</h1>
          <p className="text-sm text-muted-foreground mt-1">Set rules to automatically purchase leads that match your criteria</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground">
              <Plus className="h-4 w-4 mr-2" /> New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Auto Pay Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <div>
                <Label>Rule Name</Label>
                <Input placeholder="e.g. High-quality Ontario leads" value={form.rule_name} onChange={e => setForm(f => ({ ...f, rule_name: e.target.value }))} className="mt-1" />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Max Price per Lead</Label>
                  <Input type="number" min={10} max={1000} value={form.max_price} onChange={e => setForm(f => ({ ...f, max_price: Number(e.target.value) }))} className="mt-1" />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Min AI Score</Label>
                  <Input type="number" min={0} max={100} value={form.min_ai_score} onChange={e => setForm(f => ({ ...f, min_ai_score: Number(e.target.value) }))} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1.5 mb-2"><ShieldCheck className="h-3.5 w-3.5" /> Quality Grades</Label>
                <div className="flex gap-2">
                  {QUALITY_GRADES.map(g => (
                    <button key={g} type="button" onClick={() => toggleGrade(g)} className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${form.quality_grades.includes(g) ? 'bg-maya-navy text-white border-maya-navy' : 'bg-background text-muted-foreground border-border hover:border-maya-navy/50'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1.5 mb-2"><MapPin className="h-3.5 w-3.5" /> Provinces <span className="text-xs text-muted-foreground font-normal">(empty = all)</span></Label>
                <div className="flex flex-wrap gap-1.5">
                  {PROVINCES.map(p => (
                    <button key={p} type="button" onClick={() => toggleProvince(p)} className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${form.provinces.includes(p) ? 'bg-maya-blue text-white border-maya-blue' : 'bg-background text-muted-foreground border-border hover:border-maya-blue/50'}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Buyer Types <span className="text-xs text-muted-foreground font-normal">(empty = all)</span></Label>
                <div className="space-y-2">
                  {BUYER_TYPES.map(bt => (
                    <label key={bt} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={form.buyer_types.includes(bt)} onCheckedChange={() => toggleBuyerType(bt)} />
                      <span className="text-sm">{bt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Daily Budget ($)</Label>
                  <Input type="number" min={50} value={form.daily_budget} onChange={e => setForm(f => ({ ...f, daily_budget: Number(e.target.value) }))} className="mt-1" />
                </div>
                <div>
                  <Label>Max Leads / Day</Label>
                  <Input type="number" min={1} max={100} value={form.max_leads_per_day} onChange={e => setForm(f => ({ ...f, max_leads_per_day: Number(e.target.value) }))} className="mt-1" />
                </div>
              </div>
              <Button className="w-full bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground" onClick={() => createRule.mutate()} disabled={createRule.isPending}>
                {createRule.isPending ? 'Creating...' : 'Create Rule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-maya-green/10 rounded-lg"><Zap className="h-5 w-5 text-maya-green" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{activeRules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-maya-blue/10 rounded-lg"><DollarSign className="h-5 w-5 text-maya-blue" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Spend</p>
                <p className="text-2xl font-bold">${rules.reduce((sum, r) => sum + (r.is_active ? r.daily_spent : 0), 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-maya-navy/10 rounded-lg"><Target className="h-5 w-5 text-maya-navy" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Leads Today</p>
                <p className="text-2xl font-bold">{rules.reduce((sum, r) => sum + (r.is_active ? r.leads_purchased_today : 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading rules...</div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ZapOff className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-semibold text-lg">No Auto Pay rules yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create a rule to automatically purchase leads matching your criteria</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create Your First Rule</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <Card key={rule.id} className={`transition-opacity ${!rule.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch checked={rule.is_active} onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, is_active: checked })} />
                    <div>
                      <CardTitle className="text-base">{rule.rule_name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {rule.leads_purchased_today}/{rule.max_leads_per_day} leads · ${rule.daily_spent.toFixed(2)}/${rule.daily_budget.toFixed(2)} budget today
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteRule.mutate(rule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">Max ${rule.max_price}</Badge>
                  <Badge variant="outline">AI ≥ {rule.min_ai_score}</Badge>
                  {rule.quality_grades.map(g => <Badge key={g} variant="secondary">{g}</Badge>)}
                  {rule.provinces.length > 0
                    ? rule.provinces.map(p => <Badge key={p} variant="outline" className="bg-maya-blue/5">{p}</Badge>)
                    : <Badge variant="outline" className="bg-maya-blue/5">All Provinces</Badge>}
                  {rule.buyer_types.length > 0
                    ? rule.buyer_types.map(bt => <Badge key={bt} variant="outline">{bt}</Badge>)
                    : <Badge variant="outline">All Buyer Types</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
