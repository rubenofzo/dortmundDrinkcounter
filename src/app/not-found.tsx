import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState>
      Nothing on tap here.{" "}
      <Link href="/" className="font-bold text-accent underline">
        Back to the bar
      </Link>
    </EmptyState>
  );
}
