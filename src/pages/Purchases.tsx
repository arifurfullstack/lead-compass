import { Card, CardContent } from '@/components/ui/card';

export default function Purchases() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Purchase History</h1>
      <Card><CardContent className="py-12 text-center text-muted-foreground">Your purchased leads will appear here. Purchase flow coming in Phase 2.</CardContent></Card>
    </div>
  );
}
