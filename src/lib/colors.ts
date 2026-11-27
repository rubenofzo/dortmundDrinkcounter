/** Twelve colours that stay apart on the dark beer-hall background. A player's is fixed by `colorIndex`. */
export const PLAYER_PALETTE = [
  "#f5b301", // Dortmund yellow (the site accent is red)
  "#f7f1e3", // foam
  "#e4572e", // red
  "#4fb0e6", // sky
  "#7bd389", // green
  "#b48cf0", // lavender
  "#ff9f43", // orange
  "#f08cc0", // pink
  "#3fc1b0", // teal
  "#c9d65a", // lime
  "#d4a373", // malt
  "#9aa5b1", // slate
];

export function playerColor(colorIndex: number): string {
  return PLAYER_PALETTE[((colorIndex % PLAYER_PALETTE.length) + PLAYER_PALETTE.length) % PLAYER_PALETTE.length];
}
