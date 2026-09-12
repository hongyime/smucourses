"use client";

export default function UnavailableSelections({ ids, onRemove }: { ids: readonly string[]; onRemove: (id: string) => void }) {
  if (!ids.length) return null;
  return (
    <section aria-label="Unavailable saved selections" className="my-6 border border-neutral-400 p-4">
      <h2 className="font-semibold">Unavailable saved selections ({ids.length})</h2>
      <p className="mt-1 text-sm">These IDs are absent from the current catalog. They remain saved until you remove them.</p>
      <ul className="mt-3 space-y-2">
        {ids.map((id, index) => <li key={`${index}-${id}`} className="flex flex-wrap items-center gap-3">
          <span className="min-w-0 break-all">{id || "(empty ID)"}</span>
          <button type="button" onClick={() => onRemove(id)} aria-label={`Remove unavailable selection ${id || "empty ID"}`} className="border border-current px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2">Remove</button>
        </li>)}
      </ul>
    </section>
  );
}
