import { useState, useEffect } from 'react';
import { Lead } from '@/pages/Marketplace';
import { isLeadUnlocked, getUnlockTime, getGradeColor } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, MapPin, Clock, Brain, ShieldCheck, FileText, Landmark, FileCheck, Award, ChevronRight } from 'lucide-react';

interface Props {
  lead: Lead;
  tier: string;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

function CountdownTimer({ unlockTime }: { unlockTime: Date }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = unlockTime.getTime() - now;
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return <span>{h}h {m.toString().padStart(2, '0')}m</span>;
}

const docIcons = [
  { key: 'has_drivers_license', icon: ShieldCheck, label: 'DL' },
  { key: 'has_paystubs', icon: FileText, label: 'Pay' },
  { key: 'has_bank_statements', icon: Landmark, label: 'Bank' },
  { key: 'has_credit_report', icon: FileCheck, label: 'Credit' },
  { key: 'has_preapproval', icon: Award, label: 'Pre-Appr' },
] as const;

const gradeStyles: Record<string, { border: string; bg: string; text: string; avatarBg: string }> = {
  'A+': { border: 'border-l-grade-aplus', bg: 'bg-grade-aplus/8', text: 'text-grade-aplus', avatarBg: 'bg-grade-aplus' },
  'A':  { border: 'border-l-grade-a',     bg: 'bg-grade-a/8',     text: 'text-grade-a',     avatarBg: 'bg-grade-a' },
  'B':  { border: 'border-l-grade-b',     bg: 'bg-grade-b/8',     text: 'text-grade-b',     avatarBg: 'bg-grade-b' },
  'C':  { border: 'border-l-grade-c',     bg: 'bg-grade-c/8',     text: 'text-grade-c',     avatarBg: 'bg-grade-c' },
};

function getBuyerTypeLabel(type: string) {
  const map: Record<string, string> = {
    online: 'Online Buyer',
    'in-store': 'In-Store Buyer',
    in_store: 'In-Store Buyer',
    'first-time': 'First-Time Buyer',
    first_time: 'First-Time Buyer',
    repeat: 'Repeat Buyer',
    'Online Buyer': 'Online Buyer',
    'In-Store Buyer': 'In-Store Buyer',
    'First-Time Buyer': 'First-Time Buyer',
    'Repeat Buyer': 'Repeat Buyer',
  };
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function LeadCard({ lead, tier, isSelected, onToggleSelect }: Props) {
  const unlocked = isLeadUnlocked(lead.created_at, tier);
  const unlockTime = getUnlockTime(lead.created_at, tier);
  const style = gradeStyles[lead.quality_grade] || gradeStyles['C'];

  return (
    <div
      className={`relative rounded-xl shadow-sm border transition-all animate-fade-in overflow-hidden border-l-[5px] ${style.border} ${
        unlocked ? 'bg-card glass' : 'bg-muted/30 border-border'
      } ${isSelected ? 'ring-2 ring-maya-green shadow-md' : 'hover:shadow-md'}`}
    >
      {/* Select checkbox for unlocked leads */}
      {unlocked && (
        <div className="absolute top-3 right-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(lead.id)}
            className="data-[state=checked]:bg-maya-green data-[state=checked]:border-maya-green"
          />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Grade badge row */}
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-black leading-none ${style.text}`}>{lead.quality_grade}</span>
          {lead.quality_grade === 'A+' && (
            <Badge variant="outline" className="text-[10px] border-maya-gold text-maya-gold font-semibold px-2 py-0.5">
              A+ Verified
            </Badge>
          )}
        </div>

        {/* Identity row */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${style.avatarBg}`}>
            {lead.initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">{lead.initials}</p>
            <p className="text-xs text-muted-foreground leading-tight">{getBuyerTypeLabel(lead.buyer_type)}</p>
          </div>
        </div>

        {/* Credit + Location */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-semibold">{lead.credit_range_min}–{lead.credit_range_max}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-3.5 w-3.5 text-maya-blue shrink-0" />
            <span>{lead.city}, {lead.province}</span>
          </div>
        </div>

        {/* Documents + AI Score row */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {docIcons.map(d => {
              const has = lead[d.key as keyof Lead] as boolean;
              return (
                <div
                  key={d.key}
                  title={d.label}
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                    has ? `${style.bg} ${style.text}` : 'bg-muted/60 text-muted-foreground/30'
                  }`}
                >
                  <d.icon className="h-3.5 w-3.5" />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1 text-xs font-medium">
            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">AI Score</span>
            <span className="font-bold text-sm">{lead.ai_score}</span>
          </div>
        </div>

        {/* Action area */}
        {unlocked ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Badge className="bg-maya-green/10 text-maya-green border-maya-green/20 text-xs font-medium">Available Now</Badge>
              <span className="text-lg font-bold text-maya-green">${lead.price}</span>
            </div>
            <Button
              className="w-full bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground font-bold text-sm tracking-wide"
              onClick={() => onToggleSelect(lead.id)}
            >
              {isSelected ? 'DESELECT' : 'BUY LEAD'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="h-3.5 w-3.5" />
                <span>Unlocks in <CountdownTimer unlockTime={unlockTime} /></span>
              </div>
              <span className="text-lg font-bold">${lead.price}</span>
            </div>
            <Button variant="outline" className="w-full border-maya-green text-maya-green hover:bg-maya-green/5 font-bold text-sm tracking-wide">
              Upgrade to Unlock <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
