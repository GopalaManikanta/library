import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BookOpen,
  Users,
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
  Check,
  IdCard,
  Menu,
  ShieldCheck,
  BookCheck,
  Eye,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Sidebar } from '../components/Sidebar';
import { generateFallbackCover } from '../services/bookService';

export const Circulation = () => {
  const {
    books,
    members,
    transactions,
    issueBook,
    returnBook,
    renewBook,
  } = useLibrary();

  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return searchParams.get('action') === 'issue' ? 'issue' : 'list';
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') === 'history' ? 'history' : 'active';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);

  const stats = useMemo(() => {
    const active = transactions.filter((t) => t.status === 'Active');
    const returned = transactions.filter((t) => t.status === 'Returned');
    const overdue = active.filter((t) => t.dueDate < todayStr);
    const availableBooks = books.reduce(
      (sum, b) => sum + Number(b.availableCopies ?? b.totalCopies ?? 0),
      0
    );
    return {
      activeLoans: active.length,
      overdueLoans: overdue.length,
      returnedLoans: returned.length,
      availableBooks,
    };
  }, [transactions, books, todayStr]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (activeTab === 'active' && t.status !== 'Active') return false;

        if (statusFilter === 'Active' && t.status !== 'Active') return false;
        if (statusFilter === 'Returned' && t.status !== 'Returned') return false;
        if (statusFilter === 'Overdue') {
          if (t.status !== 'Active' || t.dueDate >= todayStr) return false;
        }

        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;

        return (
          t.transactionId?.toLowerCase().includes(q) ||
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
        if (a.status === 'Active' && a.dueDate < todayStr) return -1;
        if (b.status === 'Active' && b.dueDate < todayStr) return 1;
        return new Date(b.issueDate) - new Date(a.issueDate);
      });
  }, [transactions, activeTab, statusFilter, searchQuery, todayStr]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const handleCopyId = (idStr) => {
    if (idStr) {
      navigator.clipboard.writeText(idStr);
      toast.success('Transaction ID copied!');
    }
  };

  const handleQuickRenew = async (txn) => {
    try {
      const updated = await renewBook(txn.id, 14);
      toast.success(`Loan extended by 14 days for "${txn.bookTitle}"!`);
      if (selectedTransaction && String(selectedTransaction.id) === String(txn.id)) {
        setSelectedTransaction(updated);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to renew loan');
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

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-800 flex font-sans">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {viewMode === 'list' && (
          <>
            <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      Issue & Return Desk
                    </h1>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {stats.activeLoans} Active Loans
                    </span>
                    {stats.overdueLoans > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        {stats.overdueLoans} Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Manage member loan circulations, due dates, duplicate prevention, and inventory returns
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('issue')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue Book</span>
                </button>
              </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div
                  onClick={() => {
                    setActiveTab('active');
                    setStatusFilter('All');
                    setCurrentPage(1);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'active' && statusFilter === 'All'
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
                    setActiveTab('active');
                    setStatusFilter('Overdue');
                    setCurrentPage(1);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    statusFilter === 'Overdue'
                      ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/10 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-rose-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Overdue Volumes
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{stats.overdueLoans}</span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                      Past Due Date
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Requires patron reminder</span>
                </div>

                <div
                  onClick={() => {
                    setActiveTab('history');
                    setStatusFilter('Returned');
                    setCurrentPage(1);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'history' && statusFilter === 'Returned'
                      ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-emerald-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Returned Cycles
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{stats.returnedLoans}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                      Completed Loans
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Re-shelved into inventory</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Shelf Inventory
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{stats.availableBooks}</span>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded">
                      Available
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Across {books.length} catalog titles</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs w-fit">
                    <button
                      onClick={() => {
                        setActiveTab('active');
                        setStatusFilter('All');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'active'
                          ? 'bg-white text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-teal-600" />
                      <span>Active Borrowings ({stats.activeLoans})</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('history');
                        setStatusFilter('All');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'history'
                          ? 'bg-white text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Complete Issue History ({transactions.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === 'history' && (
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="All">All Statuses</option>
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
                    placeholder="Search by patron name, membership ID, email, book title, or ISBN..."
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

              {paginatedTransactions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <BookCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">No circulation records found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {activeTab === 'active'
                      ? 'There are currently no active book loans matching your search. Issue a new book to a registered patron.'
                      : 'No circulation history records match your search query.'}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setViewMode('issue')}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      + Issue Book Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedTransactions.map((txn) => {
                    const isOverdue = txn.status === 'Active' && txn.dueDate < todayStr;
                    const isReturned = txn.status === 'Returned';
                    const daysRemaining = Math.ceil(
                      (new Date(txn.dueDate).getTime() - new Date(todayStr).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div
                        key={txn.id}
                        className={`bg-white rounded-2xl border p-4 sm:p-5 transition shadow-2xs hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                          isOverdue
                            ? 'border-rose-200 ring-1 ring-rose-500/10'
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
                                  e.target.src = generateFallbackCover(txn.bookTitle, txn.bookAuthor, txn.bookCategory);
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
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
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
                                {isOverdue ? 'Overdue' : isReturned ? 'Returned' : 'Active Loan'}
                              </span>

                              <span className="text-[10px] text-slate-400 font-mono">
                                ISBN: {txn.bookIsbn}
                              </span>
                            </div>

                            <h3 className="font-extrabold text-sm text-slate-900 truncate" title={txn.bookTitle}>
                              {txn.bookTitle}
                            </h3>

                            <p className="text-xs text-slate-500 truncate">
                              Author: <strong className="text-slate-700">{txn.bookAuthor}</strong> • Category: <strong className="text-slate-700">{txn.bookCategory}</strong>
                            </p>

                            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 flex-wrap">
                              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                <img
                                  src={txn.memberAvatar}
                                  alt={txn.memberName}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className="font-bold text-slate-900">{txn.memberName}</span>
                              </div>

                              <span className="text-[11px] text-slate-400">•</span>

                              <span className="text-[11px] flex items-center gap-1 text-slate-500">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Issued: <strong className="text-slate-700">{txn.issueDate}</strong>
                              </span>

                              <span className="text-[11px] flex items-center gap-1 text-slate-500">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Due: <strong className="text-slate-700">{txn.dueDate}</strong>
                              </span>

                              {isReturned && txn.returnDate && (
                                <span className="text-[11px] flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Returned on: {txn.returnDate}
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
                            title="Open Full Page Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>View Details</span>
                          </button>

                          {txn.status === 'Active' ? (
                            <div className="flex items-center gap-2">
                              <div className="text-right hidden sm:block">
                                {isOverdue ? (
                                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md block">
                                    {Math.abs(daysRemaining)} days overdue
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md block">
                                    {daysRemaining} days left
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuickRenew(txn)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                                title="Renew loan (+14 days)"
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
                              <span>Loan Completed</span>
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
          <FullPageIssueView
            books={books}
            members={members}
            transactions={transactions}
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
          <FullPageReturnView
            transaction={selectedTransaction}
            onBack={() => {
              setSelectedTransaction(null);
              setViewMode('list');
            }}
            onConfirmReturn={async (returnDate) => {
              await returnBook(selectedTransaction.id, returnDate);
              toast.success(`"${selectedTransaction.bookTitle}" returned to shelf inventory!`);
              setSelectedTransaction(null);
              setViewMode('list');
            }}
          />
        )}

        {viewMode === 'details' && selectedTransaction && (
          <FullPageDetailsView
            transaction={selectedTransaction}
            books={books}
            members={members}
            todayStr={todayStr}
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
          />
        )}
      </div>
    </div>
  );
};

const FullPageDetailsView = ({
  transaction,
  books,
  members,
  todayStr,
  onBack,
  onRenew,
  onInitiateReturn,
}) => {
  const currentBook = books.find(
    (b) =>
      String(b.id) === String(transaction.bookId) ||
      (b.title && transaction.bookTitle && b.title.trim().toLowerCase() === transaction.bookTitle.trim().toLowerCase())
  );

  const currentMember = members.find(
    (m) =>
      String(m.id) === String(transaction.memberId) ||
      (m.fullName && transaction.memberName && m.fullName.trim().toLowerCase() === transaction.memberName.trim().toLowerCase())
  );

  const isReturned = transaction.status === 'Returned';
  const isOverdue = !isReturned && transaction.dueDate < todayStr;
  const daysDiff = Math.ceil(
    (new Date(transaction.dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  const overdueDays = isOverdue ? Math.abs(daysDiff) : 0;
  const calculatedFine = isOverdue ? overdueDays * 10 : Number(transaction.fineAmount) || 0;

  const [isRenewing, setIsRenewing] = useState(false);

  const handleActionRenew = async () => {
    setIsRenewing(true);
    try {
      await onRenew(transaction);
    } finally {
      setIsRenewing(false);
    }
  };

  const handleCopyId = (idStr) => {
    if (idStr) {
      navigator.clipboard.writeText(idStr);
      toast.success('Transaction ID copied!');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back to Desk</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Loan Audit: {transaction.transactionId}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Full lifecycle circulation details, stock availability, and borrower audit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReturned && (
            <>
              <button
                type="button"
                onClick={handleActionRenew}
                disabled={isRenewing}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                <span>{isRenewing ? 'Extending...' : 'Extend +14 Days'}</span>
              </button>

              <button
                type="button"
                onClick={() => onInitiateReturn(transaction)}
                className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Process Return</span>
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5">
                <IdCard className="w-4 h-4 text-teal-600" />
                {transaction.transactionId}
              </span>
              <button
                type="button"
                onClick={() => handleCopyId(transaction.transactionId)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Copy ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  isOverdue
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : isReturned
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOverdue
                      ? 'bg-rose-500 animate-pulse'
                      : isReturned
                      ? 'bg-emerald-500'
                      : 'bg-teal-500'
                  }`}
                />
                {isOverdue ? 'Overdue Loan' : isReturned ? 'Returned & Re-shelved' : 'Active Borrowing'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Registered loan transaction in Central Library Automated Circulation Desk
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Late Fine Status
            </span>
            <span
              className={`text-lg font-black ${
                calculatedFine > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              ₹{calculatedFine} {calculatedFine > 0 ? (isOverdue ? '(Accumulating @ ₹10/day)' : '(Settled)') : '(No Dues)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Registered Patron Details</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Patron
              </span>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={transaction.memberAvatar}
                alt={transaction.memberName}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-slate-900 text-base truncate">
                  {transaction.memberName}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {transaction.memberId}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{transaction.memberEmail}</span>
              </div>
              {currentMember?.mobileNumber && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-mono">{currentMember.mobileNumber}</span>
                </div>
              )}
              {currentMember?.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{currentMember.address}</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Borrowing Quota Status:</span>
              <span className="font-bold text-slate-800">
                {currentMember?.booksIssuedCount ?? 1} / 5 active loans
              </span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>Book Catalog & Inventory</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                {transaction.bookCategory}
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-16 h-22 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                {transaction.bookCover && (
                  <img
                    src={transaction.bookCover}
                    alt={transaction.bookTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = generateFallbackCover(
                        transaction.bookTitle,
                        transaction.bookAuthor,
                        transaction.bookCategory
                      );
                    }}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                  {transaction.bookTitle}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  By <strong className="text-slate-700">{transaction.bookAuthor}</strong>
                </p>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  ISBN: {transaction.bookIsbn}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Current Shelf Availability:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {currentBook ? `${currentBook.availableCopies ?? currentBook.totalCopies} copies ready` : 'In Catalog'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Total Catalog Copies:</span>
                <span className="font-bold text-slate-700">
                  {currentBook?.totalCopies ?? 12} volumes
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Circulation Lifecycle & Dates</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Issue Date
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                {transaction.issueDate}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Return Due Date
              </span>
              <span className={`font-mono font-bold text-sm block mt-1 ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                {transaction.dueDate}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Actual Return Date
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                {transaction.returnDate || (isReturned ? 'Completed' : 'Pending')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Circulation Status
              </span>
              <span className={`font-bold text-sm block mt-1 ${isOverdue ? 'text-rose-600' : isReturned ? 'text-emerald-700' : 'text-teal-700'}`}>
                {isOverdue ? `${overdueDays}d Late` : isReturned ? 'Re-shelved' : `${daysDiff}d Remaining`}
              </span>
            </div>
          </div>

          {transaction.notes && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold block mb-1">Circulation Remarks / Notes:</span>
              <span className="text-slate-800 italic">"{transaction.notes}"</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const FullPageReturnView = ({
  transaction,
  onBack,
  onConfirmReturn,
}) => {
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOverdue = returnDate > transaction.dueDate;
  const overdueDays = Math.max(
    0,
    Math.ceil(
      (new Date(returnDate).getTime() - new Date(transaction.dueDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const calculatedFine = overdueDays * 10;

  const handleReturn = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmReturn(returnDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back to Desk</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              Process Book Return & Re-shelving
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Verify book condition, compute late fees, and restore shelf stock in real time
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-16 h-22 rounded-xl bg-slate-200 overflow-hidden shrink-0 shadow-sm">
              {transaction.bookCover && (
                <img
                  src={transaction.bookCover}
                  alt={transaction.bookTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = generateFallbackCover(
                      transaction.bookTitle,
                      transaction.bookAuthor,
                      transaction.bookCategory
                    );
                  }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                {transaction.bookCategory}
              </span>
              <h3 className="font-extrabold text-slate-900 text-base mt-1">
                {transaction.bookTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Author: {transaction.bookAuthor}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">ISBN: {transaction.bookIsbn}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <img
                src={transaction.memberAvatar}
                alt={transaction.memberName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-slate-900 text-sm">{transaction.memberName}</p>
                <p className="text-xs text-slate-500 font-mono">ID: {transaction.memberId}</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
              {transaction.transactionId}
            </span>
          </div>

          <form onSubmit={handleReturn} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1.5">
                Actual Return Date *
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none font-mono text-sm"
                required
              />
            </div>

            <div className="p-4 rounded-2xl border text-xs space-y-2 bg-slate-50 border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Scheduled Due Date:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{transaction.dueDate}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-600 font-medium">Late Assessment:</span>
                {isOverdue ? (
                  <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                    {overdueDays} days late (Fine: ₹{calculatedFine})
                  </span>
                ) : (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    On-Time Return (₹0 fine)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Processing Return...' : 'Confirm Return & Re-shelve Volume'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

const FullPageIssueView = ({
  books,
  members,
  transactions,
  onBack,
  onIssueSuccess,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMember = members.find((m) => String(m.id) === String(selectedMemberId));
  const selectedBook = books.find((b) => String(b.id) === String(selectedBookId));

  const filteredMembers = useMemo(() => {
    const q = memberSearch.toLowerCase().trim();
    return members.filter((m) => {
      if (!q) return true;
      return (
        m.fullName?.toLowerCase().includes(q) ||
        m.membershipId?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
      );
    });
  }, [members, memberSearch]);

  const filteredBooks = useMemo(() => {
    const q = bookSearch.toLowerCase().trim();
    return books.filter((b) => {
      if (!q) return true;
      return (
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.isbn?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q)
      );
    });
  }, [books, bookSearch]);

  const isDuplicateLoan = useMemo(() => {
    if (!selectedMemberId || !selectedBookId) return false;
    return transactions.some(
      (t) =>
        (String(t.memberId) === String(selectedMemberId) ||
          (selectedMember && t.memberName && t.memberName.toLowerCase() === selectedMember.fullName.toLowerCase())) &&
        (String(t.bookId) === String(selectedBookId) ||
          (selectedBook && t.bookTitle && t.bookTitle.toLowerCase() === selectedBook.title.toLowerCase())) &&
        t.status === 'Active'
    );
  }, [transactions, selectedMemberId, selectedBookId, selectedMember, selectedBook]);

  const isBookOutOfStock = useMemo(() => {
    if (!selectedBook) return false;
    const avail = Number(selectedBook.availableCopies ?? selectedBook.totalCopies ?? 0);
    return avail <= 0;
  }, [selectedBook]);

  const memberActiveLoansCount = useMemo(() => {
    if (!selectedMemberId) return 0;
    return transactions.filter(
      (t) =>
        (String(t.memberId) === String(selectedMemberId) ||
          (selectedMember && t.memberName && t.memberName.toLowerCase() === selectedMember.fullName.toLowerCase())) &&
        t.status === 'Active'
    ).length;
  }, [transactions, selectedMemberId, selectedMember]);

  const isMemberOverQuota = memberActiveLoansCount >= 5;

  const setLoanDays = (days) => {
    const start = new Date(issueDate);
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDueDate(end);
  };

  const handleConfirmIssue = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error('Please select a library patron');
      return;
    }
    if (!selectedBookId) {
      toast.error('Please select a book to issue');
      return;
    }
    if (isDuplicateLoan) {
      toast.error('Duplicate issue prevented: Patron already has an active loan of this book');
      return;
    }
    if (isBookOutOfStock) {
      toast.error('This volume is currently out of stock');
      return;
    }
    if (isMemberOverQuota) {
      toast.error('Member loan limit reached (Max 5 active loans)');
      return;
    }

    setIsSubmitting(true);
    try {
      await onIssueSuccess({
        memberId: selectedMemberId,
        bookId: selectedBookId,
        issueDate,
        dueDate,
        notes,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to issue book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back to Desk</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              Issue Book to Patron
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Select patron, choose catalog book, and set circulation terms
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
        <form onSubmit={handleConfirmIssue} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>1. Select Registered Patron *</span>
              </label>
              {selectedMember && (
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                  Selected: {selectedMember.fullName} ({memberActiveLoansCount}/5 Loans)
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search patron by name, membership ID, email, phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                    selectedMemberId === m.id
                      ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={m.avatar}
                    alt={m.fullName}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate text-xs">{m.fullName}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{m.membershipId}</p>
                  </div>
                  {selectedMemberId === m.id && (
                    <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {selectedMember && isMemberOverQuota && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2.5 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Patron has reached the maximum 5 active loans. Return an existing book before issuing another.</span>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>2. Select Catalog Book ({books.length} Available Titles) *</span>
              </label>
              {selectedBook && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isBookOutOfStock
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {isBookOutOfStock ? '0 Available Copies' : `${selectedBook.availableCopies ?? selectedBook.totalCopies} Copies on Shelf`}
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Search catalog by title, author, category, ISBN..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
              {filteredBooks.map((b) => {
                const avail = Number(b.availableCopies ?? b.totalCopies ?? 0);
                const outOfStock = avail <= 0;

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (!outOfStock) setSelectedBookId(b.id);
                    }}
                    className={`p-2.5 rounded-xl border transition flex items-center gap-3 ${
                      outOfStock
                        ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                        : selectedBookId === b.id
                        ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/10 cursor-pointer'
                        : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                      {b.coverImage && (
                        <img
                          src={b.coverImage}
                          alt={b.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = generateFallbackCover(b.title, b.author, b.category);
                          }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate text-xs">{b.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{b.author}</p>
                      <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                        {outOfStock ? 'Out of stock' : `${avail} available`}
                      </span>
                    </div>
                    {selectedBookId === b.id && (
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {isDuplicateLoan && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-900">Duplicate Loan Prevented</p>
                  <p className="text-xs font-medium text-amber-700 mt-0.5">
                    "{selectedMember?.fullName}" currently has an active borrowed copy of "{selectedBook?.title}". A member cannot borrow two copies of the same title concurrently.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>3. Circulation Terms & Due Dates</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Issue Date *
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Return Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  min={issueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 font-medium">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setLoanDays(14)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                14 Days
              </button>
              <button
                type="button"
                onClick={() => setLoanDays(21)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                21 Days
              </button>
              <button
                type="button"
                onClick={() => setLoanDays(30)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                30 Days
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                Loan Remarks / Shelf Note
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Reference copy for semester project research..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDuplicateLoan || isBookOutOfStock || isMemberOverQuota || !selectedMemberId || !selectedBookId}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Issuing Volume...' : 'Confirm & Issue Book'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
