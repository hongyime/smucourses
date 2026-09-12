"use client";

import { useSyncExternalStore } from "react";
import { selectionStores } from "@/lib/selectionStore";

const stores = Object.values(selectionStores);
function useSelectionIssue(store: typeof stores[number]) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot).issue;
}

export default function SavedSelectionsNotice() {
  const issues = [
    useSelectionIssue(selectionStores.courseBookmarks),
    useSelectionIssue(selectionStores.professorBookmarks),
    useSelectionIssue(selectionStores.courseCompare),
    useSelectionIssue(selectionStores.professorCompare),
  ];
  if (!issues.some(Boolean)) return null;
  const unreadableFormat = issues.includes("format");
  const blockedRead = issues.includes("read");

  function downloadBackup() {
    const saved = Object.fromEntries(stores.map((store) => [store.key, store.readRaw()]));
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "smu-saved-selections-backup.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <aside role="status" className="mx-auto my-4 max-w-7xl border border-amber-600 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
      <p>{unreadableFormat
        ? "Some saved selections could not be read. They have not been replaced. Download a backup before repairing this browser's saved data."
        : blockedRead
          ? "Your browser blocked access to saved selections. Changes have not been saved. Allow site storage and try again."
          : "Your browser could not save that change. Your previous saved selections have been kept."}</p>
      {unreadableFormat && blockedRead && <p className="mt-2">The backup marks selections that could not be read.</p>}
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" onClick={() => stores.forEach((store) => store.refresh())} className="border border-current px-3 py-1 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">Retry saved selections</button>
        {unreadableFormat && <button type="button" onClick={downloadBackup} className="border border-current px-3 py-1 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">Download saved selections</button>}
      </div>
    </aside>
  );
}
