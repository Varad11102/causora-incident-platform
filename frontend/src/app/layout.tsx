import type { Metadata } from "next";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource/instrument-serif/latin-400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Causora — Incident Intelligence",
  description: "Real-time causal incident investigation and approval-controlled remediation.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
