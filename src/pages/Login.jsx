import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  BookOpen, 
  ArrowRight, 
  Compass, 
  BookmarkCheck, 
  Users2, 
  GraduationCap, 
  Zap, 
  Fingerprint,
  Library,
  Star,
  BookMarked
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState('admin');
  const [selectedMemberId, setSelectedMemberId] = useState('mem-student');
  const { login, getRegisteredMembers } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const registeredMembers = useMemo(() => {
    return getRegisteredMembers();
  }, [getRegisteredMembers]);

  const activeMemberPreview = useMemo(() => {
    return registeredMembers.find((m) => String(m.id) === String(selectedMemberId)) || registeredMembers[0] || null;
  }, [registeredMembers, selectedMemberId]);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: 'admin@library.com',
      password: 'Password@123',
      rememberMe: true
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 650));
      const user = login(data.email, data.password);
      toast.success(`Welcome, ${user.name}! 📚`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Access Denied: Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectMember = (memberId) => {
    setSelectedMemberId(memberId);
    const target = registeredMembers.find((m) => String(m.id) === String(memberId));
    if (target) {
      setValue('email', target.email);
      setValue('password', 'Password@123');
      toast.info(`Selected Member: ${target.fullName} (${target.membershipId})`);
    }
  };

  const handleRoleTabChange = (role) => {
    setSelectedRoleTab(role);
    if (role === 'admin') {
      setValue('email', 'admin@library.com');
      setValue('password', 'Password@123');
      toast.info('Switched Mode: System Administrator');
    } else {
      const target = registeredMembers.find((m) => String(m.id) === String(selectedMemberId)) || registeredMembers[0];
      const targetEmail = target?.email || 'student@library.com';
      setValue('email', targetEmail);
      setValue('password', 'Password@123');
      toast.info(`Switched Mode: Scholar / Member (${target?.fullName || 'Student'})`);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-[#f8fafc] cyber-grid font-sans text-slate-800">
      <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-amber-400/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full lg:w-[60%] min-h-[560px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-14 xl:p-16 text-white overflow-hidden z-10 clip-razor-edge">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2560&q=85')` 
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-teal-950/80 to-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-teal-950/30" />

        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-teal-400 via-amber-300 to-emerald-400 shadow-[0_0_15px_rgba(20,184,166,0.8)] pointer-events-none z-30" />

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
                  PRO
                </span>
              </div>
              <p className="text-xs text-teal-200/80 font-medium tracking-wide">Next-Gen Library Intelligence</p>
            </div>
          </div>
        </div>

        <div className="relative z-20 my-auto py-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-teal-500/25 border-l-2 border-l-teal-400 text-teal-200 text-xs font-mono font-medium mb-5 backdrop-blur-md">
            <Library className="w-3.5 h-3.5 text-amber-300" />
            Over 50,000 Curated Titles • Instant Catalog
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
            Experience Pure <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-teal-200 to-emerald-300">Intellectual Clarity.</span>
          </h2>
          
          <p className="mt-4 text-sm sm:text-base text-teal-100/90 leading-relaxed font-normal">
            Automated catalog classifications, synchronous LocalStorage state persistence, barcode-driven returns, and privilege-based researcher access.
          </p>

          <div className="mt-7 p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/30 flex items-center justify-center text-amber-300">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Curated Archival Stacks</p>
                <p className="text-[11px] text-teal-200/80 font-mono">Dewey • ISBN • Realtime Shelf</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-amber-300 text-xs font-bold bg-black/30 px-2.5 py-1 rounded-md">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
              <span>4.9 / 5</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="group p-3.5 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-teal-500/20 hover:border-teal-400/60 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-1.5">
                <Compass className="w-4 h-4 text-amber-300" />
                <span className="text-[10px] font-mono text-teal-400">#01</span>
              </div>
              <div className="text-xs font-bold text-white tracking-wide">Dewey Index</div>
              <div className="text-[11px] text-teal-200/70 mt-0.5">Multi-vector search</div>
            </div>

            <div className="group p-3.5 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-teal-500/20 hover:border-emerald-400/60 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-1.5">
                <BookmarkCheck className="w-4 h-4 text-emerald-300" />
                <span className="text-[10px] font-mono text-emerald-400">#02</span>
              </div>
              <div className="text-xs font-bold text-white tracking-wide">Rapid Issues</div>
              <div className="text-[11px] text-teal-200/70 mt-0.5">Automatic alert sync</div>
            </div>

            <div className="group p-3.5 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-teal-500/20 hover:border-amber-400/60 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-1.5">
                <Zap className="w-4 h-4 text-amber-300" />
                <span className="text-[10px] font-mono text-amber-400">#03</span>
              </div>
              <div className="text-xs font-bold text-white tracking-wide">Direct Caching</div>
              <div className="text-[11px] text-teal-200/70 mt-0.5">LocalStorage memory</div>
            </div>
          </div>
        </div>

        <div className="relative z-20 py-2"></div>
      </div>

      <div className="relative w-full lg:w-[40%] min-h-screen flex items-center justify-center p-6 sm:p-10 lg:p-10 xl:p-14 z-20">
        <div className="w-full max-w-md relative z-10 holo-glass-card rounded-2xl p-7 sm:p-9 border border-slate-200/80">
          <div className="mb-6 pb-4 border-b border-slate-200/70">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-900 text-[11px] font-bold tracking-wider uppercase">
                <Fingerprint className="w-3.5 h-3.5 text-teal-700" />
                <span>Identity Portal</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">AUTH</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              Sign In to LibraFlow
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Select access profile to load workspace credentials.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => handleRoleTabChange('admin')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                selectedRoleTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Admin Console</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('student')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                selectedRoleTab === 'student'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users2 className="w-4 h-4 text-teal-300" />
              <span>Student / Member</span>
            </button>
          </div>

          {selectedRoleTab === 'student' && (
            <div className="mb-4 p-3.5 bg-gradient-to-br from-teal-50/80 to-slate-50 border border-teal-200/90 rounded-2xl shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users2 className="w-3.5 h-3.5 text-teal-700" />
                  Select Registered Member Account
                </label>
                <span className="text-[10px] font-mono text-teal-700 bg-white px-2 py-0.5 rounded-full border border-teal-200 font-bold">
                  {registeredMembers.length} Members
                </span>
              </div>

              <select
                value={selectedMemberId}
                onChange={(e) => handleSelectMember(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-teal-300 focus:border-teal-600 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer shadow-2xs"
              >
                {registeredMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.membershipId}) — {m.email}
                  </option>
                ))}
              </select>

              {activeMemberPreview && (
                <div className="flex items-center gap-2.5 pt-2 border-t border-teal-200/60">
                  <img
                    src={activeMemberPreview.avatar}
                    alt={activeMemberPreview.fullName}
                    className="w-8 h-8 rounded-full object-cover border-2 border-teal-400 bg-white shadow-2xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {activeMemberPreview.fullName}
                    </p>
                    <p className="text-[10px] text-teal-700 font-semibold truncate">
                      {activeMemberPreview.department} • {activeMemberPreview.semester}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    {activeMemberPreview.status}
                  </span>
                </div>
              )}

              <div className="pt-1.5 border-t border-slate-200/80">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">Quick Member Switcher:</p>
                <div className="flex flex-wrap gap-1.5">
                  {registeredMembers.slice(0, 6).map((m) => {
                    const isSelected = String(m.id) === String(selectedMemberId);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMember(m.id)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{m.fullName.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {selectedRoleTab === 'student' ? 'Member Email / Name / ID' : 'Institutional Email'}
                </label>
                <span className="text-[10px] font-mono text-teal-700 font-bold">REQUIRED</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder={
                    selectedRoleTab === 'student'
                      ? 'e.g. emily.johnson@x.dummyjson.com or Emily Johnson'
                      : 'admin@library.com'
                  }
                  {...register('email', {
                    required: 'Institutional Email or Member Name is required',
                  })}
                  className={`w-full pl-10 pr-4 py-3 bg-white border ${
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Security Passkey
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-teal-800 hover:text-teal-950 font-bold hover:underline"
                >
                  Forgot Key?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className={`w-full pl-10 pr-11 py-3 bg-white border ${
                    errors.password ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-teal-600'
                  } rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-3 focus:ring-teal-500/15 shadow-2xs transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded-sm border-slate-300 text-teal-700 focus:ring-teal-600 accent-teal-700 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-semibold">Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-700 via-slate-900 to-teal-800 hover:from-teal-800 hover:to-slate-950 active:scale-[0.99] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-950/20 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In To Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between text-xs">
            <span className="text-teal-900 font-bold flex items-center gap-1.5 truncate max-w-[240px]">
              <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
              Active Profile:{' '}
              <span className="font-extrabold truncate">
                {selectedRoleTab === 'student'
                  ? `${activeMemberPreview?.fullName || 'Student'} (${activeMemberPreview?.membershipId || 'Member'})`
                  : 'System Administrator'}
              </span>
            </span>
            <span className="font-mono text-[11px] text-teal-800 font-extrabold bg-white px-2 py-0.5 rounded border border-teal-200 shrink-0">
              Password@123
            </span>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500 font-semibold">
            Require new institutional membership?{' '}
            <Link to="/register" className="text-teal-800 hover:text-teal-950 font-black underline underline-offset-4">
              Apply for card
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};
