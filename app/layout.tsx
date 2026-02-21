import type { Metadata } from "next";
import { Source_Code_Pro } from "next/font/google";
import "./globals.css";

const sourceCodePro = Source_Code_Pro({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "FleetFlow — Fleet & Logistics Command Center",
    description:
        "Centralized fleet management: vehicles, trips, drivers, maintenance, and analytics. Built for dispatchers, fleet managers, and safety officers.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${sourceCodePro.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
