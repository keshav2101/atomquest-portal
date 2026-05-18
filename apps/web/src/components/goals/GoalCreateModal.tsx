'use client';

// ============================================================
// Goal Create Modal — react-hook-form + zod + all field types
// ============================================================

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';

const UOM_TYPES = [
  { value: 'NUMERIC_MAX', label: 'Numeric (Max ↑) — Higher is better' },
  { value: 'NUMERIC_MIN', label: 'Numeric (Min ↓) — Lower is better' },
  { value: 'PERCENTAGE',  label: 'Percentage (%)' },
  { value: 'TIMELINE',    label: 'Timeline — Date-based completion' },
  { value: 'ZERO_BASED',  label: 'Zero-Based — 0 = 100% score' },
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
  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState<any[]>([]);

  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: { isShared: false, weightage: 20 },
  });

  useEffect(() => {
    if (!open || !token) return;
    getApiClient(token).get('/cycles').then((r) => setCycles(r.data || []));
  }, [open, token]);

  const onSubmit = async (data: GoalFormData) => {
    setLoading(true);
    try {
      const api = getApiClient(token);
      const activeCycle = cycles.find((c) => c.isActive);
      await api.post('/goals', {
        ...data,
        cycleId: activeCycle?.id || null,
      });
      toast.success('Goal created successfully!');
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl
                            border border-slate-200 dark:border-slate-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">Create New Goal</h2>
                    <p className="text-xs text-slate-400">Min 10% weightage · Max 8 goals</p>
                  </div>
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                             hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
                {/* Title */}
                <div>
                  <label className="form-label">Goal Title *</label>
                  <input {...register('title')} placeholder="e.g. Deliver Fan Controller Firmware v3.0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                               bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white
                               placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {errors.title && <p className="form-error"><AlertCircle className="w-3 h-3" />{errors.title.message}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="form-label">Description *</label>
                  <textarea {...register('description')} rows={3}
                    placeholder="Describe what this goal aims to achieve and its business impact..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                               bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white
                               placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  {errors.description && <p className="form-error"><AlertCircle className="w-3 h-3" />{errors.description.message}</p>}
                </div>

                {/* Thrust area + UoM */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Thrust Area *</label>
                    <select {...register('thrustArea')}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                                 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select area...</option>
                      {THRUST_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    {errors.thrustArea && <p className="form-error">{errors.thrustArea.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Unit of Measurement *</label>
                    <select {...register('uomType')}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                                 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select UoM...</option>
                      {UOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {errors.uomType && <p className="form-error">{errors.uomType.message}</p>}
                  </div>
                </div>

                {/* Target + Weightage */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Target Value *</label>
                    <input {...register('target')} type="number" min="0" step="any" placeholder="e.g. 100"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                                 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white
                                 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    {errors.target && <p className="form-error">{errors.target.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Weightage (%) * <span className="text-slate-400 font-normal">(min 10%)</span></label>
                    <input {...register('weightage')} type="number" min="10" max="100" step="5" placeholder="e.g. 25"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                                 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white
                                 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    {errors.weightage && <p className="form-error"><AlertCircle className="w-3 h-3" />{errors.weightage.message}</p>}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <label className="form-label">Deadline *</label>
                  <input {...register('timeline')} type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                               bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {errors.timeline && <p className="form-error">{errors.timeline.message}</p>}
                </div>

                {/* Shared goal toggle */}
                <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-900/10 rounded-xl">
                  <input {...register('isShared')} type="checkbox" id="isShared"
                    className="w-4 h-4 rounded accent-indigo-600" />
                  <label htmlFor="isShared" className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Link to a Shared/Departmental Goal</span>
                    <span className="text-slate-400 ml-1">(syncs achievement automatically)</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                               text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50
                               dark:hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm
                               font-semibold transition-colors flex items-center justify-center gap-2
                               disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Goal'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
