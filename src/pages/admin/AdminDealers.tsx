import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, Ban } from 'lucide-react';

interface Dealer {
  id: string;
  dealership_name: string;
  contact_person: string;
  email: string;
  phone: string;
  approval_status: string;
  subscription_tier: string;
  wallet_balance: number;
  province: string | null;
  business_type: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-maya-gold/10 text-maya-gold border-maya-gold/20',
  approved: 'bg-maya-green/10 text-maya-green border-maya-green/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  suspended: 'bg-muted text-muted-foreground border-muted',
};

export default function AdminDealers() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [reason, setReason] = useState('');

  const fetchDealers = async () => {
    const { data, error } = await supabase.from('dealers').select('*').order('created_at', { ascending: false });
    if (!error && data) setDealers(data as Dealer[]);
    setLoading(false);
  };

  useEffect(() => { fetchDealers(); }, []);

  const filteredDealers = dealers.filter(d =>
    `${d.dealership_name} ${d.contact_person} ${d.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async () => {
    if (!selectedDealer || !actionType) return;
    const updates: Record<string, string | null> = {};
    if (actionType === 'approve') { updates.approval_status = 'approved'; updates.rejection_reason = null; }
    if (actionType === 'reject') { updates.approval_status = 'rejected'; updates.rejection_reason = reason; }
    if (actionType === 'suspend') { updates.approval_status = 'suspended'; updates.rejection_reason = reason; }

    const { error } = await supabase.from('dealers').update(updates).eq('id', selectedDealer.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Dealer ${actionType}d successfully`);
    setSelectedDealer(null);
    setActionType(null);
    setReason('');
    fetchDealers();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dealer Management</h1>
        <Badge variant="outline" className="text-sm">{dealers.filter(d => d.approval_status === 'pending').length} pending</Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search dealers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dealership</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filteredDealers.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No dealers found</TableCell></TableRow>
            ) : filteredDealers.map(d => (
              <TableRow key={d.id}>
                <TableCell>
                  <div><p className="font-medium">{d.dealership_name}</p><p className="text-xs text-muted-foreground">{d.business_type} · {d.province}</p></div>
                </TableCell>
                <TableCell>
                  <div><p className="text-sm">{d.contact_person}</p><p className="text-xs text-muted-foreground">{d.email}</p></div>
                </TableCell>
                <TableCell><Badge variant="outline" className={statusColors[d.approval_status]}>{d.approval_status}</Badge></TableCell>
                <TableCell><span className="text-sm font-medium uppercase">{d.subscription_tier}</span></TableCell>
                <TableCell><span className="text-sm font-medium">${d.wallet_balance.toFixed(2)}</span></TableCell>
                <TableCell><span className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {d.approval_status === 'pending' && (
                      <>
                        <Button size="sm" variant="ghost" className="text-maya-green h-8" onClick={() => { setSelectedDealer(d); setActionType('approve'); }}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive h-8" onClick={() => { setSelectedDealer(d); setActionType('reject'); }}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {d.approval_status === 'approved' && (
                      <Button size="sm" variant="ghost" className="text-muted-foreground h-8" onClick={() => { setSelectedDealer(d); setActionType('suspend'); }}>
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                    {(d.approval_status === 'rejected' || d.approval_status === 'suspended') && (
                      <Button size="sm" variant="ghost" className="text-maya-green h-8" onClick={() => { setSelectedDealer(d); setActionType('approve'); }}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Action dialog */}
      <Dialog open={!!actionType && !!selectedDealer} onOpenChange={() => { setActionType(null); setSelectedDealer(null); setReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{actionType} Dealer</DialogTitle>
            <DialogDescription>
              {actionType === 'approve' ? `Approve ${selectedDealer?.dealership_name}? They will gain marketplace access.`
                : `${actionType === 'reject' ? 'Reject' : 'Suspend'} ${selectedDealer?.dealership_name}?`}
            </DialogDescription>
          </DialogHeader>
          {(actionType === 'reject' || actionType === 'suspend') && (
            <Textarea placeholder="Reason (required for rejection/suspension)" value={reason} onChange={e => setReason(e.target.value)} />
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => { setActionType(null); setSelectedDealer(null); }}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={actionType !== 'approve' && !reason}
              className={actionType === 'approve' ? 'bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}
            >
              {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Suspend'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
