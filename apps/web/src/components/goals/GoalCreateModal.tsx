'use client';

// ============================================================
// Premium Goal Creation Wizard — AtomQuest OKR Suite
// Animated 3-step form with dynamic live-preview card
// ============================================================

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Target, AlertCircle, Loader2, Sparkles, ArrowRight, ArrowLeft, Check,
  FileText, Calendar, ShieldCheck, Share2, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';

const UOM_TYPES = [
  { value: 'NUMERIC_MAX', label: 'Numeric Max (Higher is better ↑)' },
  { value: 'NUMERIC_MIN', label: 'Numeric Min (Lower is better ↓)' },
  { value: 'PERCENTAGE',  label: 'Percentage (%)' },
  { value: 'TIMELINE',    label: 'Timeline (Date completion)' },
  { value: 'ZERO_BASED',  label: 'Zero-Based (0 = 100% score)' },
];

const THRUST_AREAS = [
  'Revenue Growth', 'Cost Optimization', 'Customer Satisfaction', 'Process Improvement',
  'Innovation & R&D', 'Compliance & Governance', 'People Development',
  'Digital Transformation', 'Quality Assurance', 'Supply Chain', 'Safety & Environment',
];

const goalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  thrustArea: z.string().min(1, 'Select a thrust area'),
  uomType: z.string().min(1, 'Select a UoM type'),
  target: z.coerce.number().min(0, 'Target must be ≥ 0'),
  weightage: z.coerce.number().min(10, 'Minimum weightage is 10%').max(100, 'Maximum weightage is 100%'),
  timeline: z.string().min(1, 'Select a deadline'),
  isShared: z.boolean().default(false),
});
type GoalFormData = z.infer<typeof goalSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}

