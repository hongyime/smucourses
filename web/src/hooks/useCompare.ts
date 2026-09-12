"use client";

import { useSyncExternalStore } from "react";
import { selectionStores } from "@/lib/selectionStore";

export function useCompare(namespace: "courses" | "professors" = "courses") {
  const store = namespace === "courses" ? selectionStores.courseCompare : selectionStores.professorCompare;
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const toggleCompare = (id: string) => {
    if (store.toggle(id, 3) === "limit") alert(`You can only compare up to 3 ${namespace} at a time.`);
  };
  return { compareIds: snapshot.ids, toggleCompare, clearCompare: store.clear };
}
