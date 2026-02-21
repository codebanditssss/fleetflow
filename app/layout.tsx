import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "FleetFlow",
  description: "Modular Fleet & Logistics Management System"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
