import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  bookService,
  getVerifiedCover,
} from '../services/bookService';
import { memberService, MEMBER_AVATARS } from '../services/memberService';

const LibraryContext = createContext(null);

const STORAGE_KEYS = {
  BOOKS: 'lms_study_books_v4',
  MEMBERS: 'lms_members_dummyjson_data_v1',
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
    if (key === STORAGE_KEYS.MEMBERS && Array.isArray(parsed) && parsed.length >= 10) {
      return parsed.map((m, idx) => ({
        ...m,
        id: String(m.id || `mem-${idx + 1}`),
        membershipId: m.membershipId || `LIB-MEM-${1000 + idx + 1}`,
        fullName: m.fullName || m.name || `Library Member ${idx + 1}`,
        name: m.fullName || m.name || `Library Member ${idx + 1}`,
        email: (m.email || `member${idx + 1}@library.com`).toLowerCase(),
        mobileNumber: m.mobileNumber || m.phone || '9876543210',
        phone: m.mobileNumber || m.phone || '9876543210',
        address: typeof m.address === 'object' && m.address !== null ? `${m.address.suite || ''} ${m.address.street || ''}, ${m.address.city || ''} - ${m.address.zipcode || ''}`.trim() : (m.address || 'Central Library Campus'),
        membershipDate: m.membershipDate || m.joinedDate || '2024-01-15',
        role: m.role || 'Student',
        status: m.status || 'Active',
        avatar: m.avatar || m.image || MEMBER_AVATARS[idx % MEMBER_AVATARS.length],
        image: m.avatar || m.image || MEMBER_AVATARS[idx % MEMBER_AVATARS.length],
        booksIssuedCount: Number(m.booksIssuedCount) || 0,
        source: m.source || 'DummyJSON API',
      }));
    }
    return parsed;
  } catch {
    return fallback;
  }
};

