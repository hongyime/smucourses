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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-[var(--color-brand-primary)] selection:text-[#050a14]">
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
