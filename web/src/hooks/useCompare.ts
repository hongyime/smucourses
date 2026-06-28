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
    const saved = localStorage.getItem(storageKey);
    let current: string[] = [];
    if (saved) {
      try { current = JSON.parse(saved); } catch(e){}
    }

    let newIds;
    if (current.includes(id)) {
      newIds = current.filter(i => i !== id);
    } else {
      if (current.length >= 3) {
        alert(`You can only compare up to 3 ${namespace} at a time.`);
        return;
      }
      newIds = [...current, id];
    }
    
    localStorage.setItem(storageKey, JSON.stringify(newIds));
    setCompareIds(newIds);
    window.dispatchEvent(new Event(eventName));
  };

  const clearCompare = () => {
    setCompareIds([]);
    localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event(eventName));
  };

  return { compareIds, toggleCompare, clearCompare };
}
