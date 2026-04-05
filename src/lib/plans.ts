// Plan tier definitions
// Internal keys (community/team/business/mssp) are used in middleware, JWT, and tier checks — DO NOT rename
export const PLANS = {
  community:  { name: 'Community',     price: 0,     priceModel: 'free',        maxTools: 3,  maxSeats: 1,  maxAlerts: 250 },
  team:       { name: 'Essentials',    price: 149,   priceModel: 'per-seat',    maxTools: -1, maxSeats: -1, maxAlerts: -1  },
  business:   { name: 'Professional',  price: 1199,  priceModel: 'flat',        maxTools: -1, maxSeats: 15, maxAlerts: -1  },
  mssp:       { name: 'Enterprise',    price: 3499,  priceModel: 'flat',        maxTools: -1, maxSeats: -1, maxAlerts: -1  },
} as const;

export type Tier = keyof typeof PLANS;

export const TIER_LEVELS: Record<Tier, number> = {
  community: 0, team: 1, business: 2, mssp: 3,
};

export function meetsRequirement(userTier: string, requiredTier: string): boolean {
  return (TIER_LEVELS[userTier as Tier] || 0) >= (TIER_LEVELS[requiredTier as Tier] || 0);
}
