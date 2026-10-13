import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BookOpen, LogOut, User, Mail, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900">
              Libra<span className="text-teal-600">Flow</span>
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex items-center justify-center">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xs text-center">
          {/* User Avatar */}
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-700 font-bold text-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Welcome, {currentUser?.name}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            You are successfully authenticated.
          </p>

          {/* Account Details */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-left text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Full Name
              </span>
              <span className="font-semibold text-slate-800">{currentUser?.name}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </span>
              <span className="font-semibold text-slate-800">{currentUser?.email}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Role
              </span>
              <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                {currentUser?.role || 'Member'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Member Since
              </span>
              <span className="font-semibold text-slate-800">{currentUser?.joinedDate || 'Today'}</span>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={handleLogout}
            className="w-full mt-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
};
