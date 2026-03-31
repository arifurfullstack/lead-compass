import { Card, CardContent } from '@/components/ui/card';

export default function AdminLeads() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Lead Management</h1>
      <Card><CardContent className="py-12 text-center text-muted-foreground">Lead creation, editing, and bulk import coming in Phase 2.</CardContent></Card>
    </div>
  );
}
