// Plan tier definitions
export const PLANS = {
  community: { name: 'Community', price: 0, maxTools: 2, maxSeats: 1 },
  team:      { name: 'Team',      price: 49,  maxTools: -1, maxSeats: -1 },
  business:  { name: 'Business',  price: 199, maxTools: -1, maxSeats: 10 },
  mssp:      { name: 'MSSP',      price: 799, maxTools: -1, maxSeats: -1 },
} as const;

export type Tier = keyof typeof PLANS;

export const TIER_LEVELS: Record<Tier, number> = {
  community: 0, team: 1, business: 2, mssp: 3,
};

export function meetsRequirement(userTier: string, requiredTier: string): boolean {
  return (TIER_LEVELS[userTier as Tier] || 0) >= (TIER_LEVELS[requiredTier as Tier] || 0);
}
