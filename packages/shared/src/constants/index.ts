// ============================================================
// Application Constants — AtomQuest Portal
// ============================================================

export const APP_NAME = 'AtomQuest';
export const APP_FULL_NAME = 'AtomQuest Goal & Performance Portal';
export const APP_VERSION = '1.0.0';

// --- Goal Constraints ---
export const MAX_GOALS_PER_EMPLOYEE = 8;
export const MIN_GOAL_WEIGHTAGE = 10;
export const MAX_GOAL_WEIGHTAGE = 100;
export const REQUIRED_TOTAL_WEIGHTAGE = 100;

// --- Quarter Check-in Windows (month indices, 0-based) ---
export const QUARTER_WINDOWS = {
  Q1: { month: 6,  label: 'Q1 (July)' },         // July
  Q2: { month: 9,  label: 'Q2 (October)' },       // October
  Q3: { month: 0,  label: 'Q3 (January)' },       // January
  Q4: { month: 2,  label: 'Q4 (March/April)' },   // March
};

// --- Pagination ---
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// --- Escalation Levels ---
export const ESCALATION_LEVELS = {
  1: 'Employee',
  2: 'Manager',
  3: 'Skip-Level Manager',
  4: 'HR / Admin',
} as const;

// --- Thrust Areas ---
export const THRUST_AREAS_LIST = [
  'Revenue Growth',
  'Cost Optimization',
  'Customer Satisfaction',
  'Process Improvement',
  'Innovation & R&D',
  'Compliance & Governance',
  'People Development',
  'Digital Transformation',
  'Quality Assurance',
  'Supply Chain',
  'Safety & Environment',
] as const;

// --- Status Color Map (Tailwind classes) ---
export const STATUS_COLORS: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-700 border-slate-200',
  SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:  'bg-green-50 text-green-700 border-green-200',
  REJECTED:  'bg-red-50 text-red-700 border-red-200',
  LOCKED:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

// --- Report Types ---
export const REPORT_TYPES = [
  { value: 'achievement',  label: 'Achievement Report' },
  { value: 'department',   label: 'Department Report' },
  { value: 'quarterly',    label: 'Quarterly Report' },
  { value: 'completion',   label: 'Completion Report' },
  { value: 'escalation',   label: 'Escalation Report' },
  { value: 'goal_status',  label: 'Goal Status Report' },
] as const;

// --- API Routes ---
export const API_ROUTES = {
  auth: {
    login:   '/auth/login',
    refresh: '/auth/refresh',
    me:      '/auth/me',
    logout:  '/auth/logout',
  },
  goals: {
    base:    '/goals',
    byId:    (id: string) => `/goals/${id}`,
    submit:  (id: string) => `/goals/${id}/submit`,
    approve: (id: string) => `/goals/${id}/approve`,
    reject:  (id: string) => `/goals/${id}/reject`,
    unlock:  (id: string) => `/goals/${id}/unlock`,
    comments:(id: string) => `/goals/${id}/comments`,
    audit:   (id: string) => `/goals/${id}/audit`,
  },
  checkins: {
    base:  '/checkins',
    byId:  (id: string) => `/checkins/${id}`,
  },
  analytics: {
    dashboard:    '/analytics/dashboard',
    quarterly:    '/analytics/quarterly',
    departments:  '/analytics/departments',
    managerStats: '/analytics/manager-stats',
  },
  reports: {
    generate: '/reports/generate',
    export:   '/reports/export',
  },
  audit:         '/audit-logs',
  notifications: '/notifications',
  escalations:   '/escalations',
  users:         '/users',
  departments:   '/departments',
  cycles:        '/cycles',
} as const;
