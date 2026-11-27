export type RarityTier = "common" | "uncommon" | "rare" | "ultra";

export function rarityTier(rarity: number): RarityTier {
  if (rarity > 0.5) return "common";
  if (rarity > 0.25) return "uncommon";
  if (rarity > 0.1) return "rare";
  return "ultra";
}

export const TIER_LABEL: Record<RarityTier, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  ultra: "Ultra rare",
};
