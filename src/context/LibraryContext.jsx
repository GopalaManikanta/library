import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  bookService,
  getVerifiedCover,
} from '../services/bookService';

const LibraryContext = createContext(null);

const STORAGE_KEYS = {
  BOOKS: 'lms_study_books_v4',
  ACTIVITIES: 'lms_activities_data',
};

const DEFAULT_ACTIVITIES = [
  {
    id: 'act-1',
    type: 'book',
    title: 'Catalog Initialized',
    description: '20 verified study & technical volumes (Python, Java, DSA, OS, DBMS) loaded into catalog.',
    badge: 'System',
    timestamp: 'Today',
  },
  {
    id: 'act-2',
    type: 'inventory',
    title: 'Inventory Synchronized',
    description: 'Shelf stock and classification categories synced with Open Library API.',
    badge: 'Inventory',
    timestamp: 'Today',
  },
];

const loadFromStorage = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    const parsed = JSON.parse(data);
    if (key === STORAGE_KEYS.BOOKS && Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

export const LibraryProvider = ({ children }) => {
  const [books, setBooks] = useState(() => loadFromStorage(STORAGE_KEYS.BOOKS, []));
  const [activities, setActivities] = useState(() =>
    loadFromStorage(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  const logActivity = useCallback((type, title, description, badge = '') => {
    const newActivity = {
      id: 'act-' + Date.now(),
      type,
      title,
      description,
      badge,
      timestamp: 'Just now',
    };
    setActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
  }, []);

  const refreshBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBooks = await bookService.fetchBooks(20);
      setBooks(apiBooks);
    } catch (err) {
      setError(err.message || 'Failed to fetch books from API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    bookService.fetchBooks(20).then((apiBooks) => {
      if (isMounted && Array.isArray(apiBooks) && apiBooks.length > 0) {
        setBooks(apiBooks);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const addBook = useCallback(
    async (bookData) => {
      const total = Number(bookData.totalCopies) || 1;
      const avail = Number(bookData.availableCopies ?? total);
      const verifiedCover = getVerifiedCover(
        bookData.title,
        bookData.isbn,
        bookData.author,
        bookData.category,
        bookData.coverImage
      );
      const newBook = {
        id: String(Date.now()),
        createdAt: Date.now(),
        title: bookData.title.trim(),
        author: bookData.author.trim(),
        isbn: bookData.isbn?.trim() || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        publisher: bookData.publisher?.trim() || 'Independent Press',
        category: bookData.category || 'General',
        publishedYear: Number(bookData.publishedYear) || new Date().getFullYear(),
        totalCopies: total,
        availableCopies: avail,
        coverImage: verifiedCover,
        description: bookData.description?.trim() || 'No description provided.',
        source: bookData.source || 'Open Library API',
      };

      await bookService.createBook(newBook);

      setBooks((prev) => [newBook, ...prev]);
      logActivity(
        'book',
        'New Book Added',
        `"${newBook.title}" by ${newBook.author} added to inventory.`,
        `+${newBook.totalCopies} Copies`
      );
      return newBook;
    },
    [logActivity]
  );

  const updateBook = useCallback(
    async (id, updatedData) => {
      const total = Number(updatedData.totalCopies) || 1;
      const avail = Number(updatedData.availableCopies ?? total);
      const verifiedCover = getVerifiedCover(
        updatedData.title,
        updatedData.isbn,
        updatedData.author,
        updatedData.category,
        updatedData.coverImage
      );
      const updatedBook = {
        ...updatedData,
        id: String(id),
        totalCopies: total,
        availableCopies: avail,
        coverImage: verifiedCover,
        publishedYear: Number(updatedData.publishedYear) || 2024,
      };

      await bookService.updateBook(id, updatedBook);

      setBooks((prev) => prev.map((b) => (String(b.id) === String(id) ? updatedBook : b)));
      logActivity('book', 'Book Updated', `"${updatedBook.title}" details updated.`, 'Updated');
      return updatedBook;
    },
    [logActivity]
  );

  const deleteBook = useCallback(
    async (id) => {
      let target = null;
      setBooks((prev) => {
        target = prev.find((b) => String(b.id) === String(id));
        return prev.filter((b) => String(b.id) !== String(id));
      });

      await bookService.deleteBook(id);

      if (target) {
        logActivity('book', 'Book Deleted', `"${target.title}" removed from library catalog.`, 'Removed');
      }
      return id;
    },
    [logActivity]
  );

  const totalBooks = books.length;
  const totalCopies = books.reduce((sum, b) => sum + Number(b.totalCopies ?? 1), 0);
  const totalAvailableCopies = books.reduce((sum, b) => sum + Number(b.availableCopies ?? b.totalCopies ?? 1), 0);
  const booksAvailable = books.filter((b) => Number(b.availableCopies ?? b.totalCopies ?? 1) > 0).length;
  const totalCategories = Array.from(new Set(books.map((b) => b.category).filter(Boolean))).length;

  const searchGoogleBooks = useCallback(async (query, maxResults = 12) => {
    return await bookService.searchBooks(query, maxResults);
  }, []);

  const searchLocalBooks = useCallback((query, limit = 8) => {
    return bookService.searchLocalBooks(query, limit);
  }, []);

  return (
    <LibraryContext.Provider
      value={{
        books,
        setBooks,
        activities,
        setActivities,
        loading,
        error,
        refreshBooks,
        searchGoogleBooks,
        searchLocalBooks,
        addBook,
        updateBook,
        deleteBook,
        logActivity,
        metrics: {
          totalBooks,
          totalCopies,
          totalAvailableCopies,
          totalMembers: 3,
          booksIssued: 3,
          booksAvailable,
          overdueBooks: 1,
          totalCategories,
          fineCollected: 250,
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
