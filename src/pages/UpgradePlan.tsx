import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap } from 'lucide-react';
import { TIER_PRICES } from '@/lib/constants';
import { toast } from 'sonner';

const tiers = [
  { id: 'basic', name: 'Basic', price: 99, delay: '24 hours', features: ['Browse marketplace', 'Filter leads', 'Buy leads', 'Email delivery'] },
  { id: 'pro', name: 'Pro', price: 299, delay: '12 hours', badge: 'POPULAR', features: ['Everything in Basic', 'Faster access (12h)', 'Priority support'] },
  { id: 'elite', name: 'Elite', price: 899, delay: '6 hours', features: ['Everything in Pro', 'Near-real-time access (6h)', 'Webhook delivery'] },
  { id: 'vip', name: 'VIP', price: 2000, delay: 'Instant', badge: 'FASTEST', features: ['Everything in Elite', '⚡ Zero delay', 'First-mover advantage'] },
];

export default function UpgradePlan() {
  const { dealer } = useAuth();
  const current = dealer?.subscription_tier || 'none';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Choose Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map(t => {
          const isCurrent = current === t.id;
          return (
            <Card key={t.id} className={`relative ${isCurrent ? 'ring-2 ring-maya-green' : ''}`}>
              {t.badge && <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-maya-gold text-maya-gold-foreground text-xs">{t.badge}</Badge>}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t.name}</CardTitle>
                <p className="text-2xl font-bold">${t.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground">New leads after {t.delay}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5 text-sm">
                  {t.features.map(f => <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-maya-green shrink-0" />{f}</li>)}
                </ul>
                <Button
                  className={`w-full ${isCurrent ? '' : 'bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground'}`}
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent}
                  onClick={() => toast.info('Stripe integration coming in Phase 2!')}
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${t.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
