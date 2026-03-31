import { Filters } from '@/pages/Marketplace';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface Props {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClear: () => void;
}

export function FilterSidebar({ filters, setFilters, onClear }: Props) {
  const setDoc = (key: keyof Filters['documents'], val: boolean) =>
    setFilters(p => ({ ...p, documents: { ...p.documents, [key]: val } }));

  return (
    <div className="p-4 space-y-5">
      <h3 className="font-bold text-base">Filters</h3>

      {/* Credit Range */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Credit Range</Label>
        <div className="px-1">
          <Slider
            min={300}
            max={900}
            step={10}
            value={[filters.creditMin, filters.creditMax]}
            onValueChange={([min, max]) => setFilters(p => ({ ...p, creditMin: min, creditMax: max }))}
            className="[&_[role=slider]]:bg-maya-green [&_[role=slider]]:border-maya-green"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{filters.creditMin}</span>
          <span>{filters.creditMax}</span>
        </div>
      </div>

      {/* Documents */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Documents Uploaded</Label>
        {[
          { key: 'drivers_license' as const, label: 'Driver License' },
          { key: 'paystubs' as const, label: 'Paystubs' },
          { key: 'bank_statements' as const, label: 'Bank Statements' },
          { key: 'credit_report' as const, label: 'Credit Report' },
          { key: 'preapproval' as const, label: 'Pre-Approval Cert.' },
        ].map(d => (
          <div key={d.key} className="flex items-center gap-2">
            <Checkbox
              checked={filters.documents[d.key]}
              onCheckedChange={(v) => setDoc(d.key, !!v)}
              className="data-[state=checked]:bg-maya-green data-[state=checked]:border-maya-green"
            />
            <span className="text-sm">{d.label}</span>
          </div>
        ))}
      </div>

      {/* Location */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold">
          Location <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Input
            placeholder="Search city or province..."
            value={filters.location}
            onChange={e => setFilters(p => ({ ...p, location: e.target.value }))}
            className="text-sm"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Vehicle */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold">
          Vehicle <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Input
            placeholder="Search vehicle type..."
            value={filters.vehicle}
            onChange={e => setFilters(p => ({ ...p, vehicle: e.target.value }))}
            className="text-sm"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Lead Age */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold">
          Lead Age <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Select value={filters.leadAge} onValueChange={v => setFilters(p => ({ ...p, leadAge: v }))}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="1h">Under 1 Hour</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="3d">1-3 Days</SelectItem>
            </SelectContent>
          </Select>
        </CollapsibleContent>
      </Collapsible>

      {/* Clear */}
      <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClear}>
        Clear Filters →
      </Button>
    </div>
  );
}
