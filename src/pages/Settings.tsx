import { Card, CardContent } from '@/components/ui/card';

export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card><CardContent className="py-12 text-center text-muted-foreground">Profile, notifications, webhook, and security settings coming in Phase 2.</CardContent></Card>
    </div>
  );
}
