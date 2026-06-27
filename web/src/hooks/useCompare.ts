import { useState, useEffect, useCallback } from 'react';

export function useCompare(namespace: "courses" | "professors" = "courses") {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const storageKey = namespace === "courses" ? "smu_compare" : "smu_compare_professors";
  const eventName = namespace === "courses" ? "compareUpdated" : "compareProfessorsUpdated";

  const loadIds = useCallback(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCompareIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
        setCompareIds([]);
    }
  }, [storageKey]);

  useEffect(() => {
    const timer = setTimeout(() => loadIds(), 0);
    window.addEventListener(eventName, loadIds);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(eventName, loadIds);
    };
  }, [loadIds, eventName]);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      let newIds;
      if (prev.includes(id)) {
        newIds = prev.filter(i => i !== id);
      } else {
        if (prev.length >= 3) {
          alert(`You can only compare up to 3 ${namespace} at a time.`);
          return prev;
        }
        newIds = [...prev, id];
      }
      localStorage.setItem(storageKey, JSON.stringify(newIds));
      window.dispatchEvent(new Event(eventName));
      return newIds;
    });
  };

  const clearCompare = () => {
    setCompareIds([]);
    localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event(eventName));
  };

  return { compareIds, toggleCompare, clearCompare };
}
