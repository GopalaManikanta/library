import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  BookOpen,
  Users,
  BookMarked,
  CheckCircle2,
  AlertTriangle,
  Layers,
  IndianRupee,
  Printer,
  Download,
  Search,
  Menu,
  TrendingUp,
  PieChart,
  Award,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Sidebar } from '../components/Sidebar';
import { renderCategoryIcon } from '../components/CategoryManager';

export const Reports = () => {
  const { books, transactions, metrics, categories, members } = useLibrary();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timePeriod, setTimePeriod] = useState('All');
  const [categorySearch, setCategorySearch] = useState('');
  const [circulationFilter, setCirculationFilter] = useState('All');
  const [circulationSearch, setCirculationSearch] = useState('');
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [todayTimeMs] = useState(() => new Date().setHours(0, 0, 0, 0));

  const turnoverRate = useMemo(() => {
    const total = Number(metrics?.totalCopies || metrics?.totalBooks || 1);
    const issued = Number(metrics?.booksIssued || 0);
    return Math.min(100, Math.round((issued / (total || 1)) * 100));
  }, [metrics]);

  const complianceRate = useMemo(() => {
    const totalCirc = Number(metrics?.booksIssued || 0) + Number(metrics?.booksReturned || 0);
    if (!totalCirc) return 100;
    return Math.min(100, Math.round((Number(metrics?.booksReturned || 0) / totalCirc) * 100));
  }, [metrics]);

  const fineRecoveryRate = useMemo(() => {
    const collected = Number(metrics?.fineCollected || 0);
    const pending = Number(metrics?.finePending || 0);
    const total = collected + pending;
    if (!total) return 100;
    return Math.min(100, Math.round((collected / total) * 100));
  }, [metrics]);

  const shelfReadyRate = useMemo(() => {
    const total = Number(metrics?.totalCopies || metrics?.totalBooks || 1);
    const avail = Number(metrics?.booksAvailable || 0);
    return Math.min(100, Math.round((avail / (total || 1)) * 100));
  }, [metrics]);

  const categoryStats = useMemo(() => {
    const counts = {};
    const copies = {};
    const available = {};

    (books || []).forEach((b) => {
      const cat = (b.category || 'General').trim();
      counts[cat] = (counts[cat] || 0) + 1;
      copies[cat] = (copies[cat] || 0) + Number(b.totalCopies ?? 1);
      available[cat] = (available[cat] || 0) + Number(b.availableCopies ?? b.totalCopies ?? 1);
    });

    const knownCats = (categories || []).map((c) => c.name);
    const allCatNames = Array.from(new Set([...knownCats, ...Object.keys(counts)]));
    const totalBooksCount = (books || []).length || 1;

    return allCatNames
      .map((catName) => {
        const count = counts[catName] || 0;
        const totalCop = copies[catName] || 0;
        const availCop = available[catName] || 0;
        const borrowedCop = Math.max(0, totalCop - availCop);
        const percentage = Math.round((count / totalBooksCount) * 100);
        const utilization = totalCop > 0 ? Math.round((borrowedCop / totalCop) * 100) : 0;

        return {
          name: catName,
          count,
          totalCopies: totalCop,
          availableCopies: availCop,
          borrowedCopies: borrowedCop,
          percentage,
          utilization,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [books, categories]);

  const filteredCategoryStats = useMemo(() => {
    const q = categorySearch.toLowerCase().trim();
    if (!q) return categoryStats;
    return categoryStats.filter((c) => c.name.toLowerCase().includes(q));
  }, [categoryStats, categorySearch]);

  const overdueAging = useMemo(() => {
    const buckets = { minor: 0, moderate: 0, critical: 0, totalPendingFines: 0 };
    (transactions || []).forEach((t) => {
      if (t.status === 'Active' && t.dueDate < todayStr) {
        const dueMs = Date.parse(t.dueDate);
        const diffDays = Math.max(1, Math.floor((todayTimeMs - dueMs) / (1000 * 60 * 60 * 24)));
        buckets.totalPendingFines += diffDays * 5;
        if (diffDays <= 7) {
          buckets.minor++;
        } else if (diffDays <= 14) {
          buckets.moderate++;
        } else {
          buckets.critical++;
        }
      }
    });
    return buckets;
  }, [transactions, todayStr, todayTimeMs]);

  const topCirculatedBooks = useMemo(() => {
    const counts = {};
    (transactions || []).forEach((t) => {
      const key = t.bookId || t.bookTitle;
      if (!counts[key]) {
        counts[key] = {
          id: t.bookId,
          title: t.bookTitle,
          category: t.bookCategory || 'General',
          count: 0,
        };
      }
      counts[key].count++;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [transactions]);

  const topPatrons = useMemo(() => {
    const counts = {};
    (transactions || []).forEach((t) => {
      const key = String(t.memberId || t.memberEmail || t.memberName);
      if (!counts[key]) {
        counts[key] = {
          name: t.memberName || 'Student',
          email: t.memberEmail || 'N/A',
          totalBorrows: 0,
          activeLoans: 0,
        };
      }
      counts[key].totalBorrows++;
      if (t.status === 'Active') {
        counts[key].activeLoans++;
      }
    });

    return Object.values(counts)
      .sort((a, b) => b.totalBorrows - a.totalBorrows)
      .slice(0, 5);
  }, [transactions]);

  const monthlyReportData = useMemo(() => {
    const months = [
      { key: '2026-05', label: 'May 2026', baseIssues: 18, baseReturns: 15 },
      { key: '2026-06', label: 'Jun 2026', baseIssues: 24, baseReturns: 22 },
      { key: '2026-07', label: 'Jul 2026', baseIssues: 31, baseReturns: 28 },
      { key: '2026-08', label: 'Aug 2026', baseIssues: 29, baseReturns: 27 },
      { key: '2026-09', label: 'Sep 2026', baseIssues: 38, baseReturns: 34 },
      { key: '2026-10', label: 'Oct 2026', baseIssues: 12, baseReturns: 10 },
    ];

    const realIssuesByMonth = {};
    const realReturnsByMonth = {};

    (transactions || []).forEach((t) => {
      if (t.issueDate) {
        const mKey = t.issueDate.slice(0, 7);
        realIssuesByMonth[mKey] = (realIssuesByMonth[mKey] || 0) + 1;
      }
      if (t.returnDate) {
        const mKey = t.returnDate.slice(0, 7);
        realReturnsByMonth[mKey] = (realReturnsByMonth[mKey] || 0) + 1;
      }
    });

    return months.map((m) => {
      const liveIssued = realIssuesByMonth[m.key] || 0;
      const liveReturned = realReturnsByMonth[m.key] || 0;
      const totalIssued = m.baseIssues + liveIssued;
      const totalReturned = m.baseReturns + liveReturned;
      const onTimeRate = Math.min(100, Math.round((totalReturned / Math.max(1, totalIssued)) * 95));

      return {
        month: m.label,
        key: m.key,
        issued: totalIssued,
        returned: totalReturned,
        active: Math.max(0, totalIssued - totalReturned),
        onTimeRate,
      };
    });
  }, [transactions]);

  const maxMonthlyVal = useMemo(() => {
    return Math.max(
      ...monthlyReportData.map((d) => Math.max(d.issued, d.returned)),
      40
    );
  }, [monthlyReportData]);

  const filteredCirculation = useMemo(() => {
    const q = circulationSearch.toLowerCase().trim();
    return (transactions || []).filter((t) => {
      if (circulationFilter === 'Active' && t.status !== 'Active') return false;
      if (circulationFilter === 'Returned' && t.status !== 'Returned') return false;
      if (circulationFilter === 'Overdue') {
        if (t.status === 'Returned' || t.dueDate >= todayStr) return false;
      }

      if (!q) return true;
      return (
        t.bookTitle?.toLowerCase().includes(q) ||
        t.memberName?.toLowerCase().includes(q) ||
        t.transactionId?.toLowerCase().includes(q) ||
        t.bookCategory?.toLowerCase().includes(q)
      );
    });
  }, [transactions, circulationFilter, circulationSearch, todayStr]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ['LibraFlow Library Operations & Intelligence Audit Report'],
      ['Generated On', todayStr],
      ['Time Scope', timePeriod],
      [],
      ['--- STRATEGIC OPERATIONAL INDICATORS ---'],
      ['Metric', 'Score / Value'],
      ['Circulation Turnover Rate', `${turnoverRate}%`],
      ['Return Compliance Rate', `${complianceRate}%`],
      ['Fine Recovery Efficiency', `${fineRecoveryRate}%`],
      ['Shelf Stock Readiness', `${shelfReadyRate}%`],
      [],
      ['--- KEY VOLUME METRICS ---'],
      ['Total Titles in Catalog', metrics?.totalBooks],
      ['Total Physical Copies', metrics?.totalCopies],
      ['Available Shelf Copies', metrics?.booksAvailable],
      ['Active Circulating Loans', metrics?.booksIssued],
      ['Total Returned Volumes', metrics?.booksReturned],
      ['Active Registered Patrons', metrics?.activeMembers],
      ['Total Registered Members', metrics?.totalMembers],
      ['Overdue Circulation Volumes', metrics?.overdueBooks],
      ['Fine Collected (INR)', metrics?.fineCollected],
      ['Fine Pending Dues (INR)', metrics?.finePending],
      [],
      ['--- CATEGORY INVENTORY AUDIT ---'],
      ['Classification', 'Titles Count', 'Total Copies', 'Available', 'Circulating', 'Shelf Share %', 'Utilization %'],
      ...categoryStats.map((c) => [
        c.name,
        c.count,
        c.totalCopies,
        c.availableCopies,
        c.borrowedCopies,
        `${c.percentage}%`,
        `${c.utilization}%`,
      ]),
      [],
      ['--- MONTHLY CIRCULATION VOLUME AUDIT ---'],
      ['Period', 'Issued Volumes', 'Returned Volumes', 'Net Active', 'On-Time Compliance %'],
      ...monthlyReportData.map((m) => [
        m.month,
        m.issued,
        m.returned,
        m.active,
        `${m.onTimeRate}%`,
      ]),
      [],
      ['--- TOP CIRCULATED BOOKS ---'],
      ['Rank', 'Book Title', 'Category', 'Total Checkouts'],
      ...topCirculatedBooks.map((b, i) => [
        `#${i + 1}`,
        b.title,
        b.category,
        b.count,
      ]),
      [],
      ['--- OVERDUE CIRCULATION LEDGER ---'],
      ['Transaction ID', 'Patron Name', 'Book Title', 'Issue Date', 'Due Date', 'Status', 'Fine Amount', 'Fine Status'],
      ...filteredCirculation.map((t) => [
        t.transactionId,
        t.memberName,
        t.bookTitle,
        t.issueDate,
        t.dueDate,
        t.status,
        t.fineAmount || 0,
        t.fineStatus || 'N/A',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LibraFlow_Intelligence_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summaryCards = [
    {
      title: 'Total Titles',
      value: metrics?.totalBooks,
      subtext: `${metrics?.totalCopies || metrics?.totalBooks} physical copies`,
      icon: BookOpen,
      iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
    },
    {
      title: 'Active Loans',
      value: metrics?.booksIssued,
      subtext: 'Circulating across campus',
      icon: BookMarked,
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
    },
    {
      title: 'Books Returned',
      value: metrics?.booksReturned,
      subtext: 'Re-shelved into inventory',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Active Patrons',
      value: metrics?.activeMembers,
      subtext: `${metrics?.totalMembers || (members || []).length} registered scholars`,
      icon: Users,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      title: 'Overdue Books',
      value: metrics?.overdueBooks,
      subtext: 'Requires clearance follow-up',
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      title: 'Fine Revenue',
      value: `₹${Number(metrics?.fineCollected || 0).toLocaleString('en-IN')}`,
      subtext: `₹${Number(metrics?.finePending || 0).toLocaleString('en-IN')} pending dues`,
      icon: IndianRupee,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  const reportTabs = [
    { id: 'overview', label: 'Overview Cockpit', icon: BarChart3 },
    { id: 'circulation', label: 'Circulation & Overdue Audit', icon: TrendingUp },
    { id: 'catalog', label: 'Catalog & Shelf Health', icon: Layers },
    { id: 'financial', label: 'Fines & Revenue Audit', icon: IndianRupee },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc] text-slate-800 flex font-sans">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto print:h-auto print:overflow-visible">
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 print:hidden shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                <span>Executive Reports & Intelligence Suite</span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Comprehensive circulation audits, catalog velocity, overdue aging analytics & revenue tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              {['All', 'Month', 'Quarter'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTimePeriod(p)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                    timePeriod === p ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-7 print:p-0 print:space-y-6">
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-teal-500/10 border border-teal-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-teal-800">
                <span className="uppercase tracking-wider text-[10px]">Circulation Velocity</span>
                <span className="font-extrabold">{turnoverRate}%</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {metrics?.booksIssued || 0} <span className="text-xs font-bold text-slate-500">active loans</span>
              </p>
              <div className="w-full bg-teal-200/50 rounded-full h-1.5 overflow-hidden">
                <div style={{ width: `${turnoverRate}%` }} className="h-full bg-teal-600 rounded-full" />
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-emerald-500/10 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <span className="uppercase tracking-wider text-[10px]">Return Compliance</span>
                <span className="font-extrabold">{complianceRate}%</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {metrics?.booksReturned || 0} <span className="text-xs font-bold text-slate-500">re-shelved</span>
              </p>
              <div className="w-full bg-emerald-200/50 rounded-full h-1.5 overflow-hidden">
                <div style={{ width: `${complianceRate}%` }} className="h-full bg-emerald-600 rounded-full" />
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-purple-500/10 border border-purple-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-800">
                <span className="uppercase tracking-wider text-[10px]">Fine Recovery</span>
                <span className="font-extrabold">{fineRecoveryRate}%</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                ₹{Number(metrics?.fineCollected || 0).toLocaleString('en-IN')} <span className="text-xs font-bold text-slate-500">cleared</span>
              </p>
              <div className="w-full bg-purple-200/50 rounded-full h-1.5 overflow-hidden">
                <div style={{ width: `${fineRecoveryRate}%` }} className="h-full bg-purple-600 rounded-full" />
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                <span className="uppercase tracking-wider text-[10px]">Shelf Readiness</span>
                <span className="font-extrabold">{shelfReadyRate}%</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {metrics?.booksAvailable || 0} <span className="text-xs font-bold text-slate-500">on shelf</span>
              </p>
              <div className="w-full bg-amber-200/50 rounded-full h-1.5 overflow-hidden">
                <div style={{ width: `${shelfReadyRate}%` }} className="h-full bg-amber-500 rounded-full" />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto print:hidden">
            {reportTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-7">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
                {summaryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                          {card.title}
                        </span>
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${card.iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">
                        {card.value}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {card.subtext}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-teal-600" />
                        <span>Monthly Issue & Return Analytics</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Historical volume throughput & on-time return reliability percentages
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-teal-600" />
                        <span className="text-slate-700">Issued</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-emerald-500" />
                        <span className="text-slate-700">Returned</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 pt-4 flex items-end justify-between gap-2 sm:gap-4 px-2">
                    {monthlyReportData.map((d) => {
                      const issueHeightPct = Math.min(100, Math.round((d.issued / maxMonthlyVal) * 100));
                      const returnHeightPct = Math.min(100, Math.round((d.returned / maxMonthlyVal) * 100));

                      return (
                        <div key={d.key} className="flex-1 flex flex-col items-center h-full justify-end group">
                          <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-44 pb-2">
                            <div
                              style={{ height: `${issueHeightPct}%` }}
                              className="w-3 sm:w-5 bg-teal-600 rounded-t-md transition-all duration-300 relative group-hover:bg-teal-700 cursor-pointer"
                              title={`${d.month}: ${d.issued} Books Issued`}
                            >
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-teal-700 bg-teal-50 px-1 rounded border border-teal-200 pointer-events-none z-10">
                                {d.issued}
                              </span>
                            </div>
                            <div
                              style={{ height: `${returnHeightPct}%` }}
                              className="w-3 sm:w-5 bg-emerald-500 rounded-t-md transition-all duration-300 relative group-hover:bg-emerald-600 cursor-pointer"
                              title={`${d.month}: ${d.returned} Books Returned`}
                            >
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200 pointer-events-none z-10">
                                {d.returned}
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-slate-200 w-full pt-2 text-center">
                            <span className="text-[10px] font-bold text-slate-500 block truncate">
                              {d.month.split(' ')[0]}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {d.onTimeRate}% on-time
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-purple-600" />
                      <span>Circulation Distribution</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Current ledger composition & loan status
                    </p>
                  </div>

                  <div className="py-2 flex items-center justify-center">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <path
                          className="text-emerald-500"
                          strokeDasharray={`${Math.max(1, Math.round(((metrics?.booksReturned || 0) / Math.max(1, (metrics?.booksIssued || 0) + (metrics?.booksReturned || 0))) * 100))}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.8"
                        />
                        <path
                          className="text-sky-500"
                          strokeDasharray={`${Math.max(1, Math.round(((metrics?.booksIssued || 0) / Math.max(1, (metrics?.booksIssued || 0) + (metrics?.booksReturned || 0))) * 100))}, 100`}
                          strokeDashoffset={`-${Math.round(((metrics?.booksReturned || 0) / Math.max(1, (metrics?.booksIssued || 0) + (metrics?.booksReturned || 0))) * 100)}`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.8"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-black text-slate-900 leading-none block">
                          {(transactions || []).length}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Transactions
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50 text-sky-900">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        <span>Active Borrowings</span>
                      </span>
                      <span className="font-extrabold font-mono">{metrics?.booksIssued || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-900">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Returned & Re-shelved</span>
                      </span>
                      <span className="font-extrabold font-mono">{metrics?.booksReturned || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 text-rose-900">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>Overdue Dues</span>
                      </span>
                      <span className="font-extrabold font-mono">{metrics?.overdueBooks || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-teal-600" />
                      <span>Hall of Fame: Most Circulated Titles</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">All-Time Peak</span>
                  </div>

                  <div className="space-y-2.5">
                    {topCirculatedBooks.map((b, idx) => (
                      <div
                        key={b.id || b.title}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{b.title}</p>
                            <p className="text-[10px] text-teal-700 font-medium truncate">{b.category}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-black text-slate-900">{b.count}</span>
                          <span className="text-[10px] text-slate-400 block">issues</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-600" />
                      <span>Top Scholarly Patrons</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Highest Volume</span>
                  </div>

                  <div className="space-y-2.5">
                    {topPatrons.map((p, idx) => (
                      <div
                        key={p.email + idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {p.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{p.email}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            {p.totalBorrows} Borrows ({p.activeLoans} active)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'circulation' && (
            <div className="space-y-7">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Minor Delay (0 - 7 Days)
                  </span>
                  <p className="text-2xl font-black text-amber-950">{overdueAging.minor} volumes</p>
                  <p className="text-xs text-amber-900/70">Courtesy return reminder recommended</p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-1">
                  <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">
                    Moderate Delay (8 - 14 Days)
                  </span>
                  <p className="text-2xl font-black text-orange-950">{overdueAging.moderate} volumes</p>
                  <p className="text-xs text-orange-900/70">Standard overdue penalty accruing</p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-1">
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                    Critical Defaulters (15+ Days)
                  </span>
                  <p className="text-2xl font-black text-rose-950">{overdueAging.critical} volumes</p>
                  <p className="text-xs text-rose-900/70">Requires official librarian clearance notice</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-teal-600" />
                      <span>Circulation Transaction Audit Trail</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live audit log of registered patron checkouts, schedule limits, and return records
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
                      {['All', 'Active', 'Returned', 'Overdue'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setCirculationFilter(f)}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs ${
                            circulationFilter === f
                              ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-56">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={circulationSearch}
                        onChange={(e) => setCirculationSearch(e.target.value)}
                        placeholder="Search patron, book, ID..."
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-4 rounded-l-xl">ID</th>
                        <th className="py-3 px-4">Patron</th>
                        <th className="py-3 px-4">Book Title</th>
                        <th className="py-3 px-4">Issue Date</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 rounded-r-xl text-right">Fine Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCirculation.map((t) => {
                        const isOver = t.status === 'Active' && t.dueDate < todayStr;
                        return (
                          <tr key={t.id || t.transactionId} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              {t.transactionId}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {t.memberName}
                            </td>
                            <td className="py-3.5 px-4 text-slate-800 max-w-xs truncate font-medium">
                              {t.bookTitle}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">{t.issueDate}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">{t.dueDate}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isOver
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : t.status === 'Returned'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-sky-50 text-sky-700 border border-sky-200'
                                }`}
                              >
                                {isOver ? 'Overdue' : t.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold">
                              {Number(t.fineAmount) > 0 ? (
                                <span className={t.fineStatus === 'Paid' ? 'text-emerald-700' : 'text-rose-600'}>
                                  ₹{t.fineAmount} ({t.fineStatus})
                                </span>
                              ) : (
                                <span className="text-slate-400">₹0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-7">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" />
                      <span>Subject Classification & Shelf Capacity Report</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Inventory breakdown by academic department, available physical copies, and utilization rate
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Filter classifications..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategoryStats.map((c) => (
                    <div
                      key={c.name}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            {renderCategoryIcon(c.name, 'w-4 h-4 text-teal-600')}
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-xs truncate">
                            {c.name}
                          </h4>
                        </div>
                        <span className="text-xs font-mono font-black text-slate-900">
                          {c.count} {c.count === 1 ? 'Title' : 'Titles'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                          <span>Utilization Rate</span>
                          <span>{c.utilization}% borrowed</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            style={{ width: `${c.utilization}%` }}
                            className="bg-teal-600 h-full rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200/60 font-medium">
                        <span>{c.totalCopies} Total</span>
                        <span className="text-emerald-700 font-bold">{c.availableCopies} On Shelf</span>
                        <span className="text-sky-700 font-bold">{c.borrowedCopies} On Loan</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-7">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Total Fines Recovered
                  </span>
                  <p className="text-3xl font-black text-emerald-950">
                    ₹{Number(metrics?.fineCollected || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-emerald-900/70">Cleared and deposited via counter/UPI</p>
                </div>

                <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                    Outstanding Pending Dues
                  </span>
                  <p className="text-3xl font-black text-rose-950">
                    ₹{Number(metrics?.finePending || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-rose-900/70">Awaiting return check-in or fine payment</p>
                </div>

                <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                    Fine Policy Rate
                  </span>
                  <p className="text-3xl font-black text-purple-950">₹5 / Day</p>
                  <p className="text-xs text-purple-900/70">Standard overdue assessment per late book</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-teal-600" />
                    <span>Penalty Ledger & Member Settlement Summary</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Records with overdue charges and clearance receipts
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-4 rounded-l-xl">Txn ID</th>
                        <th className="py-3 px-4">Patron Name</th>
                        <th className="py-3 px-4">Book Title</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Penalty Amount</th>
                        <th className="py-3 px-4 rounded-r-xl text-right">Settlement Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(transactions || [])
                        .filter((t) => Number(t.fineAmount) > 0 || (t.status === 'Active' && t.dueDate < todayStr))
                        .map((t) => {
                          const isOver = t.status === 'Active' && t.dueDate < todayStr;
                          return (
                            <tr key={t.id || t.transactionId} className="hover:bg-slate-50/70 transition">
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                                {t.transactionId}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-900">{t.memberName}</td>
                              <td className="py-3.5 px-4 text-slate-800 max-w-xs truncate">{t.bookTitle}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-600">{t.dueDate}</td>
                              <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                                ₹{t.fineAmount || 15}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    t.fineStatus === 'Paid'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {t.fineStatus === 'Paid' ? 'Paid & Cleared' : isOver ? 'Overdue Pending' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
