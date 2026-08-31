import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Public Innovation Challenge",
    template: "%s · Public Innovation Challenge",
  },
  description:
    "Course materials for the Public Innovation Challenge simulation used in the UMKC Government Accounting class.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
