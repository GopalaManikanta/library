import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useBooks } from './BookContext';
import { useMembers } from './MemberContext';
import { getVerifiedCover } from '../services/bookService';

const CirculationContext = createContext(null);

export const DAILY_FINE_RATE = 10;

export const getTransactionFineInfo = (txn, todayStr = new Date().toISOString().split('T')[0]) => {
  if (!txn) {
    return {
      fineAmount: 0,
      daysOverdue: 0,
      isOverdue: false,
      fineStatus: 'None',
      dailyRate: DAILY_FINE_RATE,
    };
  }

  const dueDate = txn.dueDate;
  if (!dueDate) {
    return {
      fineAmount: Number(txn.fineAmount) || 0,
      daysOverdue: 0,
      isOverdue: false,
      fineStatus: txn.fineStatus || (Number(txn.fineAmount) > 0 ? 'Unpaid' : 'None'),
      dailyRate: DAILY_FINE_RATE,
    };
  }

  const effectiveEndDate = txn.status === 'Returned' && txn.returnDate ? txn.returnDate : todayStr;
  const isOverdue = effectiveEndDate > dueDate;

  let daysOverdue = 0;
  let calculatedFine = 0;

  if (isOverdue) {
    const diffTime = new Date(effectiveEndDate).getTime() - new Date(dueDate).getTime();
    daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    calculatedFine = daysOverdue * DAILY_FINE_RATE;
  }

  const fineAmount = Math.max(calculatedFine, Number(txn.fineAmount) || 0);
  let fineStatus = txn.fineStatus;
  if (!fineStatus) {
    if (fineAmount > 0) {
      fineStatus = txn.status === 'Returned' ? 'Paid' : 'Unpaid';
    } else {
      fineStatus = 'None';
    }
  }

  return {
    fineAmount,
    daysOverdue,
    isOverdue,
    fineStatus,
    dailyRate: DAILY_FINE_RATE,
  };
};

const STORAGE_KEY = 'lms_transactions_data_v6';

