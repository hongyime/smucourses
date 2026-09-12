"use client";

import { useSyncExternalStore } from "react";
import { selectionStores } from "@/lib/selectionStore";

export function useBookmarks(namespace: "courses" | "professors" = "courses") {
  const store = namespace === "courses" ? selectionStores.courseBookmarks : selectionStores.professorBookmarks;
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return {
    bookmarks: snapshot.ids,
    isLoaded: snapshot.isLoaded,
    toggleBookmark: (id: string) => { store.toggle(id); },
    isBookmarked: (id: string) => snapshot.ids.includes(id),
  };
}
