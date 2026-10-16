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

export const DEFAULT_CATEGORIES = [
  {
    id: 'cat-1',
    name: 'Computer Science',
    description: 'Foundations of computation, systems architecture, and core computer science',
    color: 'teal',
    icon: 'Code',
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-2',
    name: 'Programming',
    description: 'Software development, syntax, paradigms, and hands-on coding languages',
    color: 'emerald',
    icon: 'Terminal',
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-3',
    name: 'Algorithms',
    description: 'Data structures, algorithm complexity, search/sort optimization, and efficiency',
    color: 'indigo',
    icon: 'Cpu',
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-4',
    name: 'Database',
    description: 'Relational DBMS, SQL, schema design, and distributed data systems',
    color: 'sky',
    icon: 'Database',
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-5',
    name: 'Software Engineering',
    description: 'Software lifecycle, design patterns, testing, refactoring, and architectures',
    color: 'purple',
    icon: 'Layers',
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-6',
    name: 'Study & Technology',
    description: 'Academic reference literature, system guides, and technological primers',
    color: 'amber',
    icon: 'BookOpen',
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-7',
    name: 'General',
    description: 'Interdisciplinary titles and general library catalog volumes',
    color: 'slate',
    icon: 'Bookmark',
    createdAt: '2024-01-01',
  },
];

const CATEGORIES_STORAGE_KEY = 'lms_categories_data_v1';

const loadCategoriesFromStorage = () => {
  let baseCats = DEFAULT_CATEGORIES;
  try {
    const data = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseCats = parsed;
      }
    }
  } catch {}

  try {
    const booksData = localStorage.getItem(STORAGE_KEY);
    if (booksData) {
      const parsedBooks = JSON.parse(booksData);
      if (Array.isArray(parsedBooks)) {
        const existingNames = new Set(baseCats.map((c) => c.name.toLowerCase().trim()));
        parsedBooks.forEach((b) => {
          const catName = (b.category || '').trim();
          if (catName && !existingNames.has(catName.toLowerCase())) {
            existingNames.add(catName.toLowerCase());
            baseCats.push({
              id: 'cat-' + (baseCats.length + 1),
              name: catName,
              description: `${catName} reference volumes and literature.`,
              color: 'teal',
              icon: 'BookOpen',
              createdAt: '2024-01-01',
            });
          }
        });
      }
    }
  } catch {}

  return baseCats;
};

const loadBooksFromStorage = () => {
  try {
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
  const [categories, setCategories] = useState(loadCategoriesFromStorage);
  const [loading, setLoading] = useState(() => loadBooksFromStorage().length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

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

  const addCategory = useCallback(async (categoryData) => {
    const rawName = (categoryData.name || '').trim();
    if (!rawName) {
      throw new Error('Category name is required.');
    }
    let created;
    setCategories((prev) => {
      const exists = prev.some((c) => c.name.toLowerCase() === rawName.toLowerCase());
      if (exists) {
        throw new Error(`Category "${rawName}" already exists.`);
      }
      created = {
        id: 'cat-' + Date.now(),
        name: rawName,
        description: (categoryData.description || '').trim() || 'Catalog subject classification.',
        color: categoryData.color || 'teal',
        icon: categoryData.icon || 'Layers',
        createdAt: '2024-01-01',
      };
      return [...prev, created];
    });
    return created;
  }, []);

  const updateCategory = useCallback(async (id, updatedData) => {
    const rawName = (updatedData.name || '').trim();
    if (!rawName) {
      throw new Error('Category name is required.');
    }
    let updated;
    let oldName = '';
    setCategories((prev) => {
      const target = prev.find((c) => String(c.id) === String(id));
      if (!target) {
        throw new Error('Category not found.');
      }
      const duplicate = prev.some(
        (c) => String(c.id) !== String(id) && c.name.toLowerCase() === rawName.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Another category named "${rawName}" already exists.`);
      }
      oldName = target.name;
      updated = {
        ...target,
        name: rawName,
        description: (updatedData.description || '').trim(),
        color: updatedData.color || target.color || 'teal',
        icon: updatedData.icon || target.icon || 'Layers',
      };
      return prev.map((c) => (String(c.id) === String(id) ? updated : c));
    });

    if (oldName && oldName.toLowerCase() !== rawName.toLowerCase()) {
      setBooks((prevBooks) =>
        prevBooks.map((b) =>
          b.category?.toLowerCase() === oldName.toLowerCase()
            ? { ...b, category: rawName }
            : b
        )
      );
    }
    return updated;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    let deleted;
    setCategories((prev) => {
      const target = prev.find((c) => String(c.id) === String(id));
      if (!target) {
        throw new Error('Category not found.');
      }
      deleted = target;
      return prev.filter((c) => String(c.id) !== String(id));
    });

    if (deleted) {
      const targetName = deleted.name;
      setBooks((prevBooks) =>
        prevBooks.map((b) =>
          b.category?.toLowerCase() === targetName.toLowerCase()
            ? { ...b, category: 'General' }
            : b
        )
      );
    }
    return deleted;
  }, []);

  return (
    <BookContext.Provider
      value={{
        books,
        setBooks,
        categories,
        setCategories,
        addCategory,
        updateCategory,
        deleteCategory,
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
