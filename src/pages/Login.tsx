import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MayaLogo } from '@/components/MayaLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Redirect handled by App route guards
    navigate('/marketplace');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(214,25%,96%)] to-[hsl(210,30%,98%)] px-4">
      <Card className="w-full max-w-md shadow-xl border-0 glass">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <MayaLogo variant="dark" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your dealer account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="dealer@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
            <Link to="/forgot-password" className="hover:underline block">Forgot Password?</Link>
            <div className="border-t pt-3">
              <span>Don't have an account? </span>
              <Link to="/register" className="text-maya-green font-medium hover:underline">Create Dealer Account</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
