export type SelectionIssue = "read" | "format" | "write" | null;
export type SelectionSnapshot = {
  readonly ids: readonly string[];
  readonly isLoaded: boolean;
  readonly issue: SelectionIssue;
};

type StorageAccess = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Environment = {
  storage: () => StorageAccess;
  events: () => EventTarget | null;
};

const emptySnapshot: SelectionSnapshot = { ids: [], isLoaded: false, issue: null };
const browserEnvironment: Environment = {
  storage: () => window.localStorage,
  events: () => typeof window === "undefined" ? null : window,
};

export function createSelectionStore(key: string, eventName: string, environment = browserEnvironment) {
  let snapshot = emptySnapshot;
  const listeners = new Set<() => void>();
  let stopListening: (() => void) | undefined;

  function publish(ids: readonly string[], issue: SelectionIssue) {
    if (snapshot.isLoaded && snapshot.issue === issue && ids.length === snapshot.ids.length && ids.every((id, index) => id === snapshot.ids[index])) return;
    snapshot = { ids, isLoaded: true, issue };
    for (const listener of listeners) listener();
  }

  function refresh() {
    let stored: string | null;
    try {
      stored = environment.storage().getItem(key);
    } catch {
      publish(snapshot.ids, "read");
      return false;
    }
    try {
      const parsed: unknown = stored === null ? [] : JSON.parse(stored);
      if (!Array.isArray(parsed) || !parsed.every((id): id is string => typeof id === "string")) {
        publish(snapshot.ids, "format");
        return false;
      }
      publish(parsed, null);
      return true;
    } catch {
      publish(snapshot.ids, "format");
      return false;
    }
  }

  function persist(ids: readonly string[], remove = false) {
    try {
      const storage = environment.storage();
      if (remove) storage.removeItem(key);
      else storage.setItem(key, JSON.stringify(ids));
    } catch {
      publish(snapshot.ids, "write");
      return false;
    }
    publish(ids, null);
    environment.events()?.dispatchEvent(new Event(eventName));
    return true;
  }

  return {
    key,
    getSnapshot: () => snapshot,
    getServerSnapshot: () => emptySnapshot,
    refresh,
    readRaw: () => {
      try { return { readable: true, raw: environment.storage().getItem(key) }; }
      catch { return { readable: false }; }
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        const events = environment.events();
        const onStorage = (event: Event) => {
          const changedKey = (event as StorageEvent).key;
          if (changedKey === key || changedKey === null) refresh();
        };
        events?.addEventListener("storage", onStorage);
        events?.addEventListener(eventName, refresh);
        stopListening = () => {
          events?.removeEventListener("storage", onStorage);
          events?.removeEventListener(eventName, refresh);
        };
        refresh();
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) stopListening?.();
      };
    },
    toggle(id: string, limit = Infinity): "saved" | "limit" | "unavailable" {
      if (!refresh()) return "unavailable";
      const current = snapshot.ids;
      const present = current.includes(id);
      if (!present && current.length >= limit) return "limit";
      const next = present ? current.filter((saved) => saved !== id) : [...current, id];
      return persist(next) ? "saved" : "unavailable";
    },
    clear() {
      return refresh() && persist([], true);
    },
  };
}

export const selectionStores = {
  courseBookmarks: createSelectionStore("smucourses_bookmarks", "bookmarksUpdated"),
  professorBookmarks: createSelectionStore("smucourses_bookmarks_professors", "bookmarksProfessorsUpdated"),
  courseCompare: createSelectionStore("smu_compare", "compareUpdated"),
  professorCompare: createSelectionStore("smu_compare_professors", "compareProfessorsUpdated"),
};
