import type { Metadata } from "next";
import { PeopleList } from "@/components/PeopleList";
import { RoomsEditor } from "@/components/RoomsEditor";
import { EmptyState, PageTitle } from "@/components/ui";
import { getHub } from "@/lib/data";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage() {
  const hub = await getHub();
  return (
    <main className="flex flex-col gap-4 md:gap-8">
      <PageTitle className="uppercase">People</PageTitle>
      {hub.players.length === 0 ? <EmptyState>Nobody has joined yet.</EmptyState> : <PeopleList hub={hub} />}
      {hub.players.length > 0 && <RoomsEditor rooms={hub.rooms} players={hub.players} />}
    </main>
  );
}
