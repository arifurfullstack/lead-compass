import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet as WalletIcon, ShoppingBag, Crown, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { dealer } = useAuth();
  const cards = [
    { title: 'Wallet Balance', value: `$${dealer?.wallet_balance?.toFixed(2) ?? '0.00'}`, icon: WalletIcon, link: '/wallet', linkText: 'Add Funds', color: 'text-maya-green' },
    { title: 'Current Plan', value: (dealer?.subscription_tier || 'none').toUpperCase(), icon: Crown, link: '/upgrade-plan', linkText: 'Upgrade', color: 'text-maya-gold' },
    { title: 'Leads Purchased', value: '—', icon: ShoppingBag, link: '/purchases', linkText: 'View All', color: 'text-maya-blue' },
    { title: 'Available Leads', value: '—', icon: FileText, link: '/marketplace', linkText: 'Browse', color: 'text-maya-steel' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
              <Link to={c.link} className="text-sm text-maya-green hover:underline mt-1 inline-block">{c.linkText} →</Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card><CardContent className="py-12 text-center text-muted-foreground">Recent purchases and delivery health coming in Phase 2.</CardContent></Card>
    </div>
  );
}
