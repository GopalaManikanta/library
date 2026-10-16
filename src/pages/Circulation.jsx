import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BookOpen,
  Search,
  Plus,
  ArrowLeftRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  IdCard,
  Menu,
  ShieldCheck,
  BookCheck,
  Eye,
  IndianRupee,
  Receipt,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Sidebar } from '../components/Sidebar';
import {
  CirculationDetailsFullPage,
  CirculationPayFineFullPage,
  CirculationReturnFullPage,
  CirculationIssueFullPage,
} from '../components/CirculationActions';
import { CirculationReceiptFullPage } from '../components/FineReceipt';
import { generateFallbackCover } from '../services/bookService';

export const Circulation = () => {
  const {
    books,
    members,
    transactions,
    issueBook,
    returnBook,
    renewBook,
    payFine,
    waiveFine,
    getTransactionFineInfo,
    dailyFineRate,
  } = useLibrary();

  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return searchParams.get('action') === 'issue' ? 'issue' : 'list';
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [payingTransaction, setPayingTransaction] = useState(null);
  const [receiptTransaction, setReceiptTransaction] = useState(null);

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'fines') return 'fines';
    if (tabParam === 'overdue') return 'overdue';
    if (tabParam === 'history') return 'history';
    return 'active';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [finePaymentFilter, setFinePaymentFilter] = useState('All');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);

  const stats = useMemo(() => {
    const active = transactions.filter((t) => t.status === 'Active');
    const returned = transactions.filter((t) => t.status === 'Returned');
    const overdue = active.filter((t) => t.dueDate < todayStr);

    const withFines = transactions.filter((t) => {
      const info = getTransactionFineInfo(t, todayStr);
      return info.fineAmount > 0;
    });

    const paidFines = transactions.filter((t) => t.fineStatus === 'Paid');
    const unpaidFines = withFines.filter((t) => t.fineStatus === 'Unpaid');

    const totalCollectedAmount = paidFines.reduce(
      (sum, t) => sum + (Number(t.fineAmount) || 0),
      0
    );
    const totalPendingAmount = unpaidFines.reduce((sum, t) => {
      const info = getTransactionFineInfo(t, todayStr);
      return sum + info.fineAmount;
    }, 0);

    const availableBooks = books.reduce(
      (sum, b) => sum + Number(b.availableCopies ?? b.totalCopies ?? 0),
      0
    );

    return {
      activeLoans: active.length,
      overdueLoans: overdue.length,
      returnedLoans: returned.length,
      fineRecordsCount: withFines.length,
      paidFinesCount: paidFines.length,
      unpaidFinesCount: unpaidFines.length,
      totalCollectedAmount,
      totalPendingAmount,
      availableBooks,
    };
  }, [transactions, books, todayStr, getTransactionFineInfo]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const fineInfo = getTransactionFineInfo(t, todayStr);

        if (activeTab === 'active' && t.status !== 'Active') return false;
        if (activeTab === 'overdue' && (t.status !== 'Active' || t.dueDate >= todayStr)) return false;
        if (activeTab === 'fines') {
          if (fineInfo.fineAmount <= 0) return false;
          if (finePaymentFilter === 'Paid' && t.fineStatus !== 'Paid') return false;
          if (finePaymentFilter === 'Unpaid' && t.fineStatus !== 'Unpaid') return false;
        }

        if (statusFilter === 'Active' && t.status !== 'Active') return false;
        if (statusFilter === 'Returned' && t.status !== 'Returned') return false;
        if (statusFilter === 'Overdue' && (t.status !== 'Active' || t.dueDate >= todayStr)) return false;

        if (selectedMemberFilter !== 'All') {
          const mMatch =
            String(t.memberId) === String(selectedMemberFilter) ||
            t.memberName?.toLowerCase() === selectedMemberFilter.toLowerCase();
          if (!mMatch) return false;
        }

        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;

        return (
          t.transactionId?.toLowerCase().includes(q) ||
          t.fineReceiptNo?.toLowerCase().includes(q) ||
          t.memberName?.toLowerCase().includes(q) ||
          t.memberEmail?.toLowerCase().includes(q) ||
          t.memberId?.toLowerCase().includes(q) ||
          t.bookTitle?.toLowerCase().includes(q) ||
          t.bookAuthor?.toLowerCase().includes(q) ||
          t.bookIsbn?.toLowerCase().includes(q) ||
          t.bookCategory?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (activeTab === 'overdue') {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (activeTab === 'fines') {
          const aInfo = getTransactionFineInfo(a, todayStr);
          const bInfo = getTransactionFineInfo(b, todayStr);
          if (a.fineStatus === 'Unpaid' && b.fineStatus === 'Paid') return -1;
          if (a.fineStatus === 'Paid' && b.fineStatus === 'Unpaid') return 1;
          return bInfo.fineAmount - aInfo.fineAmount;
        }
        if (a.status === 'Active' && a.dueDate < todayStr) return -1;
        if (b.status === 'Active' && b.dueDate < todayStr) return 1;
        return new Date(b.issueDate) - new Date(a.issueDate);
      });
  }, [
    transactions,
    activeTab,
    statusFilter,
    finePaymentFilter,
    selectedMemberFilter,
    searchQuery,
    todayStr,
    getTransactionFineInfo,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const handleCopyId = (idStr) => {
    if (idStr) {
      navigator.clipboard.writeText(idStr);
      toast.success('ID copied to clipboard!');
    }
  };

  const handleQuickRenew = async (txn) => {
    try {
      await renewBook(txn.id, 14);
      toast.success(`Loan extended +14 days for "${txn.bookTitle}"!`);
    } catch (err) {
      toast.error(err.message || 'Failed to renew book');
    }
  };

  const handleOpenDetails = (txn) => {
    setSelectedTransaction(txn);
    setViewMode('details');
  };

  const handleOpenReturn = (txn) => {
    setSelectedTransaction(txn);
    setViewMode('return');
  };

  const handleOpenPayFine = (txn) => {
    setPayingTransaction(txn);
    setViewMode('pay-fine');
  };

  const handleOpenReceipt = (txn) => {
    setReceiptTransaction(txn);
    setViewMode('receipt');
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc] text-slate-800 flex font-sans">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {viewMode === 'list' && (
          <>
            <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    Circulation Desk & Fine Ledger
                  </h1>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Issue volumes, process returns, track overdue loans, and collect fine dues
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewMode('issue')}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue New Book</span>
                </button>
              </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => {
                    setActiveTab('active');
                    setStatusFilter('All');
                    setCurrentPage(1);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'active'
                      ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/10 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-teal-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Active Borrowings
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{stats.activeLoans}</span>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
                      In Circulation
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Patrons with books</span>
                </div>

                <div
                  onClick={() => {
                    setActiveTab('overdue');
                    setCurrentPage(1);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'overdue'
                      ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/10 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-rose-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Overdue Books
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-rose-600">{stats.overdueLoans}</span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                      Past Due
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Accumulating ₹10/day</span>
                </div>

                <div
                  onClick={() => {
                    setActiveTab('fines');
                    setFinePaymentFilter('All');
                    setCurrentPage(1);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'fines'
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/10 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-amber-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Fine Ledger
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">₹{stats.totalCollectedAmount}</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                      Collected
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
                    ₹{stats.totalPendingAmount} pending collection
                  </span>
                </div>

                <div
                  onClick={() => {
                    setActiveTab('history');
                    setStatusFilter('All');
                    setCurrentPage(1);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-emerald-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Total History
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{transactions.length}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                      Cycles
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {stats.returnedLoans} returned volumes
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs w-fit overflow-x-auto">
                    <button
                      onClick={() => {
                        setActiveTab('active');
                        setStatusFilter('All');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'active'
                          ? 'bg-white text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-teal-600" />
                      <span>Active Loans ({stats.activeLoans})</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('overdue');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'overdue'
                          ? 'bg-white text-rose-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Overdue List ({stats.overdueLoans})</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('fines');
                        setFinePaymentFilter('All');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'fines'
                          ? 'bg-white text-amber-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                      <span>Fine Management & History ({stats.fineRecordsCount})</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('history');
                        setStatusFilter('All');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'history'
                          ? 'bg-white text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Complete History ({transactions.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {activeTab === 'fines' && (
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                        <button
                          onClick={() => {
                            setFinePaymentFilter('All');
                            setCurrentPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                            finePaymentFilter === 'All'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All Fines
                        </button>
                        <button
                          onClick={() => {
                            setFinePaymentFilter('Unpaid');
                            setCurrentPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                            finePaymentFilter === 'Unpaid'
                              ? 'bg-rose-50 text-rose-700 shadow-2xs border border-rose-200'
                              : 'text-slate-600 hover:text-rose-700'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Unpaid ({stats.unpaidFinesCount})</span>
                        </button>
                        <button
                          onClick={() => {
                            setFinePaymentFilter('Paid');
                            setCurrentPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                            finePaymentFilter === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200'
                              : 'text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Paid ({stats.paidFinesCount})</span>
                        </button>
                      </div>
                    )}

                    <select
                      value={selectedMemberFilter}
                      onChange={(e) => {
                        setSelectedMemberFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[180px]"
                    >
                      <option value="All">All Patrons</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.fullName}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>

                    {activeTab === 'history' && (
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="All">All Loan Statuses</option>
                        <option value="Active">Active Only</option>
                        <option value="Returned">Returned Only</option>
                        <option value="Overdue">Overdue Only</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={
                      activeTab === 'fines'
                        ? 'Search fines by patron name, ID, receipt number, book title, or email...'
                        : 'Search by patron name, membership ID, email, book title, or ISBN...'
                    }
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/15 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {activeTab === 'overdue' && stats.overdueLoans > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-700">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-rose-900">
                        {stats.overdueLoans} Book Loans Are Past Due Date
                      </p>
                      <p className="text-rose-700 text-[11px] mt-0.5">
                        Automatic late fines are calculated at ₹{dailyFineRate}/day. Collect fines or process returns immediately.
                      </p>
                    </div>
                  </div>
                  <span className="font-bold px-3 py-1 bg-white rounded-xl border border-rose-200 text-rose-700 shadow-2xs">
                    ₹{stats.totalPendingAmount} Total Uncollected
                  </span>
                </div>
              )}

              {paginatedTransactions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <BookCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {activeTab === 'overdue'
                      ? 'No Overdue Books Currently!'
                      : activeTab === 'fines'
                      ? 'No Fine Records Found'
                      : 'No circulation records found'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {activeTab === 'overdue'
                      ? 'All active borrowings are currently within their scheduled return due dates.'
                      : activeTab === 'fines'
                      ? 'No overdue fines match the selected payment status or search criteria.'
                      : 'There are currently no records matching your query.'}
                  </p>
                  {activeTab !== 'fines' && activeTab !== 'overdue' && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => setViewMode('issue')}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer"
                      >
                        + Issue Book Now
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedTransactions.map((txn) => {
                    const isOverdue = txn.status === 'Active' && txn.dueDate < todayStr;
                    const isReturned = txn.status === 'Returned';
                    const fineInfo = getTransactionFineInfo(txn, todayStr);

                    return (
                      <div
                        key={txn.id}
                        className={`bg-white rounded-2xl border p-4 sm:p-5 transition shadow-2xs hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                          isOverdue
                            ? 'border-rose-200 ring-1 ring-rose-500/10'
                            : fineInfo.fineStatus === 'Paid'
                            ? 'border-slate-200 hover:border-emerald-200'
                            : isReturned
                            ? 'border-slate-200'
                            : 'border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-2xs flex items-center justify-center">
                            {txn.bookCover ? (
                              <img
                                src={txn.bookCover}
                                alt={txn.bookTitle}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = generateFallbackCover(
                                    txn.bookTitle,
                                    txn.bookAuthor,
                                    txn.bookCategory
                                  );
                                }}
                              />
                            ) : (
                              <BookOpen className="w-6 h-6 text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                <IdCard className="w-3.5 h-3.5 text-teal-600" />
                                {txn.transactionId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyId(txn.transactionId)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Copy Transaction ID"
                              >
                                <Copy className="w-3 h-3" />
                              </button>

                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                  isOverdue
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : isReturned
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isOverdue
                                      ? 'bg-rose-500 animate-pulse'
                                      : isReturned
                                      ? 'bg-emerald-500'
                                      : 'bg-teal-500'
                                  }`}
                                />
                                {isOverdue
                                  ? 'Overdue Loan'
                                  : isReturned
                                  ? 'Returned to Shelf'
                                  : 'Active Loan'}
                              </span>

                              {fineInfo.fineAmount > 0 && (
                                <span
                                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                    fineInfo.fineStatus === 'Paid'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                                  }`}
                                >
                                  <IndianRupee className="w-3 h-3" />
                                  <span>Fine: ₹{fineInfo.fineAmount}</span>
                                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-white font-black">
                                    {fineInfo.fineStatus}
                                  </span>
                                </span>
                              )}

                              {txn.fineReceiptNo && (
                                <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                  <Receipt className="w-3 h-3 text-emerald-600" />
                                  <span>{txn.fineReceiptNo}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <h3 className="font-extrabold text-slate-900 text-sm truncate">
                                {txn.bookTitle}
                              </h3>
                              <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                by {txn.bookAuthor}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={txn.memberAvatar}
                                  alt={txn.memberName}
                                  className="w-4 h-4 rounded-full object-cover shrink-0"
                                />
                                <span className="font-bold text-slate-800 truncate">
                                  {txn.memberName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({txn.memberId})
                                </span>
                              </div>

                              <span className="text-[11px] flex items-center gap-1 text-slate-500">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Issued: {txn.issueDate}
                              </span>

                              <span
                                className={`text-[11px] flex items-center gap-1 font-medium ${
                                  isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                                }`}
                              >
                                <Clock className="w-3 h-3 text-slate-400" />
                                Due: {txn.dueDate}
                              </span>

                              {isReturned && txn.returnDate && (
                                <span className="text-[11px] flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Returned: {txn.returnDate}
                                </span>
                              )}

                              {fineInfo.daysOverdue > 0 && (
                                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                  {fineInfo.daysOverdue}d overdue (₹{dailyFineRate}/d)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto justify-between lg:justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(txn)}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            title="Inspect complete circulation details"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>Details</span>
                          </button>

                          {fineInfo.fineAmount > 0 && fineInfo.fineStatus === 'Unpaid' && (
                            <button
                              type="button"
                              onClick={() => handleOpenPayFine(txn)}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Collect fine payment"
                            >
                              <IndianRupee className="w-3.5 h-3.5" />
                              <span>Pay Fine (₹{fineInfo.fineAmount})</span>
                            </button>
                          )}

                          {fineInfo.fineStatus === 'Paid' && (
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(txn)}
                              className="px-3.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1"
                              title="View official payment receipt"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Receipt</span>
                            </button>
                          )}

                          {txn.status === 'Active' ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuickRenew(txn)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                                title="Renew loan terms (+14 days)"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                                <span>Renew</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenReturn(txn)}
                                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Return Book</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <p className="text-slate-500">
                  Showing{' '}
                  <strong className="text-slate-800">
                    {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
                  </strong>{' '}
                  of <strong className="text-slate-800">{filteredTransactions.length}</strong> records
                </p>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pg = i + 1;
                      return (
                        <button
                          key={pg}
                          onClick={() => setCurrentPage(pg)}
                          className={`w-7 h-7 rounded-xl text-xs font-bold transition cursor-pointer ${
                            currentPage === pg
                              ? 'bg-teal-600 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {pg}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </main>
          </>
        )}

        {viewMode === 'issue' && (
          <CirculationIssueFullPage
            books={books}
            members={members}
            transactions={transactions}
            initialMemberId={searchParams.get('memberId') || ''}
            initialBookId={searchParams.get('bookId') || ''}
            onBack={() => setViewMode('list')}
            onIssueSuccess={async (issueData) => {
              await issueBook(issueData);
              toast.success('Book issued successfully!');
              setViewMode('list');
              setActiveTab('active');
              setStatusFilter('All');
              setCurrentPage(1);
            }}
          />
        )}

        {viewMode === 'return' && selectedTransaction && (
          <CirculationReturnFullPage
            transaction={selectedTransaction}
            dailyFineRate={dailyFineRate}
            onBack={() => {
              setSelectedTransaction(null);
              setViewMode('list');
            }}
            onConfirmReturn={async (returnDate, collectFine, paymentMethod) => {
              const res = await returnBook(selectedTransaction.id, returnDate, collectFine, paymentMethod);
              if (collectFine && res.fineAmount > 0) {
                toast.success(
                  `"${selectedTransaction.bookTitle}" returned & fine of ₹${res.fineAmount} collected! (Receipt #${res.fineReceiptNo})`
                );
              } else {
                toast.success(`"${selectedTransaction.bookTitle}" returned to shelf inventory!`);
              }
              setSelectedTransaction(null);
              setViewMode('list');
            }}
          />
        )}

        {viewMode === 'pay-fine' && payingTransaction && (
          <CirculationPayFineFullPage
            transaction={payingTransaction}
            todayStr={todayStr}
            dailyFineRate={dailyFineRate}
            getTransactionFineInfo={getTransactionFineInfo}
            onBack={() => {
              setPayingTransaction(null);
              setViewMode('list');
            }}
            onConfirmPayment={async (paymentData) => {
              const updated = await payFine(payingTransaction.id, paymentData);
              toast.success(
                `Payment of ₹${updated.fineAmount} received! Receipt #${updated.fineReceiptNo} generated.`
              );
              setPayingTransaction(null);
              setReceiptTransaction(updated);
              setViewMode('receipt');
            }}
            onWaiveFine={async (reason) => {
              await waiveFine(payingTransaction.id, reason);
              toast.info('Fine has been waived for administrative reasons.');
              setPayingTransaction(null);
              setViewMode('list');
            }}
          />
        )}

        {viewMode === 'receipt' && receiptTransaction && (
          <CirculationReceiptFullPage
            transaction={receiptTransaction}
            onBack={() => {
              setReceiptTransaction(null);
              setViewMode('list');
            }}
          />
        )}

        {viewMode === 'details' && selectedTransaction && (
          <CirculationDetailsFullPage
            transaction={selectedTransaction}
            books={books}
            members={members}
            todayStr={todayStr}
            dailyFineRate={dailyFineRate}
            getTransactionFineInfo={getTransactionFineInfo}
            onBack={() => {
              setSelectedTransaction(null);
              setViewMode('list');
            }}
            onRenew={async (txn) => {
              await handleQuickRenew(txn);
            }}
            onInitiateReturn={(txn) => {
              setSelectedTransaction(txn);
              setViewMode('return');
            }}
            onPayFine={(txn) => {
              setPayingTransaction(txn);
              setViewMode('pay-fine');
            }}
            onViewReceipt={(txn) => {
              setReceiptTransaction(txn);
              setViewMode('receipt');
            }}
          />
        )}
      </div>
    </div>
  );
};