export function GoalCreateModal({ open, onClose, onSuccess, token }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState<any[]>([]);

  const {
    register, handleSubmit, reset, watch, trigger,
    formState: { errors, isValid },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    mode: 'all',
    defaultValues: { isShared: false, weightage: 20 },
  });

  // Listen to form fields for live preview compilation
  const liveTitle = watch('title');
  const liveDescription = watch('description');
  const liveThrustArea = watch('thrustArea');
  const liveUomType = watch('uomType');
  const liveTarget = watch('target');
  const liveWeightage = watch('weightage');
  const liveTimeline = watch('timeline');
  const liveIsShared = watch('isShared');

  useEffect(() => {
    if (!open || !token) return;
    getApiClient(token).get('/cycles').then((r) => setCycles(r.data || []));
    setStep(1);
  }, [open, token]);

  // Handle listening for global trigger events
  useEffect(() => {
    const handleLaunch = () => {
      reset();
      setStep(1);
    };
    window.addEventListener('launch-goal-wizard', handleLaunch);
    return () => window.removeEventListener('launch-goal-wizard', handleLaunch);
  }, [reset]);

  const nextStep = async () => {
    // Validate current step fields before going next
    let isValidStep = false;
    if (step === 1) {
      isValidStep = await trigger(['title', 'description', 'thrustArea']);
    } else if (step === 2) {
      isValidStep = await trigger(['uomType', 'target']);
    }

    if (isValidStep) {
      setStep((s) => s + 1);
    } else {
      toast.error('Please resolve all validation rules on this step first.');
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const onSubmit = async (data: GoalFormData) => {
    setLoading(true);
    try {
      const api = getApiClient(token);
      const activeCycle = cycles.find((c) => c.isActive);
      await api.post('/goals', {
        ...data,
        cycleId: activeCycle?.id || null,
      });
      toast.success('OKR goal sheet created successfully!');
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { type: 'spring', damping: 25, stiffness: 220 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.15 } }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-40"
          />

          {/* Dialog Viewport */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Left Side: Step inputs form container */}
              <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto border-r border-slate-100 dark:border-slate-800">
                
                {/* Wizard step progress headers */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <Target className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step} of 3</span>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Step status bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-6 flex gap-1">
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-indigo-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-indigo-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-indigo-500' : 'bg-transparent'}`} />
                  </div>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 my-4 flex-1">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-4"
                      >
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Goal Essence</h2>
                          <p className="text-xs text-slate-400">Describe what you will achieve and what the core target focus is.</p>
                        </div>

                        <div>
                          <label className="form-label">Goal Sheet Title *</label>
                          <input {...register('title')} placeholder="e.g., Deliver Fan Controller Firmware v3.0"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          {errors.title && <p className="form-error"><AlertCircle className="w-3.5 h-3.5" />{errors.title.message}</p>}
                        </div>

                        <div>
                          <label className="form-label">Key Objective Description *</label>
                          <textarea {...register('description')} rows={3}
                            placeholder="Detail your target, key results, and exact business value impact..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                          {errors.description && <p className="form-error"><AlertCircle className="w-3.5 h-3.5" />{errors.description.message}</p>}
                        </div>

                        <div>
                          <label className="form-label">Select Thrust Area *</label>
                          <select {...register('thrustArea')}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Choose an organizational area...</option>
                            {THRUST_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                          </select>
                          {errors.thrustArea && <p className="form-error">{errors.thrustArea.message}</p>}
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-4"
                      >
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Metric Framework</h2>
                          <p className="text-xs text-slate-400">Select how your success will be mathematically calculated.</p>
                        </div>

                        <div>
                          <label className="form-label">Unit of Measurement (UoM) *</label>
                          <select {...register('uomType')}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Choose a tracking UoM type...</option>
                            {UOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          {errors.uomType && <p className="form-error">{errors.uomType.message}</p>}
                        </div>

                        <div>
                          <label className="form-label">Objective Target Metric Value *</label>
                          <input {...register('target')} type="number" min="0" step="any" placeholder="e.g. 100"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          {errors.target && <p className="form-error">{errors.target.message}</p>}
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-4"
                      >
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">OKR Priority & Timing</h2>
                          <p className="text-xs text-slate-400">Lock the cycle weightage and quarterly timeline boundaries.</p>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="form-label !mb-0">Cycle Weightage (%) *</label>
                            <span className="text-xs font-extrabold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">{liveWeightage || 20}%</span>
                          </div>
                          <input {...register('weightage')} type="range" min="10" max="100" step="5"
                            className="w-full accent-indigo-500" />
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>Min 10%</span>
                            <span>Standard OKR weightage</span>
                            <span>Max 100%</span>
                          </div>
                          {errors.weightage && <p className="form-error"><AlertCircle className="w-3.5 h-3.5" />{errors.weightage.message}</p>}
                        </div>

                        <div>
                          <label className="form-label">Locked Target Deadline *</label>
                          <input {...register('timeline')} type="date"
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          {errors.timeline && <p className="form-error">{errors.timeline.message}</p>}
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-violet-500/5 rounded-2xl border border-violet-500/10">
                          <input {...register('isShared')} type="checkbox" id="isShared"
                            className="w-4.5 h-4.5 rounded accent-indigo-500 cursor-pointer" />
                          <label htmlFor="isShared" className="text-xs text-slate-600 dark:text-slate-350 cursor-pointer select-none">
                            <span className="font-bold text-slate-800 dark:text-white block mb-0.5">Align as a Shared Goal Target</span>
                            <span>Synchronizes achievements with company-wide alignments automatically.</span>
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>

                {/* Footer Controls */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {step > 1 ? (
                    <button type="button" onClick={prevStep} className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <button type="button" onClick={nextStep} className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all">
                      Next Step <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSubmit(onSubmit)}
                      className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> Lock & Submit OKR
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Right Side: Live preview OKR card compiles */}
              <div className="hidden md:flex w-[320px] bg-slate-50 dark:bg-slate-950 p-6 flex-col justify-center relative overflow-hidden select-none">
                <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 blur-3xl rounded-full -mr-8 -mt-8" />
                
                <div className="mb-6 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Live Preview Compilation</span>
                </div>

                {/* Simulated OKR Card */}
                <div className="glass-premium rounded-2xl p-5 relative overflow-hidden border-indigo-500/10 neon-glow-indigo bg-white dark:bg-slate-900/60 shadow-xl min-h-[220px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="bg-indigo-500/10 text-indigo-500 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
                        {liveThrustArea || 'Thrust Area'}
                      </div>
                      <div className="text-[10px] text-indigo-500 font-extrabold tracking-tight bg-indigo-500/10 px-1.5 py-0.5 rounded">
                        w: {liveWeightage || 20}%
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-3 line-clamp-2 leading-snug">
                      {liveTitle || 'Untitled OKR Sheet'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {liveDescription || 'As you compile the core metrics on the left, this live card reflects exactly how your OKR is stored.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Due: {liveTimeline ? new Date(liveTimeline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Q4 Locked'}</span>
                    </div>
                    {liveIsShared && (
                      <span className="flex items-center gap-1 text-violet-500">
                        <Share2 className="w-3 h-3" /> Shared
                      </span>
                    )}
                  </div>
                </div>

                {/* Helpful instructions footer */}
                <div className="mt-8 text-[11px] text-slate-400 leading-relaxed font-medium flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span>Your goals are locked on validation and sent directly to Prisma DB, making them trackable for aggregate manager appraisals.</span>
                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
