import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SiteAnalytics from "./SiteAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Public AI Innovation Challenge",
    template: "%s · Public AI Innovation Challenge",
  },
  description:
    "Course materials for the Public AI Innovation Challenge simulation used in the UMKC Government Accounting class.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
