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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-[var(--color-brand-primary)] selection:text-[#050a14]">
        <nav className="sticky top-0 z-50 py-4 border-b border-white/10 bg-[#050a14]/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 max-w-7xl flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/icon.svg" alt="SMU Courses Logo" className="w-8 h-8" />
              <span className="font-display font-bold text-xl tracking-tight text-white">
                smu<span className="text-neutral-400 font-normal">courses</span>
              </span>
            </Link>
            <div className="flex gap-6 items-center">
              <Link href="/courses" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                Browse
              </Link>
              <Link href="/bookmarks" className="text-sm font-medium text-neutral-300 hover:text-[var(--color-brand-primary)] transition-colors">
                Bookmarks
              </Link>
              <Link href="/compare" className="text-sm font-medium text-indigo-300 hover:text-indigo-200 transition-colors px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                Compare
              </Link>
            </div>
          </div>
        </nav>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
