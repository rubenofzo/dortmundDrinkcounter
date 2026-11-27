import type { Metadata } from "next";
import { AdminDrinks } from "@/components/AdminDrinks";
import { AdminMenu } from "@/components/AdminMenu";
import { AdminPlayers } from "@/components/AdminPlayers";
import { LoginForm } from "@/components/LoginForm";
import { CardPanel, PageTitle, SectionTitle } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { getHub } from "@/lib/data";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto w-full max-w-md">
        <CardPanel className="flex flex-col gap-4">
          <SectionTitle>Admin only</SectionTitle>
          <p className="text-ink-muted">Sign in to fix drinks, manage players and edit the menu.</p>
          <LoginForm />
        </CardPanel>
      </main>
    );
  }

  const { players, drinkTypes, drinks } = await getHub();
  const counts = new Map<number, number>();
  for (const d of drinks) counts.set(d.playerId, (counts.get(d.playerId) ?? 0) + 1);

  const playerRows = players.map((p) => ({ id: p.id, name: p.name, color: p.color, drinkCount: counts.get(p.id) ?? 0 }));
  const menu = [...drinkTypes]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    .map((t) => ({ id: t.id, name: t.name, category: t.category, icon: t.icon, ml: t.ml, abv: t.abv, sortOrder: t.sortOrder, hidden: t.hidden }));
  // Newest first, with only what the editor rows need.
  const drinkRows = [...drinks].reverse().map((d) => ({ id: d.id, name: d.name, icon: d.icon, ml: d.ml, abv: d.abv, at: d.at, playerId: d.playerId }));

  return (
    <main className="flex flex-col gap-5 md:gap-8">
      <div className="flex items-center justify-between gap-4">
        <PageTitle className="uppercase">Admin</PageTitle>
        <form action={logout}>
          <button type="submit" className="min-h-12 px-4 font-semibold text-accent-light hover:text-foam">
            Sign out
          </button>
        </form>
      </div>

      <CardPanel className="flex flex-col gap-3">
        <SectionTitle className="uppercase">Players</SectionTitle>
        <AdminPlayers players={playerRows} />
      </CardPanel>

      <CardPanel className="flex flex-col gap-3">
        <SectionTitle className="uppercase">Drink menu</SectionTitle>
        <p className="text-sm text-ink-muted">Changes here never touch drinks that were already logged.</p>
        <AdminMenu items={menu} />
      </CardPanel>

      <CardPanel className="flex flex-col gap-3">
        <SectionTitle className="uppercase">All drinks</SectionTitle>
        <AdminDrinks drinks={drinkRows} players={players.map((p) => ({ id: p.id, name: p.name, color: p.color }))} />
      </CardPanel>
    </main>
  );
}