const INITIAL_TRANSACTIONS = [
  {
    id: 'txn-stu-1',
    transactionId: 'TXN-9001',
    memberId: 'mem-student',
    memberName: 'Demo Student',
    memberEmail: 'student@library.com',
    memberAvatar: 'https://dummyjson.com/icon/michaelw/128',
    bookId: '1',
    bookTitle: 'Code: The Hidden Language of Computer Hardware and Software',
    bookAuthor: 'Charles Petzold',
    bookIsbn: '9780735605053',
    bookCover: 'https://covers.openlibrary.org/b/id/460968-L.jpg',
    bookCategory: 'Computer Science',
    issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: null,
    status: 'Active',
    fineAmount: 0,
    fineStatus: 'None',
    finePaidDate: null,
    paymentMethod: null,
    fineReceiptNo: null,
    notes: 'Semester study guide volume',
  },
  {
    id: 'txn-stu-2',
    transactionId: 'TXN-9002',
    memberId: 'mem-student',
    memberName: 'Demo Student',
    memberEmail: 'student@library.com',
    memberAvatar: 'https://dummyjson.com/icon/michaelw/128',
    bookId: '2',
    bookTitle: 'Computer Science: An Overview',
    bookAuthor: 'J. Glenn Brookshear',
    bookIsbn: '9780321387011',
    bookCover: 'https://covers.openlibrary.org/b/id/193281-L.jpg',
    bookCategory: 'Computer Science',
    issueDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: null,
    status: 'Active',
    fineAmount: 20,
    fineStatus: 'Unpaid',
    finePaidDate: null,
    paymentMethod: null,
    fineReceiptNo: null,
    notes: 'Late volume assessment (overdue by 2 days)',
  },
  {
    id: 'txn-stu-3',
    transactionId: 'TXN-9003',
    memberId: 'mem-student',
    memberName: 'Demo Student',
    memberEmail: 'student@library.com',
    memberAvatar: 'https://dummyjson.com/icon/michaelw/128',
    bookId: '3',
    bookTitle: 'Algorithms to Live By: The Computer Science of Human Decisions',
    bookAuthor: 'Brian Christian',
    bookIsbn: '9780008166090',
    bookCover: 'https://covers.openlibrary.org/b/id/8042539-L.jpg',
    bookCategory: 'Algorithms',
    issueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Returned',
    fineAmount: 10,
    fineStatus: 'Paid',
    finePaidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'UPI',
    fineReceiptNo: 'REC-STU-9901',
    notes: 'Settled at central library counter',
  },
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
    fineStatus: 'None',
    finePaidDate: null,
    paymentMethod: null,
    fineReceiptNo: null,
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
    fineStatus: 'None',
    finePaidDate: null,
    paymentMethod: null,
    fineReceiptNo: null,
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
    fineStatus: 'Paid',
    finePaidDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'UPI',
    fineReceiptNo: 'REC-5401',
    notes: 'Returned at campus desk (fine cleared via UPI)',
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
    fineStatus: 'Unpaid',
    finePaidDate: null,
    paymentMethod: null,
    fineReceiptNo: null,
    notes: 'Overdue loan notice dispatched (5 days late)',
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
    fineStatus: 'None',
    finePaidDate: null,
    paymentMethod: null,
    fineReceiptNo: null,
    notes: 'Programming paradigms laboratory reference',
  },
  {
    id: 'txn-106',
    transactionId: 'TXN-1006',
    memberId: 'mem-1',
    memberName: 'Emily Johnson',
    memberEmail: 'emily.johnson@x.dummyjson.com',
    memberAvatar: 'https://dummyjson.com/icon/emilys/128',
    bookId: '6',
    bookTitle: 'The Art of Computer Programming',
    bookAuthor: 'Donald Knuth',
    bookIsbn: '9780201853926',
    bookCover: 'https://covers.openlibrary.org/b/id/136600-L.jpg',
    bookCategory: 'Algorithms',
    issueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Returned',
    fineAmount: 40,
    fineStatus: 'Paid',
    finePaidDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'Cash',
    fineReceiptNo: 'REC-4820',
    notes: 'Returned at desk and late fine paid in cash',
  },
  {
    id: 'txn-107',
    transactionId: 'TXN-1007',
    memberId: 'mem-2',
    memberName: 'Michael Williams',
    memberEmail: 'michael.williams@x.dummyjson.com',
    memberAvatar: 'https://dummyjson.com/icon/michaelw/128',
    bookId: '7',
    bookTitle: 'Introduction to Algorithms (CLRS)',
    bookAuthor: 'Thomas H. Cormen',
    bookIsbn: '9780262033848',
    bookCover: 'https://covers.openlibrary.org/b/id/2341462-L.jpg',
    bookCategory: 'Algorithms',
    issueDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: null,
    status: 'Active',
    fineAmount: 80,
    fineStatus: 'Unpaid',
    finePaidDate: null,
    paymentMethod: null,
    fineReceiptNo: null,
    notes: 'Urgent reminder dispatched for overdue monograph',
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
    localStorage.removeItem('lms_transactions_data_v4');
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
    async ({
      memberId,
      memberEmail = '',
      memberName = '',
      membershipId = '',
      bookId,
      issueDate,
      dueDate,
      notes = ''
    }) => {
      const cleanMemberId = String(memberId || '').trim();
      const cleanEmail = String(memberEmail || '').trim().toLowerCase();
      const cleanName = String(memberName || '').trim().toLowerCase();
      const cleanMembershipId = String(membershipId || '').trim().toLowerCase();

      const isMatch = (m) => {
        if (!m) return false;
        const mId = String(m.id || '').trim();
        const mEmail = String(m.email || '').trim().toLowerCase();
        const mName = String(m.fullName || m.name || '').trim().toLowerCase();
        const mCode = String(m.membershipId || '').trim().toLowerCase();

        if (cleanMemberId && (mId === cleanMemberId || mEmail === cleanMemberId.toLowerCase() || mCode === cleanMemberId.toLowerCase() || mName === cleanMemberId.toLowerCase())) {
          return true;
        }
        if (cleanEmail && mEmail === cleanEmail) {
          return true;
        }
        if (cleanMembershipId && (mCode === cleanMembershipId || mId.toLowerCase() === cleanMembershipId)) {
          return true;
        }
        if (cleanName && mName === cleanName) {
          return true;
        }
        if ((cleanMemberId === 'u-2' || cleanMemberId === 'mem-student' || cleanEmail === 'student@library.com' || cleanName.includes('demo student')) &&
            (mId === 'mem-student' || mEmail === 'student@library.com')) {
          return true;
        }
        return false;
      };

      let member = members.find(isMatch);

      if (!member) {
        try {
          const cached = localStorage.getItem('lms_members_dummyjson_data_v2');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              member = parsed.find(isMatch);
            }
          }
        } catch {}
      }

      if (!member) {
        try {
          const userStorage = localStorage.getItem('lms_users_db_v2');
          if (userStorage) {
            const users = JSON.parse(userStorage);
            const foundUser = users.find(
              (u) =>
                String(u.id) === cleanMemberId ||
                (u.email && u.email.toLowerCase() === cleanMemberId.toLowerCase()) ||
                (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
                (cleanName && u.name && u.name.toLowerCase() === cleanName)
            );
            if (foundUser) {
              member = {
                id: String(foundUser.id || cleanMemberId || 'mem-student'),
                membershipId: foundUser.membershipId || `LIB-MEM-${foundUser.id}`,
                fullName: foundUser.name || 'Library Member',
                name: foundUser.name || 'Library Member',
                email: (foundUser.email || 'student@library.com').toLowerCase(),
                status: 'Active',
                avatar: foundUser.avatar || 'https://dummyjson.com/icon/michaelw/128',
                department: foundUser.department || 'Computer Science & Engineering',
                semester: foundUser.semester || '6th Semester',
                booksIssuedCount: 0,
              };
              setMembers((prev) => [member, ...prev]);
            }
          }
        } catch {}
      }

      if (!member && (cleanMemberId === 'u-2' || cleanMemberId === 'mem-student' || cleanMemberId.startsWith('u-') || cleanEmail.includes('student') || !cleanMemberId)) {
        member = {
          id: cleanMemberId || 'mem-student',
          membershipId: cleanMembershipId || 'LIB-STU-2026',
          fullName: memberName || 'Demo Student',
          name: memberName || 'Demo Student',
          email: cleanEmail || 'student@library.com',
          status: 'Active',
          avatar: 'https://dummyjson.com/icon/michaelw/128',
          department: 'Computer Science & Engineering',
          semester: '6th Semester',
          booksIssuedCount: 0,
        };
        setMembers((prev) => [member, ...prev]);
      }

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
        fineStatus: 'None',
        finePaidDate: null,
        paymentMethod: null,
        fineReceiptNo: null,
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
    async (transactionId, returnDate, collectFine = false, paymentMethod = 'Cash') => {
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
        fine = diffDays * DAILY_FINE_RATE;
      }

      const receiptNo = fine > 0 && collectFine ? `REC-${Math.floor(1000 + Math.random() * 9000)}` : txn.fineReceiptNo;
      const updatedTxn = {
        ...txn,
        status: 'Returned',
        returnDate: finalReturnDate,
        fineAmount: fine,
        fineStatus: fine > 0 ? (collectFine ? 'Paid' : 'Unpaid') : 'None',
        finePaidDate: fine > 0 && collectFine ? finalReturnDate : null,
        paymentMethod: fine > 0 && collectFine ? paymentMethod : null,
        fineReceiptNo: receiptNo,
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

  const payFine = useCallback(
    async (transactionId, { paymentMethod = 'Cash', amountPaid, notes = '' } = {}) => {
      const txn = transactions.find((t) => String(t.id) === String(transactionId));
      if (!txn) {
        throw new Error('Transaction record not found');
      }

      const today = new Date().toISOString().split('T')[0];
      const fineInfo = getTransactionFineInfo(txn, today);
      const finalAmount = Number(amountPaid) > 0 ? Number(amountPaid) : fineInfo.fineAmount;

      if (finalAmount <= 0) {
        throw new Error('No outstanding fine amount for this record');
      }

      const receiptNo = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
      const updatedTxn = {
        ...txn,
        fineAmount: finalAmount,
        fineStatus: 'Paid',
        finePaidDate: today,
        paymentMethod: paymentMethod || 'Cash',
        fineReceiptNo: receiptNo,
        notes: notes ? `${txn.notes ? txn.notes + ' | ' : ''}${notes}` : txn.notes,
      };

      setTransactions((prev) =>
        prev.map((t) => (String(t.id) === String(transactionId) ? updatedTxn : t))
      );

      return updatedTxn;
    },
    [transactions]
  );

  const waiveFine = useCallback(
    async (transactionId, reason = 'Administrative Waiver') => {
      const txn = transactions.find((t) => String(t.id) === String(transactionId));
      if (!txn) {
        throw new Error('Transaction record not found');
      }

      const updatedTxn = {
        ...txn,
        fineAmount: 0,
        fineStatus: 'Waived',
        notes: `${txn.notes ? txn.notes + ' | ' : ''}Fine waived: ${reason}`,
      };

      setTransactions((prev) =>
        prev.map((t) => (String(t.id) === String(transactionId) ? updatedTxn : t))
      );

      return updatedTxn;
    },
    [transactions]
  );

  const [reservations, setReservations] = useState(() => {
    try {
      const data = localStorage.getItem('lms_book_reservations_v1');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('lms_book_reservations_v1', JSON.stringify(reservations));
  }, [reservations]);

  const reserveBook = useCallback((user, book) => {
    const newReservation = {
      id: 'res-' + Date.now(),
      reservationId: 'RES-' + Math.floor(1000 + Math.random() * 9000),
      bookId: String(book.id),
      bookTitle: book.title,
      bookAuthor: book.author,
      bookCover: book.coverImage,
      memberId: user.studentId || user.membershipId || user.id,
      memberName: user.name,
      memberEmail: user.email,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Ready for Pickup',
      pickupLocation: 'Central Library Counter 2',
      holdExpiresDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setReservations((prev) => [newReservation, ...prev]);
    return newReservation;
  }, []);

  const cancelReservation = useCallback((resId) => {
    setReservations((prev) => prev.filter((r) => r.id !== resId));
  }, []);

  const value = useMemo(
    () => ({
      transactions,
      setTransactions,
      reservations,
      reserveBook,
      cancelReservation,
      issueBook,
      returnBook,
      renewBook,
      payFine,
      waiveFine,
      getTransactionFineInfo,
      DAILY_FINE_RATE,
    }),
    [
      transactions,
      reservations,
      reserveBook,
      cancelReservation,
      issueBook,
      returnBook,
      renewBook,
      payFine,
      waiveFine,
    ]
  );

  return (
    <CirculationContext.Provider value={value}>
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
