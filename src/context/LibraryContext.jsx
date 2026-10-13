import React, { createContext, useContext, useState, useEffect } from 'react';

const LibraryContext = createContext(null);

const STORAGE_KEYS = {
  BOOKS: 'lms_books_data',
  MEMBERS: 'lms_members_data',
  CATEGORIES: 'lms_categories_data',
  ISSUES: 'lms_issues_data',
  ACTIVITIES: 'lms_activities_data',
  FINE: 'lms_fine_collected_data',
};

const loadFromStorage = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

export const LibraryProvider = ({ children }) => {
  const [books, setBooks] = useState(() => loadFromStorage(STORAGE_KEYS.BOOKS, []));
  const [members, setMembers] = useState(() => loadFromStorage(STORAGE_KEYS.MEMBERS, []));
  const [categories, setCategories] = useState(() => loadFromStorage(STORAGE_KEYS.CATEGORIES, []));
  const [issues, setIssues] = useState(() => loadFromStorage(STORAGE_KEYS.ISSUES, []));
  const [activities, setActivities] = useState(() => loadFromStorage(STORAGE_KEYS.ACTIVITIES, []));
  const [fineCollected, setFineCollected] = useState(() => loadFromStorage(STORAGE_KEYS.FINE, 0));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FINE, JSON.stringify(fineCollected));
  }, [fineCollected]);

  // Real-time calculated metrics from actual state
  const totalBooks = books.reduce((sum, b) => sum + Number(b.totalCopies ?? b.quantity ?? 1), 0);
  const booksIssued = issues.filter((i) => i.status === 'Issued' || i.status === 'Overdue').length;
  const booksAvailable = Math.max(0, totalBooks - booksIssued);
  const overdueBooks = issues.filter((i) => i.status === 'Overdue').length;
  const totalMembers = members.length;
  const totalCategories = categories.length;

  return (
    <LibraryContext.Provider
      value={{
        books,
        setBooks,
        members,
        setMembers,
        categories,
        setCategories,
        issues,
        setIssues,
        activities,
        setActivities,
        fineCollected,
        setFineCollected,
        metrics: {
          totalBooks,
          totalMembers,
          booksIssued,
          booksAvailable,
          overdueBooks,
          totalCategories,
          fineCollected,
        },
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
