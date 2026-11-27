import { describe, expect, it } from "vitest";
import { UNDO_MS as UNDO_WINDOW_MS, canUndo, logDrinkSchema, rateLimitRemaining } from "./logging";

describe("canUndo", () => {
  it("is open inside the window and closed after", () => {
    expect(canUndo(1000, 1000 + UNDO_WINDOW_MS - 1)).toBe(true);
    expect(canUndo(1000, 1000 + UNDO_WINDOW_MS)).toBe(false);
  });
});

describe("rateLimitRemaining", () => {
  it("allows the first log", () => expect(rateLimitRemaining(null, 5000)).toBe(0));
  it("blocks within 10 s", () => expect(rateLimitRemaining(1000, 4000)).toBe(7000));
  it("allows after 10 s", () => expect(rateLimitRemaining(1000, 11000)).toBe(0));
});

describe("logDrinkSchema", () => {
  it("needs exactly one of menu item or custom", () => {
    expect(logDrinkSchema.safeParse({ playerId: 1 }).success).toBe(false);
    expect(logDrinkSchema.safeParse({ playerId: 1, drinkTypeId: 2 }).success).toBe(true);
    expect(logDrinkSchema.safeParse({ playerId: 1, drinkTypeId: 2, custom: { name: "x", ml: 40, abv: 40 } }).success).toBe(false);
  });
  it("rejects a filled honeypot", () => {
    expect(logDrinkSchema.safeParse({ playerId: 1, drinkTypeId: 2, website: "spam" }).success).toBe(false);
  });
});
