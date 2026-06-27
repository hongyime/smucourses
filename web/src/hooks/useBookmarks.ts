"use client";

import { useState, useEffect, useCallback } from "react";

export function useBookmarks(namespace: "courses" | "professors" = "courses") {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const storageKey = namespace === "courses" ? "smucourses_bookmarks" : "smucourses_bookmarks_professors";
  const eventName = namespace === "courses" ? "bookmarksUpdated" : "bookmarksProfessorsUpdated";

  const loadBookmarks = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      } else {
        setBookmarks([]);
      }
    } catch (e) {
      console.error("Failed to load bookmarks", e);
    }
    setIsLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    const timer = setTimeout(() => loadBookmarks(), 0);
    window.addEventListener(eventName, loadBookmarks);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(eventName, loadBookmarks);
    };
  }, [loadBookmarks, eventName]);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      let newBookmarks;
      if (prev.includes(id)) {
        newBookmarks = prev.filter((i) => i !== id);
      } else {
        newBookmarks = [...prev, id];
      }
      localStorage.setItem(storageKey, JSON.stringify(newBookmarks));
      window.dispatchEvent(new Event(eventName));
      return newBookmarks;
    });
  };

  const isBookmarked = (id: string) => bookmarks.includes(id);

  return { bookmarks, toggleBookmark, isBookmarked, isLoaded };
}
