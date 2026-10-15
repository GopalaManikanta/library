import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { Sidebar } from '../components/Sidebar';

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const { activities, metrics } = useLibrary();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      title: 'Total Members',
      value: metrics.totalMembers,
      subtitle: 'Registered library members',
      icon: Users,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      accentBorder: 'hover:border-indigo-300',
      link: '/members',
    },
    {
      title: 'Books Issued',
      value: metrics.booksIssued,
      subtitle: `${metrics.booksIssued} active borrowing ${metrics.booksIssued === 1 ? 'record' : 'records'}`,
      icon: BookMarked,
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
      accentBorder: 'hover:border-sky-300',
      link: '/circulation',
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
    {
      title: 'Overdue Books',
      value: metrics.overdueBooks,
      subtitle: 'Past due return date',
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accentBorder: 'hover:border-rose-300',
      link: '/circulation',
    },
    {
      title: 'Total Categories',
      value: metrics.totalCategories,
      subtitle: 'Subject classifications',
      icon: Layers,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      accentBorder: 'hover:border-purple-300',
      link: '/books',
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

          <div className="flex items-center gap-3">
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
                          {act.timestamp}
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
