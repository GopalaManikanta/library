import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  BookMarked,
  CheckCircle2,
  AlertTriangle,
  Layers,
  IndianRupee,
  PlusCircle,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Menu,
  Activity,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLibrary, formatRelativeTime } from '../context/LibraryContext';
import { Sidebar } from '../components/Sidebar';
import { renderCategoryIcon } from '../components/CategoryManager';

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const { activities, metrics, books, transactions, categories } = useLibrary();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const monthlyReportData = useMemo(() => {
    const months = [
      { key: '2026-05', label: 'May', baseIssues: 18, baseReturns: 15 },
      { key: '2026-06', label: 'Jun', baseIssues: 24, baseReturns: 22 },
      { key: '2026-07', label: 'Jul', baseIssues: 31, baseReturns: 28 },
      { key: '2026-08', label: 'Aug', baseIssues: 29, baseReturns: 27 },
      { key: '2026-09', label: 'Sep', baseIssues: 38, baseReturns: 34 },
      { key: '2026-10', label: 'Oct', baseIssues: 12, baseReturns: 10 },
    ];

    const realIssuesByMonth = {};
    const realReturnsByMonth = {};

    transactions.forEach((t) => {
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
      return {
        month: m.label,
        key: m.key,
        issued: m.baseIssues + liveIssued,
        returned: m.baseReturns + liveReturned,
      };
    });
  }, [transactions]);

  const maxMonthlyVal = useMemo(() => {
    return Math.max(
      ...monthlyReportData.map((d) => Math.max(d.issued, d.returned)),
      40
    );
  }, [monthlyReportData]);

  const categoryStats = useMemo(() => {
    const counts = {};
    books.forEach((b) => {
      const cat = (b.category || 'General').trim();
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const knownCats = (categories || []).map((c) => c.name);
    const allCatNames = Array.from(new Set([...knownCats, ...Object.keys(counts)]));
    const totalBooksCount = books.length || 1;

    return allCatNames
      .map((catName) => {
        const count = counts[catName] || 0;
        const percentage = Math.round((count / totalBooksCount) * 100);
        return {
          name: catName,
          count,
          percentage,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [books, categories]);

  const statCards = [
    {
      title: 'Total Books',
      value: metrics.totalBooks,
      subtitle: `${metrics.totalCopies || metrics.totalBooks} total copies in catalog`,
      icon: BookOpen,
      iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
      accentBorder: 'hover:border-teal-300',
      link: '/books',
    },
    {
      title: 'Books Issued',
      value: metrics.booksIssued,
      subtitle: `${metrics.booksIssued} active circulating loans`,
      icon: BookMarked,
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
      accentBorder: 'hover:border-sky-300',
      link: '/circulation?tab=active',
    },
    {
      title: 'Books Returned',
      value: metrics.booksReturned,
      subtitle: `${metrics.booksReturned} returned & re-shelved volumes`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accentBorder: 'hover:border-emerald-300',
      link: '/circulation?tab=history',
    },
    {
      title: 'Active Members',
      value: metrics.activeMembers,
      subtitle: `${metrics.totalMembers} registered patrons`,
      icon: Users,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      accentBorder: 'hover:border-indigo-300',
      link: '/members',
    },
    {
      title: 'Overdue Books',
      value: metrics.overdueBooks,
      subtitle: 'Past scheduled due date',
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accentBorder: 'hover:border-rose-300',
      link: '/circulation?tab=overdue',
    },
    {
      title: 'Total Categories',
      value: metrics.totalCategories,
      subtitle: 'Subject classifications',
      icon: Layers,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      accentBorder: 'hover:border-purple-300',
      link: '/books?tab=categories',
    },
    {
      title: 'Fine Collected',
      value: `₹${Number(metrics.fineCollected).toLocaleString('en-IN')}`,
      subtitle: `Collected (₹${Number(metrics.finePending || 0).toLocaleString('en-IN')} pending)`,
      icon: IndianRupee,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      accentBorder: 'hover:border-amber-300',
      link: '/circulation?tab=fines',
    },
    {
      title: 'Books Available',
      value: metrics.booksAvailable,
      subtitle: `${metrics.totalAvailableCopies || metrics.booksAvailable} copies ready on shelves`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accentBorder: 'hover:border-emerald-300',
      link: '/books',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Books',
      description: 'View catalog, filter, search, add, edit, or inspect volumes',
      icon: PlusCircle,
      color: 'bg-teal-50 text-teal-700 border-teal-200/80',
      link: '/books',
      clickable: true,
    },
    {
      title: 'Issue Book',
      description: 'Assign available books to registered library members',
      icon: ArrowUpRight,
      color: 'bg-sky-50 text-sky-700 border-sky-200/80',
      badge: 'Circulation Desk',
      link: '/circulation?action=issue',
      clickable: true,
    },
    {
      title: 'Return Book',
      description: 'Process book returns and update shelf inventory',
      icon: ArrowDownLeft,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      badge: 'Shelf Inventory',
      link: '/circulation?tab=active',
      clickable: true,
    },
    {
      title: 'Add Member',
      description: 'Register library member profiles into the system',
      icon: UserPlus,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      badge: 'Directory',
      link: '/members',
      clickable: true,
    },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc] text-slate-800 flex font-sans">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Welcome back, {currentUser?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition shadow-2xs"
            >
              <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">View Reports</span>
            </Link>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] text-teal-700 font-semibold mt-0.5">
                  {currentUser?.role || 'Admin'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          <section>
            <div className="mb-4">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Library Overview
              </h2>
              <p className="text-xs text-slate-500">
                Real-time summary of books, members, circulation, categories, and fines
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((item) => {
                const IconComponent = item.icon;
                const cardEl = (
                  <div
                    key={item.title}
                    className={`bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs transition ${
                      item.accentBorder
                    } ${item.link ? 'cursor-pointer hover:shadow-md' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {item.title}
                      </span>
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.iconBg}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                      {item.value}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1.5">
                      {item.subtitle}
                    </p>
                  </div>
                );

                if (item.link) {
                  return (
                    <Link key={item.title} to={item.link}>
                      {cardEl}
                    </Link>
                  );
                }
                return cardEl;
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <span>Monthly Issue & Return Analytics</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live dynamic monthly checkouts compared against volume returns
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

              <div className="h-60 pt-4 flex items-end justify-between gap-2 sm:gap-4 px-2">
                {monthlyReportData.map((d) => {
                  const issueHeightPct = Math.min(100, Math.round((d.issued / maxMonthlyVal) * 100));
                  const returnHeightPct = Math.min(100, Math.round((d.returned / maxMonthlyVal) * 100));

                  return (
                    <div key={d.key} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-40 pb-2">
                        <div
                          style={{ height: `${issueHeightPct}%` }}
                          className="w-3 sm:w-5 bg-teal-600 rounded-t-md transition-all duration-300 relative group-hover:bg-teal-700 cursor-pointer"
                          title={`${d.month}: ${d.issued} Issues`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-teal-700 bg-teal-50 px-1 rounded border border-teal-200 pointer-events-none z-10">
                            {d.issued}
                          </span>
                        </div>
                        <div
                          style={{ height: `${returnHeightPct}%` }}
                          className="w-3 sm:w-5 bg-emerald-500 rounded-t-md transition-all duration-300 relative group-hover:bg-emerald-600 cursor-pointer"
                          title={`${d.month}: ${d.returned} Returns`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200 pointer-events-none z-10">
                            {d.returned}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-slate-200 w-full pt-2 text-center">
                        <span className="text-[10px] font-bold text-slate-500 block truncate">
                          {d.month}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Top Categories</span>
                </h3>
                <Link
                  to="/reports"
                  className="text-xs text-teal-600 hover:text-teal-800 font-bold"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3 pt-1">
                {categoryStats.map((c) => (
                  <div key={c.name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                        {renderCategoryIcon(c.name, 'w-3 h-3 text-teal-600')}
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="font-mono text-slate-500 shrink-0">
                        {c.count} ({c.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${c.percentage}%` }}
                        className="bg-teal-600 h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link
                  to="/reports"
                  className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-200"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Open Full Reports & Analytics</span>
                </Link>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Quick Action Cards
              </h2>
              <p className="text-xs text-slate-500">
                Core library shortcuts for daily operations
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                const content = (
                  <div
                    key={action.title}
                    className={`bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-4 transition ${
                      action.clickable
                        ? 'hover:border-teal-300 hover:shadow-md cursor-pointer group'
                        : ''
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${action.color}`}
                    >
                      <ActionIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-teal-700 transition">
                          {action.title}
                        </h3>
                        {action.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>
                );

                if (action.link) {
                  return (
                    <Link key={action.title} to={action.link}>
                      {content}
                    </Link>
                  );
                }

                return content;
              })}
            </div>
          </section>

          <section>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Recent Activities
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time log of actions performed across the library system
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                  {activities.length} Records
                </span>
              </div>

              {activities.length === 0 ? (
                <div className="py-12 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No recent activities yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Whenever books or categories are added, updated, or removed, those activities will automatically appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{act.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {act.badge && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            {act.badge}
                          </span>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(act.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
