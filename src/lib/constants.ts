export const TIER_DELAYS: Record<string, number> = {
  vip: 0,
  elite: 6,
  pro: 12,
  basic: 24,
  none: Infinity,
};

export const TIER_PRICES: Record<string, number> = {
  basic: 99,
  pro: 299,
  elite: 899,
  vip: 2000,
};

export const QUALITY_GRADES = ['A+', 'A', 'B', 'C'] as const;

export const PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
];

export const BUSINESS_TYPES = [
  { value: 'independent', label: 'Independent' },
  { value: 'franchise', label: 'Franchise' },
  { value: 'subprime', label: 'Subprime' },
  { value: 'finance', label: 'Finance-Focused' },
];

export function getGradeColor(grade: string) {
  switch (grade) {
    case 'A+': return { bg: 'bg-grade-aplus', text: 'text-grade-aplus', border: 'border-l-grade-aplus' };
    case 'A': return { bg: 'bg-grade-a', text: 'text-grade-a', border: 'border-l-grade-a' };
    case 'B': return { bg: 'bg-grade-b', text: 'text-grade-b', border: 'border-l-grade-b' };
    case 'C': return { bg: 'bg-grade-c', text: 'text-grade-c', border: 'border-l-grade-c' };
    default: return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-l-muted' };
  }
}

export function getUnlockTime(leadCreatedAt: string, tier: string): Date {
  const delay = TIER_DELAYS[tier] ?? Infinity;
  if (delay === Infinity) return new Date(8640000000000000);
  const created = new Date(leadCreatedAt);
  return new Date(created.getTime() + delay * 60 * 60 * 1000);
}

export function isLeadUnlocked(leadCreatedAt: string, tier: string): boolean {
  return new Date() >= getUnlockTime(leadCreatedAt, tier);
}
