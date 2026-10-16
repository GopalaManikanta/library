import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Users,
  Search,
  Check,
  BookOpen,
  Calendar,
  AlertCircle,
  BookCheck,
  CheckCircle2,
  IndianRupee,
  Sparkles,
  CreditCard,
  FileText,
  Receipt,
  RotateCcw,
  IdCard,
  Copy,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { generateFallbackCover } from '../services/bookService';

export const CirculationIssueFullPage = ({
  books,
  members,
  transactions,
  initialMemberId = '',
  initialBookId = '',
  onBack,
  onIssueSuccess,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId);
  const [selectedBookId, setSelectedBookId] = useState(initialBookId);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>Step 1: Select Patron *</span>
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {filteredMembers.length} Patrons
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Filter patron by name or ID..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredMembers.map((m) => {
                  const isSelected = String(m.id) === String(selectedMemberId);
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/15'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={m.avatar}
                          alt={m.fullName}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">{m.fullName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">ID: {m.membershipId}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">Select</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedMember && (
                <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-900">Selected Patron:</span>
                    <span className="font-mono text-[10px] text-teal-700 font-bold">
                      {selectedMember.membershipId}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium">{selectedMember.fullName}</p>
                  <p className="text-[11px] text-slate-500">{selectedMember.email}</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  <span>Step 2: Select Catalog Volume *</span>
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {filteredBooks.length} Titles
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Filter catalog by title or author..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredBooks.map((b) => {
                  const isSelected = String(b.id) === String(selectedBookId);
                  const copiesAvail = Number(b.availableCopies ?? b.totalCopies ?? 0);
                  const isOut = copiesAvail <= 0;

                  return (
                    <div
                      key={b.id}
                      onClick={() => !isOut && setSelectedBookId(b.id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isOut
                          ? 'opacity-40 bg-slate-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/15'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-11 rounded-md bg-slate-200 overflow-hidden shrink-0">
                          {b.coverImage && (
                            <img
                              src={b.coverImage}
                              alt={b.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">{b.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">By {b.author}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {isOut ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            Out of stock
                          </span>
                        ) : isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {copiesAvail} left
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedBook && (
                <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-900">Selected Book:</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {selectedBook.availableCopies ?? selectedBook.totalCopies} Available
                    </span>
                  </div>
                  <p className="text-slate-800 font-extrabold truncate">{selectedBook.title}</p>
                  <p className="text-[11px] text-slate-500">ISBN: {selectedBook.isbn}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Step 3: Loan Schedule & Term Conditions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Date of Issue *</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-teal-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700">Scheduled Due Date *</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setLoanDays(7)}
                      className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      7d
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setLoanDays(14)}
                      className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      14d
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setLoanDays(30)}
                      className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      30d
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-teal-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Issue Notes / Remarks (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Standard 14-day semester coursework reference loan..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-teal-600 focus:outline-none"
              />
            </div>

            {isDuplicateLoan && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Duplicate Loan Prevented: This patron already holds an active borrowed copy of this book.</span>
              </div>
            )}

            {isMemberOverQuota && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Quota Exceeded: This patron has reached the maximum borrowing quota of 5 concurrent active loans.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDuplicateLoan || isBookOutOfStock || isMemberOverQuota}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-2"
              >
                <BookCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Issuing Volume...' : 'Confirm Loan & Issue Volume'}</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export const CirculationReturnFullPage = ({
  transaction,
  dailyFineRate,
  onBack,
  onConfirmReturn,
}) => {
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [collectFineNow, setCollectFineNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOverdue = returnDate > transaction.dueDate;
  const overdueDays = Math.max(
    0,
    Math.ceil(
      (new Date(returnDate).getTime() - new Date(transaction.dueDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const calculatedFine = overdueDays * dailyFineRate;

  const handleReturn = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmReturn(returnDate, isOverdue ? collectFineNow : false, paymentMethod);
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

            {isOverdue && calculatedFine > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={collectFineNow}
                      onChange={(e) => setCollectFineNow(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span>Collect Overdue Fine (₹{calculatedFine}) Immediately</span>
                  </label>
                  <span className="text-xs font-bold text-amber-800">₹10 / Day</span>
                </div>

                {collectFineNow && (
                  <div className="pt-2 border-t border-amber-200/60">
                    <label className="block text-[11px] font-bold text-amber-900 mb-1.5">
                      Collection Mode:
                    </label>
                    <div className="flex items-center gap-2">
                      {['Cash', 'UPI', 'Card'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                            paymentMethod === m
                              ? 'bg-amber-600 text-white'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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

export const CirculationPayFineFullPage = ({
  transaction,
  todayStr,
  dailyFineRate,
  getTransactionFineInfo,
  onBack,
  onConfirmPayment,
  onWaiveFine,
}) => {
  const fineInfo = getTransactionFineInfo(transaction, todayStr);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [amountPaid, setAmountPaid] = useState(fineInfo.fineAmount);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWaiveConfirm, setShowWaiveConfirm] = useState(false);
  const [waiveReason, setWaiveReason] = useState('Dean Approval / Medical Exemption');

  const handlePay = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmPayment({
        paymentMethod,
        amountPaid: Number(amountPaid),
        notes,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWaive = async () => {
    setIsSubmitting(true);
    try {
      await onWaiveFine(waiveReason);
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
            <span>Back to Circulation</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Collect Fine Payment: {transaction.transactionId}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Record patron fine collection, choose settlement mode, and generate receipt
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto space-y-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Overdue Fine Settlement
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Total Dues: ₹{fineInfo.fineAmount}
              </h2>
              <p className="text-xs text-amber-800/80 mt-1">
                Calculated for {fineInfo.daysOverdue} days overdue @ ₹{dailyFineRate} per day for "{transaction.bookTitle}".
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <img
                src={transaction.memberAvatar}
                alt={transaction.memberName}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Patron</span>
                <p className="font-extrabold text-slate-900 text-sm truncate">{transaction.memberName}</p>
                <p className="text-xs text-slate-500 font-mono">ID: {transaction.memberId}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-14 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                {transaction.bookCover && (
                  <img
                    src={transaction.bookCover}
                    alt={transaction.bookTitle}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Volume</span>
                <p className="font-bold text-slate-900 text-xs truncate">{transaction.bookTitle}</p>
                <p className="text-[11px] text-slate-500 truncate">By {transaction.bookAuthor}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePay} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-2">
                Select Payment Mode *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['UPI', 'Cash', 'Card', 'Net Banking'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMethod(mode)}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === mode
                        ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/15'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {mode === 'Cash' && <IndianRupee className="w-4 h-4 text-emerald-600" />}
                    {mode === 'UPI' && <Sparkles className="w-4 h-4 text-sky-600" />}
                    {mode === 'Card' && <CreditCard className="w-4 h-4 text-purple-600" />}
                    {mode === 'Net Banking' && <FileText className="w-4 h-4 text-amber-600" />}
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none font-mono text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5">
                  Collection Date
                </label>
                <input
                  type="date"
                  value={todayStr}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1.5">
                Receipt Note / Reference (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid at Desk counter / UPI txn ref #..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none text-xs"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWaiveConfirm(true)}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
              >
                Special Exemption: Waive This Fine
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
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
                  <Receipt className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording...' : `Confirm ₹${amountPaid} & Issue Receipt`}</span>
                </button>
              </div>
            </div>
          </form>

          {showWaiveConfirm && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <p className="font-extrabold text-rose-900 text-xs">
                Confirm Fine Waiver (Zero Dues):
              </p>
              <input
                type="text"
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs"
                placeholder="State reason for fee exemption..."
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWaiveConfirm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWaive}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition"
                >
                  Confirm Zero Waiver
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export const CirculationDetailsFullPage = ({
  transaction,
  books,
  members,
  todayStr,
  dailyFineRate,
  getTransactionFineInfo,
  onBack,
  onRenew,
  onInitiateReturn,
  onPayFine,
  onViewReceipt,
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
  const fineInfo = getTransactionFineInfo(transaction, todayStr);
  const daysDiff = Math.ceil(
    (new Date(transaction.dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
  );

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
      toast.success('ID copied!');
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
              Full lifecycle circulation details, fine calculation, and payment status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fineInfo.fineAmount > 0 && fineInfo.fineStatus === 'Unpaid' && (
            <button
              type="button"
              onClick={() => onPayFine(transaction)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Collect Fine (₹{fineInfo.fineAmount})</span>
            </button>
          )}

          {fineInfo.fineStatus === 'Paid' && (
            <button
              type="button"
              onClick={() => onViewReceipt(transaction)}
              className="px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payment Receipt</span>
            </button>
          )}

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
              Transaction logged in automated library circulation database
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 sm:text-right space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Late Fine Assessment
            </span>
            <div className="flex items-center gap-2 sm:justify-end">
              <span
                className={`text-lg font-black ${
                  fineInfo.fineAmount > 0
                    ? fineInfo.fineStatus === 'Paid'
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                    : 'text-slate-800'
                }`}
              >
                ₹{fineInfo.fineAmount}
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  fineInfo.fineStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : fineInfo.fineStatus === 'Unpaid'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {fineInfo.fineStatus}
              </span>
            </div>
            {fineInfo.daysOverdue > 0 && (
              <span className="text-[10px] text-slate-500 block">
                {fineInfo.daysOverdue} days late @ ₹{dailyFineRate}/day
              </span>
            )}
          </div>
        </div>

        {fineInfo.fineAmount > 0 && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>Fine Calculation & Payment Audit</span>
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  fineInfo.fineStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                Status: {fineInfo.fineStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Days Overdue</span>
                <span className="text-slate-900 font-extrabold text-sm block mt-1">
                  {fineInfo.daysOverdue} Days
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Rate Per Day</span>
                <span className="text-slate-900 font-extrabold text-sm block mt-1">
                  ₹{dailyFineRate} / Day
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Assessed</span>
                <span className="text-slate-900 font-extrabold text-sm block mt-1">
                  ₹{fineInfo.fineAmount}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Payment Mode</span>
                <span className="text-slate-900 font-extrabold text-sm block mt-1">
                  {transaction.paymentMethod || 'Pending'}
                </span>
              </div>
            </div>

            {transaction.fineReceiptNo && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">
                  Official Receipt Number: <strong className="font-mono">{transaction.fineReceiptNo}</strong> (Paid on {transaction.finePaidDate})
                </span>
                <button
                  type="button"
                  onClick={() => onViewReceipt(transaction)}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Print Receipt
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Patron Registry Profile</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Verified
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
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>Catalog Volume Details</span>
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
                <span className="text-slate-500 font-medium">Shelf Availability:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {currentBook ? `${currentBook.availableCopies ?? currentBook.totalCopies} copies ready` : 'In Catalog'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Loan Lifecycle & Schedule</span>
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
                Due Date
              </span>
              <span className={`font-mono font-bold text-sm block mt-1 ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                {transaction.dueDate}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Return Date
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                {transaction.returnDate || (isReturned ? 'Completed' : 'Pending')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Schedule Status
              </span>
              <span className={`font-bold text-sm block mt-1 ${isOverdue ? 'text-rose-600' : isReturned ? 'text-emerald-700' : 'text-teal-700'}`}>
                {isOverdue ? `${fineInfo.daysOverdue}d Late` : isReturned ? 'Re-shelved' : `${daysDiff}d Remaining`}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
