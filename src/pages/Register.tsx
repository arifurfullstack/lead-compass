import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MayaLogo } from '@/components/MayaLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BUSINESS_TYPES, PROVINCES } from '@/lib/constants';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

const steps = ['Business Info', 'Contact', 'Delivery', 'Review'];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    dealership_name: '', business_type: '', business_address: '', province: '', website: '',
    contact_person: '', email: '', phone: '', password: '', confirmPassword: '',
    notification_email: '', webhook_url: '', webhook_secret: '', delivery_preference: 'email',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const canNext = () => {
    if (step === 0) return form.dealership_name && form.business_type && form.business_address && form.province;
    if (step === 1) return form.contact_person && form.email && form.phone && form.password && form.password === form.confirmPassword && form.password.length >= 8;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (authError || !authData.user) {
      toast.error(authError?.message || 'Registration failed');
      setLoading(false);
      return;
    }
    const { error: dealerError } = await supabase.from('dealers').insert({
      user_id: authData.user.id,
      dealership_name: form.dealership_name,
      business_type: form.business_type,
      business_address: form.business_address,
      province: form.province,
      website: form.website || null,
      contact_person: form.contact_person,
      email: form.email,
      phone: form.phone,
      notification_email: form.notification_email || form.email,
      webhook_url: form.webhook_url || null,
      webhook_secret: form.webhook_secret || null,
      delivery_preference: form.delivery_preference,
    });
    setLoading(false);
    if (dealerError) {
      toast.error(dealerError.message);
      return;
    }
    toast.success('Application submitted! We\'ll review it within 24-48 hours.');
    navigate('/pending-approval');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(214,25%,96%)] to-[hsl(210,30%,98%)] px-4 py-8">
      <Card className="w-full max-w-lg shadow-xl border-0 glass">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2"><MayaLogo variant="dark" /></div>
          <CardTitle className="text-lg">Create Dealer Account</CardTitle>
          {/* Stepper */}
          <div className="flex items-center justify-center gap-1 mt-4">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < step ? 'bg-maya-green text-white' : i === step ? 'bg-maya-navy text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-maya-green' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{steps[step]}</p>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-3">
              <div><Label>Dealership Name *</Label><Input value={form.dealership_name} onChange={e => set('dealership_name', e.target.value)} /></div>
              <div><Label>Business Type *</Label>
                <Select value={form.business_type} onValueChange={v => set('business_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{BUSINESS_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Business Address *</Label><Input value={form.business_address} onChange={e => set('business_address', e.target.value)} /></div>
              <div><Label>Province *</Label>
                <Select value={form.province} onValueChange={v => set('province', v)}>
                  <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                  <SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Website (optional)</Label><Input value={form.website} onChange={e => set('website', e.target.value)} /></div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-3">
              <div><Label>Contact Person *</Label><Input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div><Label>Phone *</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><Label>Password *</Label><Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 chars, uppercase + number" /></div>
              <div><Label>Confirm Password *</Label><Input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                {form.confirmPassword && form.password !== form.confirmPassword && <p className="text-xs text-destructive mt-1">Passwords don't match</p>}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <div><Label>Notification Email</Label><Input value={form.notification_email} onChange={e => set('notification_email', e.target.value)} placeholder={form.email || 'Pre-filled from contact email'} /></div>
              <div><Label>CRM Webhook URL (optional)</Label><Input value={form.webhook_url} onChange={e => set('webhook_url', e.target.value)} placeholder="https://your-crm.com/webhook" /></div>
              <div><Label>Webhook Secret (optional)</Label><Input value={form.webhook_secret} onChange={e => set('webhook_secret', e.target.value)} /></div>
              <div><Label>Delivery Preference</Label>
                <Select value={form.delivery_preference} onValueChange={v => set('delivery_preference', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="webhook">Webhook Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">Review Your Application</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-muted p-3 rounded-lg">
                <span className="text-muted-foreground">Dealership:</span><span className="font-medium">{form.dealership_name}</span>
                <span className="text-muted-foreground">Type:</span><span className="font-medium">{form.business_type}</span>
                <span className="text-muted-foreground">Province:</span><span className="font-medium">{form.province}</span>
                <span className="text-muted-foreground">Contact:</span><span className="font-medium">{form.contact_person}</span>
                <span className="text-muted-foreground">Email:</span><span className="font-medium">{form.email}</span>
                <span className="text-muted-foreground">Phone:</span><span className="font-medium">{form.phone}</span>
                <span className="text-muted-foreground">Delivery:</span><span className="font-medium">{form.delivery_preference}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            {step > 0 ? <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button> : <Link to="/login" className="text-sm text-muted-foreground hover:underline self-center">Back to Login</Link>}
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground">Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground">
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
