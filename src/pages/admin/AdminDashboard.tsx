import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Total Dealers', value: '—' },
          { title: 'Pending Approvals', value: '—' },
          { title: 'Available Leads', value: '—' },
          { title: 'Leads Sold (Month)', value: '—' },
          { title: 'Revenue (Month)', value: '—' },
          { title: 'Failed Deliveries', value: '—' },
        ].map(c => (
          <Card key={c.title}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>
      <Card><CardContent className="py-8 text-center text-muted-foreground">Detailed admin analytics coming in Phase 2.</CardContent></Card>
    </div>
  );
}
