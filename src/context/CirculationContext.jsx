import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useBooks } from './BookContext';
import { useMembers } from './MemberContext';
import { getVerifiedCover } from '../services/bookService';

const CirculationContext = createContext(null);

const STORAGE_KEY = 'lms_transactions_data_v4';

const INITIAL_TRANSACTIONS = [
  {
    id: 'txn-101',
    transactionId: 'TXN-1001',
    memberId: 'mem-1',
    memberName: 'Emily Johnson',
    memberEmail: 'emily.johnson@x.dummyjson.com',
    memberAvatar: 'https://dummyjson.com/icon/emilys/128',
    bookId: '1',
    bookTitle: 'Code: The Hidden Language of Computer Hardware and Software',
    bookAuthor: 'Charles Petzold',
    bookIsbn: '9780735605053',
    bookCover: 'https://covers.openlibrary.org/b/id/460968-L.jpg',
    bookCategory: 'Computer Science',
    issueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: null,
    status: 'Active',
    fineAmount: 0,
    notes: 'Semester academic curriculum reference',
  },
  {
    id: 'txn-102',
    transactionId: 'TXN-1002',
    memberId: 'mem-2',
    memberName: 'Michael Williams',
    memberEmail: 'michael.williams@x.dummyjson.com',
    memberAvatar: 'https://dummyjson.com/icon/michaelw/128',
    bookId: '2',
    bookTitle: 'Computer Science: An Overview',
    bookAuthor: 'J. Glenn Brookshear',
    bookIsbn: '9780321387011',
    bookCover: 'https://covers.openlibrary.org/b/id/193281-L.jpg',
    bookCategory: 'Computer Science',
    issueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: null,
    status: 'Active',
    fineAmount: 0,
    notes: 'Course study guide volume',
  },
  {
    id: 'txn-103',
    transactionId: 'TXN-1003',
    memberId: 'mem-3',
    memberName: 'Sophia Brown',
    memberEmail: 'sophia.brown@x.dummyjson.com',
    memberAvatar: 'https://dummyjson.com/icon/sophiab/128',
    bookId: '3',
    bookTitle: 'Algorithms to Live By: The Computer Science of Human Decisions',
    bookAuthor: 'Brian Christian',
    bookIsbn: '9780008166090',
    bookCover: 'https://covers.openlibrary.org/b/id/8042539-L.jpg',
    bookCategory: 'Algorithms',
    issueDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Returned',
    fineAmount: 10,
    notes: 'Returned at campus counter (fine cleared)',
  },
  {
    id: 'txn-104',
    transactionId: 'TXN-1004',
    memberId: 'mem-4',
    memberName: 'James Smith',
    memberEmail: 'james.smith@x.dummyjson.com',
    memberAvatar: 'https://dummyjson.com/icon/jamesd/128',
    bookId: '4',
    bookTitle: "Software Engineering: A Practitioner's Approach",
    bookAuthor: 'Roger S. Pressman',
    bookIsbn: '9780079132369',
    bookCover: 'https://covers.openlibrary.org/b/id/66176-L.jpg',
    bookCategory: 'Software Engineering',
    issueDate: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: null,
    status: 'Active',
    fineAmount: 50,
    notes: 'Late return reminder dispatched',
  },
  {
    id: 'txn-105',
    transactionId: 'TXN-1005',
    memberId: 'mem-5',
    memberName: 'Emma Miller',
    memberEmail: 'emma.miller@x.dummyjson.com',
    memberAvatar: 'https://dummyjson.com/icon/emmaj/128',
    bookId: '5',
    bookTitle: 'Structure and Interpretation of Computer Programs',
    bookAuthor: 'Harold Abelson, Gerald Jay Sussman',
    bookIsbn: '9780262011532',
    bookCover: 'https://covers.openlibrary.org/b/id/149338-L.jpg',
    bookCategory: 'Computer Science',
    issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: null,
    status: 'Active',
    fineAmount: 0,
    notes: 'Programming paradigms laboratory reference',
  },
];

