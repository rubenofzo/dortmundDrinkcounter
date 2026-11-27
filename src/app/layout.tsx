import type { Metadata, Viewport } from "next";
import { Manrope, Oswald } from "next/font/google";
import { AutoRefresh } from "@/components/AutoRefresh";
import { BottomNav } from "@/components/BottomNav";
import { SiteHeader } from "@/components/SiteHeader";
import { UnlockToastHost } from "@/components/UnlockToastHost";
import { HallPanel } from "@/components/ui";
import { getSetupProblem } from "@/lib/data";
import "./globals.css";

const display = Oswald({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-oswald" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: { default: "Sticky Dortmund · Drinkhub", template: "%s · Drinkhub" },
  description: "Drink counter for our weekend in Dortmund.",
  robots: { index: false, follow: false },
};

// viewportFit "cover" lets the bottom tab bar pad itself for the home indicator.
export const viewport: Viewport = { themeColor: "#1a140c", viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const problem = await getSetupProblem();
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <div aria-hidden className="stripe h-1.5 w-full" />
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pt-3.5 pb-[calc(84px+env(safe-area-inset-bottom))] md:gap-8 md:px-6 md:pt-10 md:pb-16">
          {problem ? (
            <HallPanel className="mx-auto mt-16 flex max-w-xl flex-col gap-3 text-center">
              <h1 className="font-display text-4xl uppercase">The taps aren&rsquo;t open yet</h1>
              <p className="text-mist">{problem}</p>
            </HallPanel>
          ) : (
            <>
              <SiteHeader />
              {children}
              <BottomNav />
              <AutoRefresh seconds={15} />
              <UnlockToastHost />
            </>
          )}
        </div>
      </body>
    </html>
  );
}
