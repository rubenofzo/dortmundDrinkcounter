/** Points are standard drinks: 1 point = 10 g of pure alcohol. */
export const GRAMS_PER_POINT = 10;
/** Density of ethanol in g/ml. */
export const ETHANOL_DENSITY = 0.789;

export const CATEGORIES = ["Beer", "Wine", "Mixed", "Shots"] as const;
export type MenuCategory = (typeof CATEGORIES)[number];
export type Category = MenuCategory | "Custom";

/** Special drinks some achievements look for; a custom drink can count as one of these. */
export const DRINK_KINDS = ["weizen", "gluhwein", "jager"] as const;
export type DrinkKind = (typeof DRINK_KINDS)[number];

/** "Counts as" choices for a custom drink: a category, optionally a special kind within it. */
export const COUNTS_AS: { label: string; icon: string; category: Category; kind: DrinkKind | null }[] = [
  { label: "Beer", icon: "🍺", category: "Beer", kind: null },
  { label: "Weizen", icon: "🌾", category: "Beer", kind: "weizen" },
  { label: "Wine", icon: "🍷", category: "Wine", kind: null },
  { label: "Glühwein", icon: "🎄", category: "Wine", kind: "gluhwein" },
  { label: "Mixed", icon: "🍹", category: "Mixed", kind: null },
  { label: "Shot", icon: "🥃", category: "Shots", kind: null },
  { label: "Jäger", icon: "🌿", category: "Shots", kind: "jager" },
  { label: "Other", icon: "🧪", category: "Custom", kind: null },
];

export const CATEGORY_ICON: Record<Category, string> = {
  Beer: "🍺",
  Wine: "🍷",
  Mixed: "🍹",
  Shots: "🥃",
  Custom: "🧪",
};

/** Grams of pure alcohol: ml × ABV/100 × 0.789. */
export function gramsOf(ml: number, abv: number): number {
  return ml * (abv / 100) * ETHANOL_DENSITY;
}

/** Standard drinks (10 g each). */
export function pointsOf(ml: number, abv: number): number {
  return gramsOf(ml, abv) / GRAMS_PER_POINT;
}

/** Pure alcohol in ml. */
export function pureMlOf(ml: number, abv: number): number {
  return ml * (abv / 100);
}

/** Points with one decimal ("1.9"). */
export function formatPoints(points: number): string {
  return (Math.round(points * 10) / 10).toFixed(1);
}

/** "330 ml" / "0.5 L". */
export function formatVolume(ml: number): string {
  return ml >= 500 ? `${(ml / 1000).toLocaleString("en-GB", { maximumFractionDigits: 2 })} L` : `${ml} ml`;
}

export function formatAbv(abv: number): string {
  return `${abv.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`;
}

/** Points of one Pils Halbe (500 ml, 4.8%), for the "beer equivalent" stat. */
export const PILS_HALBE_POINTS = pointsOf(500, 4.8);

/** True for the menu items counted as beers (Beer category). */
export function isBeer(category: string): boolean {
  return category === "Beer";
}
