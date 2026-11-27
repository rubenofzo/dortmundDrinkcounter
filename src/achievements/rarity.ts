/**
 * Rarity tiers. Each achievement has a fixed tier for how hard it is to get (`tier` in
 * definitions.ts); the share of players who have it is shown next to it, but doesn't set the tier.
 */
export type RarityTier = "common" | "uncommon" | "rare" | "ultra";

export const TIER_LABEL: Record<RarityTier, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  ultra: "Ultra rare",
};

/** Sort order, hardest first is the highest. */
export const TIER_RANK: Record<RarityTier, number> = { common: 0, uncommon: 1, rare: 2, ultra: 3 };
