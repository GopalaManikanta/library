import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  BookOpen,
  AlertTriangle,
  Clock,
  RotateCcw,
  Search,
  CheckCircle2,
  BookmarkCheck,
  Receipt,
  Printer,
  GraduationCap,
  IdCard,
  ShieldCheck,
  IndianRupee,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { generateFallbackCover } from '../services/bookService';

export const StudentPortal = () => {
  const { currentUser } = useAuth();
  const {
    books,
    transactions,
    reservations = [],
    reserveBook,
    cancelReservation,
    renewBook,
    issueBook,
    returnBook,
    getTransactionFineInfo,
    dailyFineRate,
    categories,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState('loans');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedReceiptTxn, setSelectedReceiptTxn] = useState(null);
  const [borrowModalBook, setBorrowModalBook] = useState(null);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [returningLoan, setReturningLoan] = useState(null);
  const [isReturning, setIsReturning] = useState(false);
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [defaultDueStr] = useState(
    () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const studentEmail = (currentUser?.email || '').toLowerCase().trim();
  const studentName = currentUser?.name || 'Student';
  const studentId = currentUser?.studentId || currentUser?.membershipId || 'LIB-STU-2026';
  const department = currentUser?.department || 'Computer Science & Engineering';
  const semester = currentUser?.semester || '6th Semester';
  const avatarUrl = currentUser?.avatar || 'https://dummyjson.com/icon/michaelw/128';

  const myTransactions = useMemo(() => {
    return transactions.filter(
      (t) =>
        (studentEmail && t.memberEmail && t.memberEmail.toLowerCase().trim() === studentEmail) ||
        (studentName && t.memberName && t.memberName.toLowerCase().trim() === studentName.toLowerCase().trim()) ||
        (currentUser?.id && String(t.memberId) === String(currentUser.id)) ||
        (currentUser?.membershipId && String(t.memberId) === String(currentUser.membershipId))
    );
  }, [transactions, studentEmail, studentName, currentUser]);

  const myActiveLoans = useMemo(() => {
    return myTransactions.filter((t) => t.status === 'Active');
  }, [myTransactions]);

  const myReturnedLoans = useMemo(() => {
    return myTransactions.filter((t) => t.status === 'Returned');
  }, [myTransactions]);

  const myFines = useMemo(() => {
    return myTransactions
      .map((t) => {
        const info = getTransactionFineInfo(t, todayStr);
        return {
          ...t,
          calculatedFine: info.fineAmount,
          daysOverdue: info.daysOverdue,
          fineStatus: info.fineStatus,
        };
      })
      .filter((t) => t.calculatedFine > 0 || t.fineStatus === 'Paid');
  }, [myTransactions, getTransactionFineInfo, todayStr]);

  const totalUnpaidFines = useMemo(() => {
    return myFines
      .filter((t) => t.fineStatus === 'Unpaid')
      .reduce((sum, t) => sum + (Number(t.calculatedFine) || 0), 0);
  }, [myFines]);

  const overdueLoans = useMemo(() => {
    return myActiveLoans.filter((t) => t.dueDate < todayStr);
  }, [myActiveLoans, todayStr]);

  const dueSoonLoans = useMemo(() => {
    return myActiveLoans.filter((t) => {
      if (t.dueDate < todayStr) return false;
      const diffMs = new Date(t.dueDate).getTime() - new Date(todayStr).getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays <= 4;
    });
  }, [myActiveLoans, todayStr]);

  const myReservations = useMemo(() => {
    return reservations.filter(
      (r) =>
        (r.memberEmail && r.memberEmail.toLowerCase().trim() === studentEmail) ||
        (r.memberName && r.memberName.toLowerCase().trim() === studentName.toLowerCase().trim())
    );
  }, [reservations, studentEmail, studentName]);

  const reservedBookIds = useMemo(() => {
    return new Set(myReservations.map((r) => String(r.bookId)));
  }, [myReservations]);

  const activeLoanBookIds = useMemo(() => {
    return new Set(myActiveLoans.map((l) => String(l.bookId)));
  }, [myActiveLoans]);

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return books.filter((b) => {
      const matchCat =
        selectedCategory === 'All' ||
        (b.category && b.category.toLowerCase() === selectedCategory.toLowerCase());
      if (!matchCat) return false;
      if (!q) return true;
      return (
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.isbn?.toLowerCase().includes(q)
      );
    });
  }, [books, catalogSearch, selectedCategory]);

  const handleStudentRenew = async (txn) => {
    try {
      await renewBook(txn.id, 7);
      toast.success(`Loan for "${txn.bookTitle}" extended by +7 days!`);
    } catch (err) {
      toast.error(err.message || 'Renewal could not be processed');
    }
  };

  const handleStudentBorrow = async (book) => {
    if (activeLoanBookIds.has(String(book.id))) {
      toast.info('You already have an active loan for this book.');
      return;
    }
    if (myActiveLoans.length >= 5) {
      toast.error('Borrowing quota exceeded: Maximum 5 active book loans allowed per student.');
      return;
    }
    setIsBorrowing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await issueBook({
        memberId: currentUser?.id || 'mem-student',
        memberEmail: currentUser?.email || 'student@library.com',
        memberName: currentUser?.name || 'Demo Student',
        membershipId: currentUser?.membershipId || 'LIB-STU-2026',
        bookId: book.id,
        issueDate: today,
        dueDate,
        notes: `Self-checkout via Student Portal by ${currentUser?.name || 'Student'}`,
      });
      const matchingRes = myReservations.find((r) => String(r.bookId) === String(book.id));
      if (matchingRes) {
        cancelReservation(matchingRes.id);
      }
      toast.success(`"${book.title}" checked out successfully! Return by ${dueDate}.`);
      setBorrowModalBook(null);
      setActiveTab('loans');
    } catch (err) {
      toast.error(err.message || 'Failed to borrow book');
    } finally {
      setIsBorrowing(false);
    }
  };

  const handleStudentReturn = async (loan) => {
    setIsReturning(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await returnBook(loan.id, today);
      toast.success(`"${loan.bookTitle}" returned to library shelf successfully!`);
      setReturningLoan(null);
    } catch (err) {
      toast.error(err.message || 'Failed to return book');
    } finally {
      setIsReturning(false);
    }
  };

  const handleStudentReserve = (book) => {
    if (activeLoanBookIds.has(String(book.id))) {
      toast.info('You already have an active loan for this book.');
      return;
    }
    if (reservedBookIds.has(String(book.id))) {
      toast.info('You already placed a reservation for this book.');
      return;
    }
    try {
      reserveBook(currentUser, book);
      toast.success(
        `Volume "${book.title}" reserved! Pick up at Central Library Desk within 3 days.`
      );
    } catch {
      toast.error('Failed to reserve book');
    }
  };

  const handleStudentCancelReserve = (resId) => {
    cancelReservation(resId);
    toast.info('Book reservation cancelled.');
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-teal-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 p-1 ring-2 ring-white/20 shrink-0 shadow-lg overflow-hidden">
              <img
                src={avatarUrl}
                alt={studentName}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Welcome, {studentName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  Student Scholar
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap font-medium">
                <span>{department}</span>
                <span>•</span>
                <span>{semester}</span>
                <span>•</span>
                <span className="font-mono text-teal-300 font-bold">{studentId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('pass')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer backdrop-blur-xs"
            >
              <IdCard className="w-4 h-4 text-teal-300" />
              <span>Digital Library Pass</span>
            </button>
          </div>
        </div>
      </div>

      {overdueLoans.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-rose-950">
                Action Required: {overdueLoans.length} Overdue Book(s)
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                "{overdueLoans[0].bookTitle}" passed its due date ({overdueLoans[0].dueDate}). Fine accrual @ ₹{dailyFineRate}/day. Please return or settle at the circulation counter.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('loans')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
          >
            Review Overdue Loans
          </button>
        </div>
      )}

      {overdueLoans.length === 0 && dueSoonLoans.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs font-bold text-amber-900">
              Reminder: "{dueSoonLoans[0].bookTitle}" is due on {dueSoonLoans[0].dueDate}. Renew online or return before late fees apply.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleStudentRenew(dueSoonLoans[0])}
            className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shrink-0 cursor-pointer"
          >
            Quick Renew (+7d)
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('loans')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeTab === 'loans'
              ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/10 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-teal-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Books in Possession
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{myActiveLoans.length}</span>
            <span className="text-[10px] font-bold text-slate-400">/ 5 Max Limit</span>
          </div>
          <span className="text-[10px] text-teal-700 font-medium block mt-1">Currently issued</span>
        </div>

        <div
          onClick={() => setActiveTab('loans')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            overdueLoans.length > 0
              ? 'bg-rose-50/60 border-rose-300 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-amber-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Due Reminders
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                overdueLoans.length > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                overdueLoans.length > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {overdueLoans.length > 0 ? overdueLoans.length : dueSoonLoans.length}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {overdueLoans.length > 0 ? 'Overdue Books' : 'Due Soon'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">Requires renewal</span>
        </div>

        <div
          onClick={() => setActiveTab('fines')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeTab === 'fines'
              ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/10 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-teal-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Outstanding Dues
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span
              className={`text-2xl font-black ${
                totalUnpaidFines > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              ₹{totalUnpaidFines}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">
            {totalUnpaidFines === 0 ? 'Clean clearance' : 'Pending payment'}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('loans')}
          className="p-5 rounded-2xl border bg-white border-slate-200/90 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Reading Portfolio
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {myTransactions.length}
            </span>
            <span className="text-[10px] font-bold text-slate-400">Total Borrowed</span>
          </div>
          <span className="text-[10px] text-purple-700 font-medium block mt-1">
            {myReturnedLoans.length} Returned Volumes
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'loans'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>My Borrowings ({myActiveLoans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Browse & Reserve Books</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'reservations'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>Reserved Books ({myReservations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fines')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'fines'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>My Dues & Receipts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pass')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'pass'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IdCard className="w-4 h-4" />
          <span>Digital Library Pass</span>
        </button>
      </div>

      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Active Loans on Your Scholar Record
            </h3>
            <span className="text-xs text-slate-400">
              {myActiveLoans.length} volumes currently issued
            </span>
          </div>

          {myActiveLoans.length === 0 ? (
            <div className="py-12 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">No Active Book Loans</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You do not have any books checked out right now. Browse the digital catalog and reserve titles for pickup.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition cursor-pointer"
              >
                Browse Technical Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myActiveLoans.map((loan) => {
                const isOverdue = loan.dueDate < todayStr;
                const fineInfo = getTransactionFineInfo(loan, todayStr);
                const cover =
                  loan.bookCover ||
                  generateFallbackCover(loan.bookTitle, loan.bookAuthor, loan.bookCategory);

                return (
                  <div
                    key={loan.id}
                    className={`p-5 rounded-3xl border transition bg-white flex flex-col justify-between space-y-4 ${
                      isOverdue
                        ? 'border-rose-300 ring-2 ring-rose-500/10 shadow-xs'
                        : 'border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    <div className="flex gap-4">
                      <img
                        src={cover}
                        alt={loan.bookTitle}
                        className="w-20 h-28 object-cover rounded-xl shadow-xs shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = generateFallbackCover(
                            loan.bookTitle,
                            loan.bookAuthor,
                            loan.bookCategory
                          );
                        }}
                      />

                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {loan.bookCategory || 'General'}
                        </span>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 mt-1">
                          {loan.bookTitle}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">By {loan.bookAuthor}</p>
                        <p className="text-[11px] text-slate-400 font-mono">ISBN: {loan.bookIsbn}</p>

                        <div className="pt-2 text-xs">
                          {isOverdue ? (
                            <span className="font-extrabold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 inline-block">
                              Overdue by {fineInfo.daysOverdue} days (Dues: ₹{fineInfo.fineAmount})
                            </span>
                          ) : (
                            <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200 inline-block">
                              Due: {loan.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                      <span className="text-slate-400 font-medium text-[11px]">
                        Issued: <strong className="text-slate-700">{loan.issueDate}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStudentRenew(loan)}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition border border-slate-200 cursor-pointer flex items-center gap-1.5"
                          title="Extend loan by +7 days"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                          <span>Renew</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReturningLoan(loan)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition border border-rose-200 cursor-pointer flex items-center gap-1.5"
                          title="Return book to library shelf"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Return Book</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {myReturnedLoans.length > 0 && (
            <div className="mt-8 space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                Completed Borrowing History ({myReturnedLoans.length})
              </h4>
              <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 text-xs overflow-hidden">
                {myReturnedLoans.map((ret) => (
                  <div key={ret.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{ret.bookTitle}</p>
                      <p className="text-[11px] text-slate-500">
                        Issued: {ret.issueDate} • Returned: {ret.returnDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Returned</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="space-y-5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search technical catalog by title, author, or ISBN..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-teal-600 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'All'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Volumes ({books.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id || c.name}
                  type="button"
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap border ${
                    selectedCategory.toLowerCase() === c.name.toLowerCase()
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map((book) => {
              const cover =
                book.coverImage ||
                generateFallbackCover(book.title, book.author, book.category);
              const avail = Number(book.availableCopies ?? book.totalCopies ?? 0);
              const isReserved = reservedBookIds.has(String(book.id));
              const isBorrowed = activeLoanBookIds.has(String(book.id));

              return (
                <div
                  key={book.id}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-teal-300 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-[3/4] w-full max-h-48 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                      <img
                        src={cover}
                        alt={book.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = generateFallbackCover(
                            book.title,
                            book.author,
                            book.category
                          );
                        }}
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white border border-white/20">
                        {book.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2">
                        {book.title}
                      </h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">By {book.author}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">ISBN: {book.isbn}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">
                        Shelf Stock
                      </span>
                      <span
                        className={`font-black ${
                          avail > 0 ? 'text-teal-700' : 'text-rose-600'
                        }`}
                      >
                        {avail > 0 ? `${avail} In Stock` : 'Out of Stock'}
                      </span>
                    </div>

                    {isBorrowed ? (
                      <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                        Borrowed by You
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {isReserved ? (
                          <span className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                            Reserved
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStudentReserve(book)}
                            disabled={avail === 0}
                            title="Reserve 3-day hold for counter pickup"
                            className="p-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-500 hover:text-amber-700 text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                          >
                            <BookmarkCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px]">Hold</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setBorrowModalBook(book)}
                          disabled={avail === 0}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Borrow</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Active Book Pick-Up Holds
            </h3>
            <span className="text-xs text-slate-400">
              {myReservations.length} active reservations
            </span>
          </div>

          {myReservations.length === 0 ? (
            <div className="py-12 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <BookmarkCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">No Active Book Reservations</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Browse our library catalog and hit "Reserve Volume" to place a 3-day hold for counter pickup.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition cursor-pointer"
              >
                Explore Books Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="flex gap-4">
                    <img
                      src={res.bookCover || generateFallbackCover(res.bookTitle, res.bookAuthor, '')}
                      alt={res.bookTitle}
                      className="w-16 h-24 object-cover rounded-xl shadow-xs shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = generateFallbackCover(res.bookTitle, res.bookAuthor, '');
                      }}
                    />
                    <div className="min-w-0 flex-1 space-y-1 text-xs">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {res.status}
                      </span>
                      <h4 className="font-extrabold text-slate-900 line-clamp-2 mt-1">
                        {res.bookTitle}
                      </h4>
                      <p className="text-slate-500 truncate">By {res.bookAuthor}</p>
                      <p className="text-[11px] text-teal-700 font-medium">
                        Pickup: {res.pickupLocation}
                      </p>
                      <p className="text-[11px] text-slate-400">Hold expires: {res.holdExpiresDate}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                    <span className="text-[11px] font-mono text-slate-400">Ref: {res.reservationId}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStudentCancelReserve(res.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                      >
                        Cancel Hold
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const targetBook = books.find((b) => String(b.id) === String(res.bookId));
                          if (targetBook) {
                            setBorrowModalBook(targetBook);
                          } else {
                            toast.error('Book volume details not found in catalog.');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Check Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'fines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Late Assessment & Settlement Ledger
            </h3>
            <span className="text-xs text-slate-400 font-mono">Rate: ₹{dailyFineRate}/day</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Unpaid Dues</span>
                <span className="text-2xl font-black text-rose-600 font-mono">₹{totalUnpaidFines}</span>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span>Settlement at: Central Library Desk Counter 1</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">UPI / Cash accepted</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {myFines.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No Fines on Your Record</p>
                  <p className="text-[11px]">All previous volumes were returned on schedule.</p>
                </div>
              ) : (
                myFines.map((f) => (
                  <div key={f.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{f.bookTitle}</p>
                      <p className="text-[11px] text-slate-500">
                        Scheduled Due: {f.dueDate} • {f.daysOverdue} days overdue
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-slate-900 block text-sm">
                        ₹{f.calculatedFine || f.fineAmount}
                      </span>
                      {f.fineStatus === 'Paid' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptTxn(f)}
                          className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                        >
                          View Receipt #{f.fineReceiptNo || 'PAID'}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Unpaid Dues
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pass' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Official Digital Student Library Pass
              </h3>
              <p className="text-xs text-slate-500">
                Show this barcode card at campus library access turnstiles and circulation desks
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrintCard}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Library Pass</span>
            </button>
          </div>

          <div className="max-w-md mx-auto p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white shadow-xl border border-white/20 relative overflow-hidden space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-black text-white text-base">
                  LF
                </div>
                <div>
                  <h4 className="font-black text-sm tracking-tight text-white leading-none">
                    LIBRAFLOW UNIVERSITY
                  </h4>
                  <span className="text-[9px] uppercase tracking-widest text-teal-300 font-bold">
                    Central Academic Library
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                STUDENT PASS
              </span>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={avatarUrl}
                alt={studentName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-teal-400/40 bg-white/10 shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-black text-base text-white truncate">{studentName}</h3>
                <p className="text-xs text-teal-300 font-mono font-bold mt-0.5">{studentId}</p>
                <p className="text-[11px] text-slate-300 truncate">{department}</p>
                <p className="text-[10px] text-slate-400">{semester} • Active Scholar</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Library Card No:</span>
                <span className="font-mono font-bold text-white">8829-1092-2026</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Valid Through:</span>
                <span className="font-mono font-bold text-teal-300">July 31, 2027</span>
              </div>

              <div className="pt-3 flex flex-col items-center justify-center">
                <div className="w-full h-10 bg-white rounded-md p-1 flex items-center justify-between px-3">
                  <div className="w-full flex justify-between h-full items-center">
                    {Array.from({ length: 36 }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-full bg-slate-900 ${
                          idx % 3 === 0 ? 'w-1' : idx % 2 === 0 ? 'w-0.5' : 'w-1.5'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="font-mono text-[9px] text-slate-400 tracking-widest mt-1">
                  * {studentId} *
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReceiptTxn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setSelectedReceiptTxn(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Settlement Slip
              </span>
              <button
                type="button"
                onClick={() => setSelectedReceiptTxn(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="text-center space-y-1">
              <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </span>
              <h4 className="font-black text-slate-900 text-base">Fine Clearance Slip</h4>
              <p className="text-xs text-slate-500 font-mono">
                Receipt #{selectedReceiptTxn.fineReceiptNo || 'REC-STU-9901'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Volume:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">
                  {selectedReceiptTxn.bookTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ₹{selectedReceiptTxn.fineAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-mono text-slate-700">{selectedReceiptTxn.finePaidDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Channel:</span>
                <span className="font-bold text-slate-800">
                  {selectedReceiptTxn.paymentMethod || 'UPI'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {borrowModalBook && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200/90 shadow-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200/60 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Confirm Book Checkout</h3>
                  <p className="text-xs text-slate-500">Self-service digital borrowing confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBorrowModalBook(null)}
                className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <img
                src={
                  borrowModalBook.coverImage ||
                  generateFallbackCover(
                    borrowModalBook.title,
                    borrowModalBook.author,
                    borrowModalBook.category
                  )
                }
                alt={borrowModalBook.title}
                className="w-20 h-28 object-cover rounded-xl shadow-xs shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = generateFallbackCover(
                    borrowModalBook.title,
                    borrowModalBook.author,
                    borrowModalBook.category
                  );
                }}
              />
              <div className="min-w-0 flex-1 space-y-1 text-xs">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {borrowModalBook.category || 'General'}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2 mt-1">
                  {borrowModalBook.title}
                </h4>
                <p className="text-slate-600">By {borrowModalBook.author}</p>
                <p className="text-[11px] text-slate-400 font-mono">ISBN: {borrowModalBook.isbn}</p>
                <p className="text-[11px] text-teal-700 font-semibold">
                  Available Copies: {borrowModalBook.availableCopies ?? borrowModalBook.totalCopies}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Issue Date</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{todayStr}</span>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                <span className="text-teal-600 text-[10px] font-bold uppercase block">Return Due Date</span>
                <span className="font-extrabold text-teal-900 mt-0.5 block">
                  {defaultDueStr} (14d)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] leading-relaxed">
                <p className="font-bold">Library Lending Terms:</p>
                <p>
                  Please return or renew before the due date. A late assessment of ₹{dailyFineRate}/day applies
                  to books kept past the due date.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBorrowModalBook(null)}
                disabled={isBorrowing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStudentBorrow(borrowModalBook)}
                disabled={isBorrowing}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-extrabold transition shadow-md shadow-teal-600/20 cursor-pointer flex items-center gap-2"
              >
                {isBorrowing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Checkout...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Take Book</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {returningLoan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200/90 shadow-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60 shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Return Book to Library</h3>
                  <p className="text-xs text-slate-500">Check-in volume and restore shelf inventory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReturningLoan(null)}
                className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <img
                src={
                  returningLoan.bookCover ||
                  generateFallbackCover(
                    returningLoan.bookTitle,
                    returningLoan.bookAuthor,
                    returningLoan.bookCategory
                  )
                }
                alt={returningLoan.bookTitle}
                className="w-20 h-28 object-cover rounded-xl shadow-xs shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = generateFallbackCover(
                    returningLoan.bookTitle,
                    returningLoan.bookAuthor,
                    returningLoan.bookCategory
                  );
                }}
              />
              <div className="min-w-0 flex-1 space-y-1 text-xs">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {returningLoan.bookCategory || 'General'}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2 mt-1">
                  {returningLoan.bookTitle}
                </h4>
                <p className="text-slate-600">By {returningLoan.bookAuthor}</p>
                <p className="text-[11px] text-slate-400 font-mono">ISBN: {returningLoan.bookIsbn}</p>
                <p className="text-[11px] text-slate-500 font-mono">Txn Ref: {returningLoan.transactionId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Issued On</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{returningLoan.issueDate}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 text-[10px] font-bold uppercase block">Return Date</span>
                <span className="font-extrabold text-emerald-900 mt-0.5 block">{todayStr}</span>
              </div>
            </div>

            {returningLoan.dueDate < todayStr ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px]">
                  <p className="font-bold">Overdue Return Notice:</p>
                  <p>
                    This book was due on <strong>{returningLoan.dueDate}</strong>. Late assessment of ₹
                    {getTransactionFineInfo(returningLoan, todayStr).fineAmount} will be recorded on your scholar ledger.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px]">
                  <p className="font-bold">On-Time Return:</p>
                  <p>Returned before the due date. No late assessment charges apply (₹0 Dues).</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReturningLoan(null)}
                disabled={isReturning}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Keep Book
              </button>
              <button
                type="button"
                onClick={() => handleStudentReturn(returningLoan)}
                disabled={isReturning}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold transition shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-2"
              >
                {isReturning ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Return...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Return Book</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
