import { Filters } from '@/pages/Marketplace';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClear: () => void;
}

export function FilterSidebar({ filters, setFilters, onClear }: Props) {
  const setDoc = (key: keyof Filters['documents'], val: boolean) =>
    setFilters(p => ({ ...p, documents: { ...p.documents, [key]: val } }));

  return (
    <div className="p-5 space-y-6">
      <h3 className="font-bold text-lg">Filters</h3>

      {/* Credit Range */}
      <div className="space-y-3">
        <Label className="text-sm font-bold">Credit Range</Label>
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
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>{filters.creditMin}</span>
          <span>{filters.creditMax}</span>
        </div>
      </div>

      {/* Income Range */}
      <div className="space-y-3">
        <Label className="text-sm font-bold">Income Range</Label>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-maya-green inline-block" />
            <span className="font-semibold">500</span>
            <span className="text-muted-foreground text-xs">LD</span>
          </div>
          <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-maya-green via-maya-blue via-maya-gold to-destructive opacity-60" />
        </div>
      </div>

      {/* Documents */}
      <div className="space-y-2.5">
        <Label className="text-sm font-bold">Documents Uploaded</Label>
        {[
          { key: 'drivers_license' as const, label: 'Driver License' },
          { key: 'paystubs' as const, label: 'Paystubs' },
          { key: 'bank_statements' as const, label: 'Bank Statements' },
          { key: 'credit_report' as const, label: 'Credit Report' },
          { key: 'preapproval' as const, label: 'Pre-Approval Cert.' },
        ].map(d => (
          <div key={d.key} className="flex items-center gap-2.5">
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
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-bold py-1">
          Location <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-bold py-1">
          Vehicle <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-bold py-1">
          Lead Age <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
      <Button variant="ghost" className="w-full text-muted-foreground font-medium group" onClick={onClear}>
        Clear Filters <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </div>
  );
}
