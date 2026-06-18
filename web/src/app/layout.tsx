import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMU Courses | Enhanced Course Catalog",
  description: "A fast, transparent course catalog for SMU students. View exact exam weightages, historical syllabi, and degree requirements.",
  icons: {
    icon: '/icon.svg',
  },
};

import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-[var(--color-brand-primary)] selection:text-white">
        <ThemeProvider>
          <Navbar />
          <main>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
