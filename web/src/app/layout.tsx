import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-display" });

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased selection:bg-[var(--color-brand-primary)] selection:text-white font-sans bg-[var(--color-bg-base)] text-[var(--color-text-main)] transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <Navbar />
          <main>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
