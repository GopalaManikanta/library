import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, KeyRound, ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const {
    register: form1,
    handleSubmit: handleStep1,
    formState: { errors: errors1 }
  } = useForm();

  const {
    register: form2,
    handleSubmit: handleStep2,
    getValues: getValues2,
    formState: { errors: errors2 }
  } = useForm();

  const onStep1Submit = (data) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('lms_users_db') || '[]');
      const user = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());

      setIsSubmitting(false);
      if (!user) {
        toast.error('No account registered with this email.');
        return;
      }

      setVerifiedEmail(data.email);
      setStep(2);
      toast.success('Identity verified! Please set your new password.');
    }, 500);
  };

  const onStep2Submit = (data) => {
    setIsSubmitting(true);
    setTimeout(() => {
      try {
        resetPassword(verifiedEmail, data.newPassword);
        toast.success('Password updated successfully! Please login.');
        navigate('/login');
      } catch (err) {
        toast.error(err.message || 'Failed to update password');
      } finally {
        setIsSubmitting(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-teal-50/40 to-amber-50/50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-teal-100 rounded-[2.5rem] p-7 sm:p-9 shadow-2xl shadow-teal-950/5 text-slate-800">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-700 transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
          <span className="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
            Step {step} of 2
          </span>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 mb-3 shadow-xs">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {step === 1 ? 'Reset your password' : 'Create new password'}
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {step === 1 
              ? 'Enter your institutional email to verify and reset your credentials.' 
              : `Creating new secure password for ${verifiedEmail}`}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1(onStep1Submit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Registered Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  placeholder="admin@library.com"
                  {...form1('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Valid email format required'
                    }
                  })}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50/70 border ${
                    errors1.email ? 'border-rose-400' : 'border-slate-200 focus:border-teal-500'
                  } rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/15 focus:bg-white transition`}
                />
              </div>
              {errors1.email && (
                <p className="mt-1 text-xs text-rose-500 font-medium">⚠ {errors1.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-700/25 transition cursor-pointer"
            >
              {isSubmitting ? 'Verifying...' : 'Continue to Reset'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2(onStep2Submit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="New strong password"
                  {...form2('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' }
                  })}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50/70 border border-slate-200 focus:border-teal-500 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/15 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors2.newPassword && (
                <p className="mt-1 text-xs text-rose-500 font-medium">⚠ {errors2.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  {...form2('confirmNewPassword', {
                    required: 'Please confirm password',
                    validate: (val) => val === getValues2('newPassword') || 'Passwords do not match'
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 focus:border-teal-500 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/15 focus:bg-white transition"
                />
              </div>
              {errors2.confirmNewPassword && (
                <p className="mt-1 text-xs text-rose-500 font-medium">⚠ {errors2.confirmNewPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-700/25 transition cursor-pointer"
            >
              {isSubmitting ? 'Updating Password...' : 'Save New Password & Login'}
              <ShieldCheck className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