const syncTxnCovers = (list) => {
  if (!Array.isArray(list)) return INITIAL_TRANSACTIONS;
  return list.map((t) => ({
    ...t,
    bookCover: getVerifiedCover(t.bookTitle, t.bookIsbn, t.bookAuthor, t.bookCategory, t.bookCover),
  }));
};

const loadTransactionsFromStorage = () => {
  try {
    localStorage.removeItem('lms_transactions_data_v3');
    localStorage.removeItem('lms_transactions_data_v2');
    localStorage.removeItem('lms_transactions_data_v1');
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return INITIAL_TRANSACTIONS;
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length >= 5) {
      return syncTxnCovers(parsed);
    }
    return INITIAL_TRANSACTIONS;
  } catch {
    return INITIAL_TRANSACTIONS;
  }
};

export const CirculationProvider = ({ children }) => {
  const [transactions, setTransactions] = useState(loadTransactionsFromStorage);
  const { books, setBooks } = useBooks();
  const { members, setMembers } = useMembers();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const issueBook = useCallback(
    async ({ memberId, bookId, issueDate, dueDate, notes = '' }) => {
      const member = members.find((m) => String(m.id) === String(memberId));
      if (!member) {
        throw new Error('Selected member not found in registry');
      }
      if (member.status === 'Inactive') {
        throw new Error(`Cannot issue book: Member "${member.fullName}" is marked Inactive`);
      }

      const book = books.find((b) => String(b.id) === String(bookId));
      if (!book) {
        throw new Error('Selected book not found in catalog');
      }

      const availCopies = Number(book.availableCopies ?? book.totalCopies ?? 1);
      if (availCopies <= 0) {
        throw new Error(`"${book.title}" is currently out of stock (0 available copies)`);
      }

      const isDuplicate = transactions.some(
        (t) =>
          (String(t.memberId) === String(memberId) ||
            (member.fullName && t.memberName && t.memberName.toLowerCase() === member.fullName.toLowerCase())) &&
          (String(t.bookId) === String(bookId) ||
            (book.title && t.bookTitle && t.bookTitle.toLowerCase() === book.title.toLowerCase())) &&
          t.status === 'Active'
      );
      if (isDuplicate) {
        throw new Error(
          `Duplicate issue prevented: "${member.fullName}" already has an active copy of "${book.title}"`
        );
      }

      const activeMemberLoans = transactions.filter(
        (t) =>
          (String(t.memberId) === String(memberId) ||
            (member.fullName && t.memberName && t.memberName.toLowerCase() === member.fullName.toLowerCase())) &&
          t.status === 'Active'
      ).length;
      if (activeMemberLoans >= 5) {
        throw new Error(
          `Borrowing quota exceeded: "${member.fullName}" already has 5 active loans`
        );
      }

      const today = new Date().toISOString().split('T')[0];
      const finalIssueDate = issueDate || today;
      const finalDueDate =
        dueDate ||
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const newTxn = {
        id: 'txn-' + Date.now(),
        transactionId: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        memberId: String(member.id),
        memberName: member.fullName,
        memberEmail: member.email,
        memberAvatar: member.avatar,
        bookId: String(book.id),
        bookTitle: book.title,
        bookAuthor: book.author,
        bookIsbn: book.isbn,
        bookCover: book.coverImage,
        bookCategory: book.category,
        issueDate: finalIssueDate,
        dueDate: finalDueDate,
        returnDate: null,
        status: 'Active',
        fineAmount: 0,
        notes: notes || 'Standard circulation loan',
      };

      setTransactions((prev) => [newTxn, ...prev]);

      setBooks((prev) =>
        prev.map((b) => {
          const isMatch =
            String(b.id) === String(bookId) ||
            (b.title && book.title && b.title.trim().toLowerCase() === book.title.trim().toLowerCase());
          if (isMatch) {
            const curAvail = Number(b.availableCopies ?? b.totalCopies ?? 1);
            return {
              ...b,
              availableCopies: Math.max(0, curAvail - 1),
            };
          }
          return b;
        })
      );

      setMembers((prev) =>
        prev.map((m) => {
          const isMatch =
            String(m.id) === String(memberId) ||
            (m.fullName && member.fullName && m.fullName.trim().toLowerCase() === member.fullName.trim().toLowerCase());
          if (isMatch) {
            const curLoans = Number(m.booksIssuedCount) || 0;
            return {
              ...m,
              booksIssuedCount: curLoans + 1,
            };
          }
          return m;
        })
      );

      return newTxn;
    },
    [members, books, transactions, setBooks, setMembers]
  );

  const returnBook = useCallback(
    async (transactionId, returnDate) => {
      const txn = transactions.find((t) => String(t.id) === String(transactionId));
      if (!txn) {
        throw new Error('Transaction record not found');
      }
      if (txn.status === 'Returned') {
        throw new Error('This volume has already been marked as returned');
      }

      const finalReturnDate = returnDate || new Date().toISOString().split('T')[0];
      const isOverdue = finalReturnDate > txn.dueDate;
      let fine = 0;
      if (isOverdue) {
        const diffTime = Math.abs(new Date(finalReturnDate) - new Date(txn.dueDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        fine = diffDays * 10;
      }

      const updatedTxn = {
        ...txn,
        status: 'Returned',
        returnDate: finalReturnDate,
        fineAmount: fine,
      };

      setTransactions((prev) =>
        prev.map((t) => (String(t.id) === String(transactionId) ? updatedTxn : t))
      );

      setBooks((prev) =>
        prev.map((b) => {
          const isMatch =
            String(b.id) === String(txn.bookId) ||
            (b.title && txn.bookTitle && b.title.trim().toLowerCase() === txn.bookTitle.trim().toLowerCase());
          if (isMatch) {
            const total = Number(b.totalCopies) || 12;
            const curAvail = Number(b.availableCopies ?? b.totalCopies ?? 0);
            return {
              ...b,
              availableCopies: Math.min(total, curAvail + 1),
            };
          }
          return b;
        })
      );

      setMembers((prev) =>
        prev.map((m) => {
          const isMatch =
            String(m.id) === String(txn.memberId) ||
            (m.fullName && txn.memberName && m.fullName.trim().toLowerCase() === txn.memberName.trim().toLowerCase());
          if (isMatch) {
            const curLoans = Number(m.booksIssuedCount) || 1;
            return {
              ...m,
              booksIssuedCount: Math.max(0, curLoans - 1),
            };
          }
          return m;
        })
      );

      return updatedTxn;
    },
    [transactions, setBooks, setMembers]
  );

  const renewBook = useCallback(
    async (transactionId, extraDays = 14) => {
      const txn = transactions.find((t) => String(t.id) === String(transactionId));
      if (!txn) {
        throw new Error('Transaction record not found');
      }
      if (txn.status === 'Returned') {
        throw new Error('Cannot renew a book that has already been returned');
      }

      const currentDue = new Date(txn.dueDate);
      const newDueDate = new Date(
        currentDue.getTime() + extraDays * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0];

      const updatedTxn = {
        ...txn,
        dueDate: newDueDate,
        notes: (txn.notes || '') + ` (Extended +${extraDays}d)`,
      };

      setTransactions((prev) =>
        prev.map((t) => (String(t.id) === String(transactionId) ? updatedTxn : t))
      );

      return updatedTxn;
    },
    [transactions]
  );

  return (
    <CirculationContext.Provider
      value={{
        transactions,
        setTransactions,
        issueBook,
        returnBook,
        renewBook,
      }}
    >
      {children}
    </CirculationContext.Provider>
  );
};

export const useCirculation = () => {
  const context = useContext(CirculationContext);
  if (!context) {
    throw new Error('useCirculation must be used within a CirculationProvider');
  }
  return context;
};
