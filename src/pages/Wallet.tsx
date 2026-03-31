import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Wallet() {
  const { dealer } = useAuth();
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>
      <Card>
        <CardHeader><CardTitle className="text-sm text-muted-foreground">Wallet Balance</CardTitle></CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-maya-green">${dealer?.wallet_balance?.toFixed(2) ?? '0.00'}</p>
          <div className="flex gap-2 mt-4">
            {[100, 250, 500, 1000].map(a => (
              <Button key={a} variant="outline" onClick={() => toast.info('Stripe integration coming in Phase 2!')}>${a}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card><CardContent className="py-8 text-center text-muted-foreground">Transaction history coming in Phase 2.</CardContent></Card>
    </div>
  );
}
