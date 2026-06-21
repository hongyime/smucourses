"use client";

import { useState, useEffect } from "react";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem("smucourses_bookmarks");
        if (stored) {
          setBookmarks(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load bookmarks", e);
      }
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleBookmark = (courseId: string) => {
    setBookmarks((prev) => {
      let newBookmarks;
      if (prev.includes(courseId)) {
        newBookmarks = prev.filter((id) => id !== courseId);
      } else {
        newBookmarks = [...prev, courseId];
      }
      localStorage.setItem("smucourses_bookmarks", JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  const isBookmarked = (courseId: string) => bookmarks.includes(courseId);

  return { bookmarks, toggleBookmark, isBookmarked, isLoaded };
}
