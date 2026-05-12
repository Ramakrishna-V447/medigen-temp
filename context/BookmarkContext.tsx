
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/db';

interface BookmarkContextType {
  bookmarks: string[];
  addBookmark: (id: string) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Load bookmarks on mount or user change
  useEffect(() => {
    const loadedBookmarks = db.getBookmarks(userId);
    setBookmarks(loadedBookmarks);
  }, [userId]);

  // Persist bookmarks on change
  useEffect(() => {
    db.saveBookmarks(userId, bookmarks);
  }, [bookmarks, userId]);

  const addBookmark = (id: string) => {
    setBookmarks((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((bookmarkId) => bookmarkId !== id));
  };

  const isBookmarked = (id: string) => bookmarks.includes(id);

  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};