export const LibraryProvider = ({ children }) => {
  const [books, setBooks] = useState(() => loadFromStorage(STORAGE_KEYS.BOOKS, []));
  const [members, setMembers] = useState(() => loadFromStorage(STORAGE_KEYS.MEMBERS, []));
  const [activities, setActivities] = useState(() =>
    loadFromStorage(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

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

  const refreshMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiMembers = await memberService.fetchMembers();
      setMembers(apiMembers);
    } catch (err) {
      setError(err.message || 'Failed to fetch members from API');
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

  useEffect(() => {
    let isMounted = true;
    memberService.fetchMembers().then((apiMembers) => {
      if (isMounted && Array.isArray(apiMembers) && apiMembers.length > 0) {
        setMembers((prev) => {
          if (!prev || prev.length < 10 || prev.some((p) => !p.fullName || !p.fullName.trim() || !p.name || !p.avatar || p.source !== 'DummyJSON API')) {
            return apiMembers;
          }
          return prev.map((m, idx) => {
            const resolved = (m.fullName && m.fullName.trim()) || (m.name && m.name.trim()) || 'Library Member';
            const phone = m.mobileNumber || m.phone || '9876543210';
            const avatarUrl = m.avatar || m.image || MEMBER_AVATARS[idx % MEMBER_AVATARS.length];
            return {
              ...m,
              fullName: resolved,
              name: resolved,
              mobileNumber: phone,
              phone: phone,
              avatar: avatarUrl,
              image: avatarUrl,
            };
          });
        });
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

  const addMember = useCallback(
    async (memberData) => {
      const resolvedName = (memberData.fullName && memberData.fullName.trim()) || (memberData.name && memberData.name.trim()) || 'Library Member';
      const cleanPhone = (memberData.mobileNumber && memberData.mobileNumber.trim()) || (memberData.phone && memberData.phone.trim()) || '9876543210';
      const cleanAddr = typeof memberData.address === 'object' && memberData.address !== null
        ? `${memberData.address.suite || ''} ${memberData.address.street || ''}, ${memberData.address.city || ''} - ${memberData.address.zipcode || ''}`.trim()
        : (memberData.address?.trim() || 'Central Library Campus');
      const avatarUrl = memberData.avatar || memberData.image || MEMBER_AVATARS[Math.floor(Math.random() * MEMBER_AVATARS.length)];
      const newMember = {
        id: 'mem-' + Date.now(),
        membershipId: memberData.membershipId?.trim() || `LIB-MEM-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: resolvedName,
        name: resolvedName,
        email: (memberData.email?.trim() || 'member@library.com').toLowerCase(),
        mobileNumber: cleanPhone,
        phone: cleanPhone,
        address: cleanAddr,
        membershipDate: memberData.membershipDate || new Date().toISOString().split('T')[0],
        role: memberData.role || 'Student',
        status: memberData.status || 'Active',
        avatar: avatarUrl,
        image: avatarUrl,
        booksIssuedCount: Number(memberData.booksIssuedCount) || 0,
        source: 'DummyJSON API',
      };

      await memberService.createMember(newMember);

      setMembers((prev) => [newMember, ...prev]);
      logActivity(
        'member',
        'New Member Enrolled',
        `"${newMember.fullName}" enrolled with ID ${newMember.membershipId}.`,
        'Enrolled'
      );
      return newMember;
    },
    [logActivity]
  );

  const updateMember = useCallback(
    async (id, updatedData) => {
      const resolvedName = (updatedData.fullName && updatedData.fullName.trim()) || (updatedData.name && updatedData.name.trim()) || 'Library Member';
      const cleanPhone = (updatedData.mobileNumber && updatedData.mobileNumber.trim()) || (updatedData.phone && updatedData.phone.trim()) || '9876543210';
      const cleanAddr = typeof updatedData.address === 'object' && updatedData.address !== null
        ? `${updatedData.address.suite || ''} ${updatedData.address.street || ''}, ${updatedData.address.city || ''} - ${updatedData.address.zipcode || ''}`.trim()
        : (updatedData.address?.trim() || 'Central Library Campus');
      const avatarUrl = updatedData.avatar || updatedData.image || MEMBER_AVATARS[0];
      const updatedMember = {
        ...updatedData,
        id: String(id),
        membershipId: updatedData.membershipId?.trim(),
        fullName: resolvedName,
        name: resolvedName,
        email: (updatedData.email?.trim() || 'member@library.com').toLowerCase(),
        mobileNumber: cleanPhone,
        phone: cleanPhone,
        address: cleanAddr,
        membershipDate: updatedData.membershipDate,
        role: updatedData.role || 'Student',
        status: updatedData.status || 'Active',
        avatar: avatarUrl,
        image: avatarUrl,
        booksIssuedCount: Number(updatedData.booksIssuedCount) || 0,
      };

      await memberService.updateMember(id, updatedMember);

      setMembers((prev) => prev.map((m) => (String(m.id) === String(id) ? updatedMember : m)));
      logActivity(
        'member',
        'Member Profile Updated',
        `Profile for "${updatedMember.fullName}" (${updatedMember.membershipId}) updated.`,
        'Updated'
      );
      return updatedMember;
    },
    [logActivity]
  );

  const deleteMember = useCallback(
    async (id) => {
      let target = null;
      setMembers((prev) => {
        target = prev.find((m) => String(m.id) === String(id));
        return prev.filter((m) => String(m.id) !== String(id));
      });

      await memberService.deleteMember(id);

      if (target) {
        logActivity('member', 'Member Removed', `"${target.fullName}" removed from members registry.`, 'Removed');
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
        members,
        setMembers,
        activities,
        setActivities,
        loading,
        error,
        refreshBooks,
        refreshMembers,
        searchGoogleBooks,
        searchLocalBooks,
        addBook,
        updateBook,
        deleteBook,
        addMember,
        updateMember,
        deleteMember,
        logActivity,
        metrics: {
          totalBooks,
          totalCopies,
          totalAvailableCopies,
          totalMembers: members.length,
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
