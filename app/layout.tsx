import type { Metadata } from "next";
import { Source_Code_Pro } from "next/font/google";
import { ThemeProvider } from "./providers/theme-provider";
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
        "Centralized fleet management: vehicles, trips, drivers, maintenance, and analytics.",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* 
          Blocking script — runs before first paint, reads localStorage and
          applies the correct theme class immediately. Prevents dark→light flash.
        */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('ff-theme') || 'dark';
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(theme);
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
                    }}
                />
            </head>
            <body className={`${sourceCodePro.variable} antialiased`}>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
