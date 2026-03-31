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
  const s = Math.floor((diff % 60000) / 1000);
  return <span>{h}h {m.toString().padStart(2, '0')}m {s.toString().padStart(2, '0')}s</span>;
}

const docIcons = [
  { key: 'has_drivers_license', icon: ShieldCheck, label: 'DL' },
  { key: 'has_paystubs', icon: FileText, label: 'Pay' },
  { key: 'has_bank_statements', icon: Landmark, label: 'Bank' },
  { key: 'has_credit_report', icon: FileCheck, label: 'Credit' },
  { key: 'has_preapproval', icon: Award, label: 'Pre-Appr' },
] as const;

export function LeadCard({ lead, tier, isSelected, onToggleSelect }: Props) {
  const unlocked = isLeadUnlocked(lead.created_at, tier);
  const unlockTime = getUnlockTime(lead.created_at, tier);
  const grade = getGradeColor(lead.quality_grade);

  return (
    <div
      className={`relative bg-card rounded-xl shadow-sm border transition-all animate-fade-in overflow-hidden ${
        unlocked ? '' : 'bg-muted/30'
      } ${isSelected ? 'ring-2 ring-maya-green' : ''} border-l-4 ${grade.border}`}
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
        {/* Grade badge */}
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-extrabold ${grade.text}`}>{lead.quality_grade}</span>
          {lead.quality_grade === 'A+' && (
            <Badge variant="outline" className="text-xs border-maya-gold text-maya-gold font-semibold">
              A+ Verified
            </Badge>
          )}
        </div>

        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${grade.bg}`}>
            {lead.initials}
          </div>
          <div>
            <p className="font-bold text-base">{lead.initials}</p>
            <p className="text-xs text-muted-foreground">{lead.buyer_type === 'online' ? 'Online Buyer' : 'In-Store Buyer'}</p>
          </div>
        </div>

        {/* Data */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold">{lead.credit_range_min}–{lead.credit_range_max}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-3.5 w-3.5 text-maya-blue" />
            <span>{lead.city}, {lead.province}</span>
          </div>
        </div>

        {/* Documents + AI Score */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {docIcons.map(d => {
              const has = lead[d.key as keyof Lead] as boolean;
              return (
                <div
                  key={d.key}
                  title={d.label}
                  className={`w-6 h-6 rounded flex items-center justify-center ${
                    has ? 'bg-maya-green/15 text-maya-green' : 'bg-muted text-muted-foreground/40'
                  }`}
                >
                  <d.icon className="h-3 w-3" />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Brain className="h-3.5 w-3.5 text-maya-blue" />
            <span className="font-bold">{lead.ai_score}</span>
            <span className="text-muted-foreground">AI</span>
          </div>
        </div>

        {/* Action area */}
        {unlocked ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Badge className="bg-maya-green/10 text-maya-green border-maya-green/20 text-xs">Available Now</Badge>
              <span className="text-lg font-bold text-maya-green">${lead.price}</span>
            </div>
            <Button
              className="w-full bg-maya-green hover:bg-maya-green/90 text-maya-green-foreground font-semibold"
              onClick={() => onToggleSelect(lead.id)}
            >
              {isSelected ? 'DESELECT' : 'BUY LEAD'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Clock className="h-3.5 w-3.5" />
                <span>Unlocks in <CountdownTimer unlockTime={unlockTime} /></span>
              </div>
              <span className="text-lg font-bold">${lead.price}</span>
            </div>
            <Button variant="outline" className="w-full border-maya-green text-maya-green hover:bg-maya-green/5 font-semibold">
              Upgrade to Unlock <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
