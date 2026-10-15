import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { bookService, getVerifiedCover } from '../services/bookService';

const BookContext = createContext(null);

const STORAGE_KEY = 'lms_books_api_data_v6';

const syncBookCovers = (booksList) => {
  if (!Array.isArray(booksList)) return [];
  return booksList.map((b) => ({
    ...b,
    coverImage: getVerifiedCover(b.title, b.isbn, b.author, b.category, b.coverImage),
  }));
};

const loadBooksFromStorage = () => {
  try {
    localStorage.removeItem('lms_study_books_v5');
    localStorage.removeItem('lms_study_books_v4');
    localStorage.removeItem('lms_study_books_v3');
    localStorage.removeItem('lms_study_books_v2');
    localStorage.removeItem('lms_study_books_v1');

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return syncBookCovers(parsed);
    }
    return [];
  } catch {
    return [];
  }
};

export const BookProvider = ({ children }) => {
  const [books, setBooks] = useState(loadBooksFromStorage);
  const [loading, setLoading] = useState(() => loadBooksFromStorage().length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const refreshBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBooks = await bookService.fetchBooks(40);
      setBooks(syncBookCovers(apiBooks));
    } catch (err) {
      setError(err.message || 'Failed to fetch books from API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    bookService.fetchBooks(40).then((apiBooks) => {
      if (isMounted && Array.isArray(apiBooks) && apiBooks.length > 0) {
        setBooks((prev) => {
          if (!prev || prev.length === 0) {
            return syncBookCovers(apiBooks);
          }
          const existingIds = new Set(prev.map((p) => String(p.id)));
          const newFromApi = apiBooks.filter((a) => !existingIds.has(String(a.id)));
          return [...prev, ...syncBookCovers(newFromApi)];
        });
      }
    }).catch((err) => {
      if (isMounted) {
        setError(err.message || 'Failed to fetch books from API');
      }
    }).finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const addBook = useCallback(async (bookData) => {
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
    return newBook;
  }, []);

  const updateBook = useCallback(async (id, updatedData) => {
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
    return updatedBook;
  }, []);

  const deleteBook = useCallback(async (id) => {
    setBooks((prev) => prev.filter((b) => String(b.id) !== String(id)));
    await bookService.deleteBook(id);
    return id;
  }, []);

  const searchGoogleBooks = useCallback(async (query, maxResults = 12) => {
    return await bookService.searchBooks(query, maxResults);
  }, []);

  const searchLocalBooks = useCallback((query, limit = 8) => {
    return bookService.searchLocalBooks(query, limit);
  }, []);

  return (
    <BookContext.Provider
      value={{
        books,
        setBooks,
        loading,
        error,
        refreshBooks,
        addBook,
        updateBook,
        deleteBook,
        searchGoogleBooks,
        searchLocalBooks,
      }}
    >
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
};
