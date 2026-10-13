import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  Shield, 
  ArrowRight, 
  BookOpen, 
  Compass, 
  BookmarkCheck, 
  Zap, 
  Cpu, 
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Student'
    }
  });

  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 650));
      const newUser = registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role
      });
      toast.success(`Account registered successfully! Welcome, ${newUser.name} 🚀`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-[#f8fafc] cyber-grid font-sans text-slate-800">
      
      {/* Dynamic Luminous Aura Elements */}
      <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-amber-400/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ================= 60% VISUAL HERO (MATCHING LOGIN EXACTLY) ================= */}
      <div className="relative w-full lg:w-[60%] min-h-[560px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-14 xl:p-16 text-white overflow-hidden z-10 clip-razor-edge">
        
        {/* Full-bleed high-res student membership registration theme image (Static, no motion) */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2560&q=85')` 
          }}
        />

        {/* Sophisticated dual overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-teal-950/80 to-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-teal-950/30" />

        {/* Razor Edge Neon Light Line */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-teal-400 via-amber-300 to-emerald-400 shadow-[0_0_15px_rgba(20,184,166,0.8)] pointer-events-none z-30" />

        {/* Top Header / Branding with LibraFlow */}
        <div className="relative z-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 flex items-center justify-center border border-teal-300/40 shadow-xl shadow-teal-950/80">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                  Libra<span className="text-teal-400">Flow</span>
                </h1>
                <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded-sm bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 uppercase shadow-xs">
                  MEMBER
                </span>
              </div>
              <p className="text-xs text-teal-200/80 font-medium tracking-wide">Next-Gen Library Intelligence</p>
            </div>
          </div>
        </div>

        {/* Middle Hero Showcase */}
        <div className="relative z-20 my-auto py-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-teal-500/25 border-l-2 border-l-teal-400 text-teal-200 text-xs font-mono font-medium mb-5 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-amber-300" />
            Instant Membership Activation • Local DB Sync
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
            Create Your Institutional <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-teal-200 to-emerald-300">Access Card.</span>
          </h2>
          
          <p className="mt-4 text-sm sm:text-base text-teal-100/90 leading-relaxed font-normal">
            Gain immediate borrower privileges, reserve physical books from reserve stacks, and sync your active reading queue directly in LocalStorage.
          </p>

          {/* High-Tech HUD Badges */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-teal-500/20">
              <div className="flex items-center justify-between mb-2">
                <Compass className="w-5 h-5 text-amber-300" />
                <span className="text-[10px] font-mono text-teal-400">#01</span>
              </div>
              <div className="text-xs font-bold text-white tracking-wide">Global Stacks</div>
              <div className="text-[11px] text-teal-200/70 mt-1">50,000+ volumes</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-teal-500/20">
              <div className="flex items-center justify-between mb-2">
                <BookmarkCheck className="w-5 h-5 text-emerald-300" />
                <span className="text-[10px] font-mono text-emerald-400">#02</span>
              </div>
              <div className="text-xs font-bold text-white tracking-wide">Loan Priority</div>
              <div className="text-[11px] text-teal-200/70 mt-1">Automated renewals</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-teal-500/20">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-amber-300" />
                <span className="text-[10px] font-mono text-amber-400">#03</span>
              </div>
              <div className="text-xs font-bold text-white tracking-wide">Direct Caching</div>
              <div className="text-[11px] text-teal-200/70 mt-1">Zero network lag</div>
            </div>
          </div>
        </div>

        {/* Clean spacing container */}
        <div className="relative z-20 py-2"></div>
      </div>

      {/* ================= 40% REGISTER DATA PANEL: HOLOGRAPHIC LUXE GLASS ================= */}
      <div className="relative w-full lg:w-[40%] min-h-screen flex items-center justify-center p-6 sm:p-10 lg:p-10 xl:p-14 z-20">
        
        {/* Floating Holographic Card */}
        <div className="w-full max-w-md relative z-10 holo-glass-card rounded-2xl p-7 sm:p-9 border border-slate-200/80">
          
          {/* Header Title */}
          <div className="mb-6 pb-4 border-b border-slate-200/70">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-900 text-[11px] font-bold tracking-wider uppercase">
                <UserPlus className="w-3.5 h-3.5 text-teal-700" />
                <span>Enrolment Terminal</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">JOIN</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              Join LibraFlow
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Provide credentials to generate your digital library membership.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Manikanta Kumar"
                  {...register('name', {
                    required: 'Full name is required',
                    minLength: { value: 3, message: 'Minimum 3 characters' }
                  })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border ${
                    errors.name ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-teal-600'
                  } rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-3 focus:ring-teal-500/15 shadow-2xs transition-all`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <span>⚠</span> {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Institutional Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  placeholder="manikanta@example.com"
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Enter a valid email address'
                    }
                  })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border ${
                    errors.email ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-teal-600'
                  } rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-3 focus:ring-teal-500/15 shadow-2xs transition-all`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <span>⚠</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Role Privilege */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Membership Role Privilege
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                  <Shield className="h-4 w-4" />
                </div>
                <select
                  {...register('role')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-teal-600 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:ring-3 focus:ring-teal-500/15 shadow-2xs transition-all"
                >
                  <option value="Student">Student / Member</option>
                  <option value="Faculty">Faculty / Researcher</option>
                  <option value="Admin">Library Administrator</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Security Passkey
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' }
                  })}
                  className={`w-full pl-10 pr-11 py-2.5 bg-white border ${
                    errors.password ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-teal-600'
                  } rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-3 focus:ring-teal-500/15 shadow-2xs transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <span>⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Confirm Passkey
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('confirmPassword', {
                    required: 'Please confirm password',
                    validate: (val) => val === passwordVal || 'Passwords do not match'
                  })}
                  className={`w-full pl-10 pr-11 py-2.5 bg-white border ${
                    errors.confirmPassword ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-teal-600'
                  } rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-3 focus:ring-teal-500/15 shadow-2xs transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <span>⚠</span> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-700 via-slate-900 to-teal-800 hover:from-teal-800 hover:to-slate-950 active:scale-[0.99] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-950/20 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enrolling Member...</span>
                </>
              ) : (
                <>
                  <span>Create Institutional Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-4 text-center text-xs text-slate-500 font-semibold">
            Already have an active membership?{' '}
            <Link to="/login" className="text-teal-800 hover:text-teal-950 font-black underline underline-offset-4">
              Sign In here
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};
