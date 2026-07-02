"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackButton({ fallback = "/browse", label = "Back to Search" }: { fallback?: string, label?: string }) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button 
      onClick={handleBack}
      className="text-neutral-900 dark:text-white hover:text-[var(--color-brand-primary)] transition-colors flex items-center gap-1 inline-flex font-medium"
    >
      <ChevronLeft size={20} /> {label}
    </button>
  );
}
