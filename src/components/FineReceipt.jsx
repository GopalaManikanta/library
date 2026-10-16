import React from 'react';
import { ArrowLeft, Printer, CheckCircle2 } from 'lucide-react';

export const CirculationReceiptFullPage = ({ transaction, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 print:hidden">
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
              Official Fine Payment Receipt
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Printable acknowledgment of settled library overdue dues
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-2xl w-full mx-auto">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-6 print:border-none print:shadow-none">
          <div className="border-b border-slate-200 pb-6 text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-2 shadow-sm">
              LF
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              LIBRAFLOW CENTRAL LIBRARY
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Official Overdue Fine Payment Receipt
            </p>
          </div>

          <div className="flex items-center justify-between text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Receipt No</span>
              <span className="font-mono font-extrabold text-slate-900 text-sm">
                {transaction.fineReceiptNo || 'REC-5401'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Date of Payment</span>
              <span className="font-mono font-bold text-slate-900">
                {transaction.finePaidDate || transaction.returnDate || transaction.issueDate || 'Settled'}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs border-b border-slate-100 pb-5">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Patron Name:</span>
              <strong className="text-slate-900">{transaction.memberName}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Patron Membership ID:</span>
              <strong className="font-mono text-slate-900">{transaction.memberId}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Book Title:</span>
              <strong className="text-slate-900 truncate max-w-xs">{transaction.bookTitle}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Book ISBN:</span>
              <strong className="font-mono text-slate-900">{transaction.bookIsbn}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Scheduled Due Date:</span>
              <strong className="font-mono text-slate-900">{transaction.dueDate}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Payment Channel:</span>
              <strong className="text-slate-900">{transaction.paymentMethod || 'Cash'}</strong>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-emerald-800 text-[10px] font-bold uppercase block">Amount Paid</span>
              <span className="text-2xl font-black text-emerald-900 font-mono">
                ₹{transaction.fineAmount}
              </span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>PAID & CLEARED</span>
            </div>
          </div>

          <div className="pt-4 text-center text-[10px] text-slate-400 space-y-1">
            <p>This is a computer-generated receipt authorized by the LibraFlow Circulation Management Subsystem.</p>
            <p className="font-mono">Transaction Hash: {transaction.transactionId}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export const FineReceipt = CirculationReceiptFullPage;
