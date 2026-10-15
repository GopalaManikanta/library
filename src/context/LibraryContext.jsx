import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { BookProvider, useBooks } from './BookContext';
import { MemberProvider, useMembers } from './MemberContext';
import { CirculationProvider, useCirculation } from './CirculationContext';

const LibraryContext = createContext(null);

const STORAGE_KEYS = {
  ACTIVITIES: 'lms_activities_data',
};

const loadActivitiesFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
};

const LibraryContextComposer = ({ children }) => {
  const bookCtx = useBooks();
  const memberCtx = useMembers();
  const circulationCtx = useCirculation();

  const [activities, setActivities] = useState(loadActivitiesFromStorage);
  const [currentDateStr] = useState(() => new Date().toISOString().split('T')[0]);

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

  const addBook = useCallback(
    async (bookData) => {
      const result = await bookCtx.addBook(bookData);
      logActivity(
        'book',
        'New Book Added',
        `"${result.title}" by ${result.author} added to inventory.`,
        `+${result.totalCopies} Copies`
      );
      return result;
    },
    [bookCtx, logActivity]
  );

  const updateBook = useCallback(
    async (id, updatedData) => {
      const result = await bookCtx.updateBook(id, updatedData);
      logActivity('book', 'Book Updated', `"${result.title}" details updated.`, 'Updated');
      return result;
    },
    [bookCtx, logActivity]
  );

  const deleteBook = useCallback(
    async (id) => {
      const target = bookCtx.books.find((b) => String(b.id) === String(id));
      const result = await bookCtx.deleteBook(id);
      if (target) {
        logActivity('book', 'Book Deleted', `"${target.title}" removed from library catalog.`, 'Removed');
      }
      return result;
    },
    [bookCtx, logActivity]
  );

  const addMember = useCallback(
    async (memberData) => {
      const result = await memberCtx.addMember(memberData);
      logActivity(
        'member',
        'New Member Enrolled',
        `"${result.fullName}" enrolled with ID ${result.membershipId}.`,
        'Enrolled'
      );
      return result;
    },
    [memberCtx, logActivity]
  );

  const updateMember = useCallback(
    async (id, updatedData) => {
      const result = await memberCtx.updateMember(id, updatedData);
      logActivity(
        'member',
        'Member Profile Updated',
        `Profile for "${result.fullName}" (${result.membershipId}) updated.`,
        'Updated'
      );
      return result;
    },
    [memberCtx, logActivity]
  );

  const deleteMember = useCallback(
    async (id) => {
      const target = memberCtx.members.find((m) => String(m.id) === String(id));
      const result = await memberCtx.deleteMember(id);
      if (target) {
        logActivity('member', 'Member Removed', `"${target.fullName}" removed from members registry.`, 'Removed');
      }
      return result;
    },
    [memberCtx, logActivity]
  );

  const issueBook = useCallback(
    async (issueData) => {
      const result = await circulationCtx.issueBook(issueData);
      logActivity(
        'circulation',
        'Book Issued',
        `"${result.bookTitle}" issued to ${result.memberName}.`,
        `Due: ${result.dueDate}`
      );
      return result;
    },
    [circulationCtx, logActivity]
  );

  const returnBook = useCallback(
    async (transactionId, returnDate) => {
      const result = await circulationCtx.returnBook(transactionId, returnDate);
      const fine = Number(result.fineAmount) || 0;
      logActivity(
        'circulation',
        'Book Returned',
        `"${result.bookTitle}" returned by ${result.memberName}${fine > 0 ? ` (Overdue fine: ₹${fine})` : ''}.`,
        'Returned'
      );
      return result;
    },
    [circulationCtx, logActivity]
  );

  const renewBook = useCallback(
    async (transactionId, extraDays = 14) => {
      const result = await circulationCtx.renewBook(transactionId, extraDays);
      logActivity(
        'circulation',
        'Loan Extended',
        `Loan for "${result.bookTitle}" (${result.memberName}) renewed until ${result.dueDate}.`,
        `+${extraDays} Days`
      );
      return result;
    },
    [circulationCtx, logActivity]
  );

  const metrics = useMemo(() => {
    const totalBooks = bookCtx.books.length;
    const totalCopies = bookCtx.books.reduce((sum, b) => sum + Number(b.totalCopies ?? 1), 0);
    const totalAvailableCopies = bookCtx.books.reduce(
      (sum, b) => sum + Number(b.availableCopies ?? b.totalCopies ?? 1),
      0
    );
    const booksAvailable = bookCtx.books.filter(
      (b) => Number(b.availableCopies ?? b.totalCopies ?? 1) > 0
    ).length;
    const totalCategories = Array.from(
      new Set(bookCtx.books.map((b) => b.category).filter(Boolean))
    ).length;

    const activeTransactions = circulationCtx.transactions.filter((t) => t.status === 'Active');
    const booksIssued = activeTransactions.length;
    const overdueBooks = activeTransactions.filter((t) => t.dueDate < currentDateStr).length;
    const fineCollected =
      circulationCtx.transactions.reduce((acc, t) => acc + (Number(t.fineAmount) || 0), 0);

    return {
      totalBooks,
      totalCopies,
      totalAvailableCopies,
      totalMembers: memberCtx.members.length,
      booksIssued,
      booksAvailable,
      overdueBooks,
      totalCategories,
      fineCollected,
    };
  }, [bookCtx.books, memberCtx.members.length, circulationCtx.transactions, currentDateStr]);

  const value = useMemo(
    () => ({
      books: bookCtx.books,
      setBooks: bookCtx.setBooks,
      loading: bookCtx.loading || memberCtx.loading,
      error: bookCtx.error || memberCtx.error,
      refreshBooks: bookCtx.refreshBooks,
      searchGoogleBooks: bookCtx.searchGoogleBooks,
      searchLocalBooks: bookCtx.searchLocalBooks,
      addBook,
      updateBook,
      deleteBook,
      members: memberCtx.members,
      setMembers: memberCtx.setMembers,
      refreshMembers: memberCtx.refreshMembers,
      addMember,
      updateMember,
      deleteMember,
      transactions: circulationCtx.transactions,
      setTransactions: circulationCtx.setTransactions,
      issueBook,
      returnBook,
      renewBook,
      activities,
      setActivities,
      logActivity,
      metrics,
    }),
    [
      bookCtx.books,
      bookCtx.setBooks,
      bookCtx.loading,
      bookCtx.error,
      bookCtx.refreshBooks,
      bookCtx.searchGoogleBooks,
      bookCtx.searchLocalBooks,
      addBook,
      updateBook,
      deleteBook,
      memberCtx.members,
      memberCtx.setMembers,
      memberCtx.loading,
      memberCtx.error,
      memberCtx.refreshMembers,
      addMember,
      updateMember,
      deleteMember,
      circulationCtx.transactions,
      circulationCtx.setTransactions,
      issueBook,
      returnBook,
      renewBook,
      activities,
      logActivity,
      metrics,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};

export const LibraryProvider = ({ children }) => {
  return (
    <BookProvider>
      <MemberProvider>
        <CirculationProvider>
          <LibraryContextComposer>{children}</LibraryContextComposer>
        </CirculationProvider>
      </MemberProvider>
    </BookProvider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

export { useBooks, useMembers, useCirculation };
