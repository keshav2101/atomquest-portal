// ============================================================
// Progress Calculation Engine — AtomQuest Portal
// Pure functions — testable, used on both client and server
// ============================================================

import { UoMType } from './types';

/**
 * Clamps a number between min and max (inclusive).
 */
function clamp(value: number, min = 0, max = 100): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.max(min, Math.min(max, value));
}

/**
 * Core progress calculation dispatcher.
 * Returns a percentage (0–100) based on UoM type.
 */
export function calculateProgress(
  uomType: UoMType,
  target: number | null | undefined,
  achievement: number | null | undefined,
  deadlineDate?: string | null,      // ISO string — for TIMELINE type
  completionDate?: string | null,    // ISO string — for TIMELINE type
): number {
  // Gracefully handle missing values
  if (target == null || achievement == null) return 0;
  if (target === 0) {
    // Division-by-zero protection
    if (uomType === UoMType.ZERO_BASED) return achievement === 0 ? 100 : 0;
    return 0;
  }

  switch (uomType) {
    case UoMType.NUMERIC_MAX:
      // Higher achievement = better; e.g. sales revenue
      return clamp((achievement / target) * 100);

    case UoMType.NUMERIC_MIN:
      // Lower achievement = better; e.g. defect rate, cost
      // 100% if achievement <= target, prorated otherwise
      return clamp(achievement <= target ? 100 : (target / achievement) * 100);

    case UoMType.PERCENTAGE:
      // Achievement IS the percentage (clamped to 0–100)
      return clamp(achievement);

    case UoMType.TIMELINE: {
      if (!deadlineDate || !completionDate) return 0;
      const deadline = new Date(deadlineDate).getTime();
      const completion = new Date(completionDate).getTime();
      // On-time or early = 100%; late = proportionally lower
      if (completion <= deadline) return 100;
      // Late penalty: each day late reduces by a fraction
      const totalDays = deadline - new Date(deadlineDate).getTime(); // 0 if same
      // Simplified: > deadline = 0 (binary on-time check)
      return 0;
    }

    case UoMType.ZERO_BASED:
      // Zero achievement = goal achieved (e.g. zero accidents)
      return achievement === 0 ? 100 : 0;

    default:
      return 0;
  }
}

/**
 * Calculates the weighted overall progress for a set of goals.
 * Weightages must sum to 100; this returns a weighted average.
 */
export function calculateOverallProgress(
  goals: Array<{
    uomType: UoMType;
    target: number | null;
    achievement: number | null;
    weightage: number;
    timeline?: string | null;
  }>,
): number {
  if (!goals || goals.length === 0) return 0;

  const totalWeight = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = goals.reduce((sum, g) => {
    const progress = calculateProgress(
      g.uomType as UoMType,
      g.target,
      g.achievement,
    );
    return sum + progress * g.weightage;
  }, 0);

  return clamp(weightedSum / totalWeight);
}

/**
 * Validates that all goal weightages sum to 100.
 */
export function validateWeightageSum(weightages: number[]): boolean {
  const total = weightages.reduce((sum, w) => sum + w, 0);
  return Math.round(total) === 100;
}

/**
 * Validates individual goal weightage constraints.
 */
export function validateWeightage(weightage: number): { valid: boolean; error?: string } {
  if (weightage < 10) return { valid: false, error: 'Minimum weightage is 10%' };
  if (weightage > 100) return { valid: false, error: 'Maximum weightage is 100%' };
  return { valid: true };
}

/**
 * Get a human-readable label for a UoM type.
 */
export function getUoMLabel(uomType: UoMType): string {
  const labels: Record<UoMType, string> = {
    [UoMType.NUMERIC_MAX]: 'Numeric (Max ↑)',
    [UoMType.NUMERIC_MIN]: 'Numeric (Min ↓)',
    [UoMType.PERCENTAGE]:  'Percentage (%)',
    [UoMType.TIMELINE]:    'Timeline (Date)',
    [UoMType.ZERO_BASED]:  'Zero-Based',
  };
  return labels[uomType] ?? uomType;
}

/**
 * Returns a color class for a progress percentage.
 */
export function getProgressColor(percent: number): string {
  if (percent >= 90) return 'green';
  if (percent >= 70) return 'blue';
  if (percent >= 50) return 'yellow';
  return 'red';
}

/**
 * Determines if a quarterly check-in window is currently open.
 * Windows: Q1→July, Q2→October, Q3→January, Q4→March/April
 */
export function getActiveQuarter(
  cycle: {
    q1Start: string; q1End: string;
    q2Start: string; q2End: string;
    q3Start: string; q3End: string;
    q4Start: string; q4End: string;
  },
  now = new Date(),
): 'Q1' | 'Q2' | 'Q3' | 'Q4' | null {
  const ts = now.getTime();
  if (ts >= new Date(cycle.q1Start).getTime() && ts <= new Date(cycle.q1End).getTime()) return 'Q1';
  if (ts >= new Date(cycle.q2Start).getTime() && ts <= new Date(cycle.q2End).getTime()) return 'Q2';
  if (ts >= new Date(cycle.q3Start).getTime() && ts <= new Date(cycle.q3End).getTime()) return 'Q3';
  if (ts >= new Date(cycle.q4Start).getTime() && ts <= new Date(cycle.q4End).getTime()) return 'Q4';
  return null;
}
