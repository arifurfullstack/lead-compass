import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MayaLogo } from '@/components/MayaLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isRecovery = window.location.hash.includes('type=recovery');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated! Redirecting...');
    setTimeout(() => window.location.href = '/marketplace', 1500);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(214,25%,96%)] to-[hsl(210,30%,98%)] px-4">
        <Card className="w-full max-w-md shadow-xl border-0 glass text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <MayaLogo variant="dark" />
            <p className="text-muted-foreground">Invalid or expired reset link. Please request a new one from the login page.</p>
            <Button variant="outline" onClick={() => window.location.href = '/login'}>Back to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(214,25%,96%)] to-[hsl(210,30%,98%)] px-4">
      <Card className="w-full max-w-md shadow-xl border-0 glass">
        <CardHeader className="text-center"><div className="flex justify-center mb-2"><MayaLogo variant="dark" /></div><CardTitle>Set New Password</CardTitle><CardDescription>Enter your new password below</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <Input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="New password (min 8 chars)" />
            <Button type="submit" disabled={loading} className="w-full bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground">{loading ? 'Updating...' : 'Update Password'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
