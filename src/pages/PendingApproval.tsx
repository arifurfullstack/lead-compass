import { MayaLogo } from '@/components/MayaLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function PendingApproval() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(214,25%,96%)] to-[hsl(210,30%,98%)] px-4">
      <Card className="w-full max-w-md text-center shadow-xl border-0 glass">
        <CardContent className="pt-8 pb-6 space-y-4">
          <div className="flex justify-center"><MayaLogo variant="dark" /></div>
          <div className="mx-auto w-16 h-16 rounded-full bg-maya-gold/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-maya-gold" />
          </div>
          <h1 className="text-xl font-bold">Application Under Review</h1>
          <p className="text-muted-foreground text-sm">
            Your dealership account is being reviewed by our team. You'll receive an email when approved. This typically takes 24–48 hours.
          </p>
          <div className="pt-2 space-y-2">
            <a href="mailto:support@mayaxleadhub.com" className="text-sm text-maya-green hover:underline block">Contact Support</a>
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
