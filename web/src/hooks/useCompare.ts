import { useState, useEffect, useCallback } from 'react';

export function useCompare() {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const loadIds = useCallback(() => {
    const saved = localStorage.getItem('smu_compare');
    if (saved) {
      try {
        setCompareIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
        setCompareIds([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadIds(), 0);
    window.addEventListener('compareUpdated', loadIds);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('compareUpdated', loadIds);
    };
  }, [loadIds]);

  const toggleCompare = (courseId: string) => {
    setCompareIds(prev => {
      let newIds;
      if (prev.includes(courseId)) {
        newIds = prev.filter(id => id !== courseId);
      } else {
        if (prev.length >= 3) {
          alert('You can only compare up to 3 courses at a time.');
          return prev;
        }
        newIds = [...prev, courseId];
      }
      localStorage.setItem('smu_compare', JSON.stringify(newIds));
      window.dispatchEvent(new Event('compareUpdated'));
      return newIds;
    });
  };

  const clearCompare = () => {
    setCompareIds([]);
    localStorage.removeItem('smu_compare');
    window.dispatchEvent(new Event('compareUpdated'));
  };

  return { compareIds, toggleCompare, clearCompare };
}
