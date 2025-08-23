import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BookmarksContextType {
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export const BookmarksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  
  useEffect(() => {
    // Load bookmarks from local storage on initial load
    const savedBookmarks = localStorage.getItem('studentStarterBookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
  }, []);
  
  useEffect(() => {
    // Save bookmarks to local storage whenever they change
    localStorage.setItem('studentStarterBookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);
  
  const toggleBookmark = (id: string) => {
    setBookmarks((prevBookmarks) => {
      if (prevBookmarks.includes(id)) {
        return prevBookmarks.filter((bookmark) => bookmark !== id);
      } else {
        return [...prevBookmarks, id];
      }
    });
  };
  
  return (
    <BookmarksContext.Provider value={{ bookmarks, toggleBookmark }}>
      {children}
    </BookmarksContext.Provider>
  );
};

export const useBookmarks = (): BookmarksContextType => {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
};