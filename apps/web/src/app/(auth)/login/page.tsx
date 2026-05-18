'use client';

// ============================================================
// Login Page — AtomQuest Portal
// Premium animated login form with demo user quick-select
// ============================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, Target, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

const DEMO_USERS = [
  { label: 'Admin / HR', email: 'admin@atomberg.com', password: 'Admin@123', role: 'ADMIN', color: 'from-red-500 to-rose-600' },
  { label: 'Manager 1', email: 'manager1@atomberg.com', password: 'Manager@123', role: 'MANAGER', color: 'from-blue-500 to-indigo-600' },
  { label: 'Manager 2', email: 'manager2@atomberg.com', password: 'Manager@123', role: 'MANAGER', color: 'from-blue-400 to-indigo-500' },
  { label: 'Employee 1', email: 'emp1@atomberg.com', password: 'Employee@123', role: 'EMPLOYEE', color: 'from-green-500 to-emerald-600' },
  { label: 'Employee 2', email: 'emp2@atomberg.com', password: 'Employee@123', role: 'EMPLOYEE', color: 'from-teal-500 to-cyan-600' },
  { label: 'Employee 3', email: 'emp3@atomberg.com', password: 'Employee@123', role: 'EMPLOYEE', color: 'from-violet-500 to-purple-600' },
];

const FEATURES = [
  { icon: Target, label: 'Goal Management', desc: 'Set & track OKRs with precision' },
  { icon: TrendingUp, label: 'Analytics', desc: 'Real-time performance insights' },
  { icon: Shield, label: 'RBAC Security', desc: 'Enterprise-grade access control' },
  { icon: Users, label: 'Team Workflows', desc: 'Collaborative approval processes' },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const currentEmail = watch('email');

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password. Please try again.');
      } else {
        toast.success('Welcome back! Redirecting...');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (user: typeof DEMO_USERS[0]) => {
    setValue('email', user.email);
    setValue('password', user.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/15 blur-3xl" />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-glow">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-xl tracking-tight">AtomQuest</div>
            <div className="text-indigo-300 text-xs">by Atomberg Technologies</div>
          </div>
        </motion.div>

        {/* Hero text */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold text-white leading-tight">
              Goal Setting &{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Performance
              </span>{' '}
              Portal
            </h1>
            <p className="text-indigo-200 mt-3 text-lg leading-relaxed">
              Align your team, track progress, and achieve extraordinary results with enterprise-grade OKR management.
            </p>
          </motion.div>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              >
                <feat.icon className="w-5 h-5 text-indigo-400 mb-2" />
                <div className="text-white text-sm font-semibold">{feat.label}</div>
                <div className="text-indigo-300 text-xs mt-1">{feat.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-indigo-400 text-sm"
        >
          © 2025 Atomberg Technologies · AtomQuest Hackathon 1.0
        </motion.div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">AtomQuest</span>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200/50 dark:border-slate-700">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                Sign in to your AtomQuest account
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="form-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@atomberg.com"
                  {...register('email')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                             bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white
                             placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:border-transparent transition-all text-sm"
                />
                {errors.email && (
                  <p className="form-error">
                    <span>⚠</span> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="form-label" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...register('password')}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700
                               bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white
                               placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
                               focus:border-transparent transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">
                    <span>⚠</span> {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-violet-600
                           hover:from-indigo-500 hover:to-violet-500 text-white font-semibold
                           rounded-xl transition-all duration-200 flex items-center justify-center gap-2
                           disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 font-medium">Quick Demo Login</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Demo user quick-select */}
            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map((user) => (
                <motion.button
                  key={user.email}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => quickLogin(user)}
                  className={`
                    relative overflow-hidden px-2 py-2.5 rounded-xl text-white text-xs font-medium
                    bg-gradient-to-br ${user.color} transition-all duration-200 text-center
                    ${currentEmail === user.email ? 'ring-2 ring-offset-1 ring-white/50 shadow-lg' : ''}
                  `}
                >
                  <div className="font-semibold">{user.label}</div>
                  <div className="opacity-75 text-[10px] mt-0.5">{user.role}</div>
                </motion.button>
              ))}
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
              Click a demo card to auto-fill credentials
            </p>
          </div>

          {/* Hackathon badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs">
              <Zap className="w-3 h-3 text-amber-400" />
              AtomQuest Hackathon 1.0 · Enterprise Portal
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
