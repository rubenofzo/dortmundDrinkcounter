import "server-only";
import { cookies } from "next/headers";
import type { Hub, Player } from "./data";

/** Cookie holding the player id this phone belongs to ("Who are you?"). */
export const ME_COOKIE = "drinkhub_me";
export const ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 60;

/** The player this phone picked, or null if none yet (or they were removed). */
export async function getMe(hub: Hub): Promise<Player | null> {
  const id = Number((await cookies()).get(ME_COOKIE)?.value);
  return (Number.isInteger(id) && hub.playerById.get(id)) || null;
}

export async function setMe(playerId: number): Promise<void> {
  (await cookies()).set(ME_COOKIE, String(playerId), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ME_MAX_AGE_SECONDS,
  });
}
