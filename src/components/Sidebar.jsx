import React, { useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BookOpen,
  LayoutDashboard,
  BookCopy,
  Users,
  ArrowLeftRight,
  BarChart3,
  LogOut,
  X,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';

export const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { currentUser, logout } = useAuth();
  const { metrics, transactions } = useLibrary();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const studentActiveLoansCount = useMemo(() => {
    if (currentUser?.role !== 'Student') return 0;
    return (transactions || []).filter(
      (t) =>
        t.status === 'Active' &&
        (String(t.memberId) === String(currentUser?.id) ||
          t.memberEmail?.toLowerCase() === currentUser?.email?.toLowerCase() ||
          t.membershipId === currentUser?.studentId)
    ).length;
  }, [transactions, currentUser]);

  const isNavActive = (path, searchParam) => {
    if (searchParam) {
      return location.pathname === path && location.search.includes(searchParam);
    }
    if (location.pathname === path) {
      if (path === '/circulation' && location.search.includes('tab=overdue')) {
        return false;
      }
      return true;
    }
    return false;
  };

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 h-screen shrink-0 overflow-hidden bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900 block leading-none">
                Libra<span className="text-teal-600">Flow</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                LMS Portal
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {currentUser?.role === 'Student' ? (
            <div className="space-y-1.5">
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Scholar Portal
              </p>

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isNavActive('/dashboard')
                    ? 'bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  <span>My Student Portal</span>
                </div>
                {studentActiveLoansCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800">
                    {studentActiveLoansCount}
                  </span>
                )}
              </Link>

              <Link
                to="/books"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isNavActive('/books')
                    ? 'bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookCopy className="w-4 h-4 text-emerald-600" />
                  <span>Search Catalog</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {metrics?.totalBooks || 0}
                </span>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Main Navigation
                </p>

                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isNavActive('/dashboard')
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4 text-teal-600" />
                    <span>Dashboard</span>
                  </div>
                </Link>

                <Link
                  to="/books"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isNavActive('/books')
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookCopy className="w-4 h-4 text-emerald-600" />
                    <span>Book Management</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                    {metrics?.totalBooks || 0}
                  </span>
                </Link>

                <Link
                  to="/members"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isNavActive('/members')
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>Member Management</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                    {metrics?.activeMembers || 0}
                  </span>
                </Link>
              </div>

              <div className="space-y-1.5">
                <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Circulation & Audit
                </p>

                <Link
                  to="/circulation"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isNavActive('/circulation')
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                    <span>Issue & Return</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                    {metrics?.booksIssued || 0} active
                  </span>
                </Link>

                <Link
                  to="/circulation?tab=overdue"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isNavActive('/circulation', 'tab=overdue')
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-4 h-4 ${metrics?.overdueBooks > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span>Overdue & Fines</span>
                  </div>
                  {metrics?.overdueBooks > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                      {metrics.overdueBooks} due
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">
                      0 due
                    </span>
                  )}
                </Link>

                <Link
                  to="/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isNavActive('/reports')
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span>Reports & Analytics</span>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center">
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</p>
              <p className="text-[11px] text-teal-700 font-semibold truncate">
                {currentUser?.role === 'Student'
                  ? `${currentUser?.role} • ${currentUser?.studentId || 'LIB-STU-2026'}`
                  : (currentUser?.role || 'Admin')}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
