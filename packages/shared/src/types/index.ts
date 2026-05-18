// ============================================================
// Shared Types — AtomQuest Portal
// Used across frontend (Next.js) and backend (NestJS)
// ============================================================

// --- Roles ---
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

// --- Goal Statuses ---
export enum GoalStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  LOCKED = 'LOCKED',
  COMPLETED = 'COMPLETED',
}

// --- UoM Types ---
export enum UoMType {
  NUMERIC_MIN = 'NUMERIC_MIN', // Lower is better (e.g. defect rate)
  NUMERIC_MAX = 'NUMERIC_MAX', // Higher is better (e.g. revenue)
  PERCENTAGE  = 'PERCENTAGE',  // Direct percentage
  TIMELINE    = 'TIMELINE',    // Date-based completion
  ZERO_BASED  = 'ZERO_BASED',  // Achievement=0 means 100%
}

// --- Quarter Labels ---
export enum Quarter {
  Q1 = 'Q1', // July check-in
  Q2 = 'Q2', // October check-in
  Q3 = 'Q3', // January check-in
  Q4 = 'Q4', // March/April check-in
}

// --- Approval Actions ---
export enum ApprovalAction {
  APPROVE = 'APPROVE',
  REJECT  = 'REJECT',
}

// --- Escalation Status ---
export enum EscalationStatus {
  OPEN       = 'OPEN',
  ESCALATED  = 'ESCALATED',
  RESOLVED   = 'RESOLVED',
}

// --- Notification Types ---
export enum NotificationType {
  GOAL_SUBMITTED         = 'GOAL_SUBMITTED',
  GOAL_APPROVED          = 'GOAL_APPROVED',
  GOAL_REJECTED          = 'GOAL_REJECTED',
  CHECKIN_REMINDER       = 'CHECKIN_REMINDER',
  ESCALATION_WARNING     = 'ESCALATION_WARNING',
  GOAL_LOCKED            = 'GOAL_LOCKED',
  CYCLE_OPENED           = 'CYCLE_OPENED',
  COMMENT_ADDED          = 'COMMENT_ADDED',
}

// --- Thrust Areas ---
export const THRUST_AREAS = [
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

export type ThrustArea = (typeof THRUST_AREAS)[number];

// --- Core Entity Types ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string;
  managerId?: string;
  employeeId: string;
  isActive: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headId?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  thrustArea: ThrustArea;
  uomType: UoMType;
  target: number;
  achievement?: number;
  weightage: number;
  status: GoalStatus;
  timeline: string;          // ISO date string (deadline)
  ownerId: string;
  owner?: User;
  isShared: boolean;
  sharedGoalId?: string;
  checkins: GoalCheckin[];
  comments: GoalComment[];
  auditHistory: AuditLog[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalCheckin {
  id: string;
  goalId: string;
  quarter: Quarter;
  achievement: number;
  progressPercent: number;
  notes: string;
  createdById: string;
  createdAt: string;
}

export interface GoalComment {
  id: string;
  goalId: string;
  content: string;
  authorId: string;
  author?: User;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changedById: string;
  changedBy?: User;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface ReportingCycle {
  id: string;
  name: string;
  year: number;
  q1Start: string;
  q1End: string;
  q2Start: string;
  q2End: string;
  q3Start: string;
  q3End: string;
  q4Start: string;
  q4End: string;
  isActive: boolean;
  createdAt: string;
}

export interface Escalation {
  id: string;
  type: string;
  description: string;
  targetId: string;
  targetType: string;
  level: number;       // 1=Employee, 2=Manager, 3=SkipLevel, 4=HR
  status: EscalationStatus;
  assignedToId: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface KPIHistory {
  id: string;
  goalId: string;
  quarter: Quarter;
  value: number;
  recordedAt: string;
}

// --- Dashboard Summary Types ---
export interface EmployeeDashboard {
  totalGoals: number;
  completionPercent: number;
  pendingCheckins: number;
  approvedGoals: number;
  draftGoals: number;
  submittedGoals: number;
  quarterlyTrend: QuarterlyTrend[];
  recentNotifications: Notification[];
}

export interface ManagerDashboard {
  teamSize: number;
  pendingApprovals: number;
  teamCompletionPercent: number;
  delayedSubmissions: number;
  teamGoalDistribution: GoalStatusCount[];
  quarterlyTrend: QuarterlyTrend[];
  topPerformers: UserPerformance[];
  escalations: Escalation[];
}

export interface AdminDashboard {
  totalUsers: number;
  totalGoals: number;
  orgCompletionPercent: number;
  totalEscalations: number;
  departmentBreakdown: DepartmentStats[];
  userActivity: UserActivity[];
  goalStatusDistribution: GoalStatusCount[];
}

export interface QuarterlyTrend {
  quarter: string;
  completion: number;
}

export interface GoalStatusCount {
  status: GoalStatus;
  count: number;
}

export interface UserPerformance {
  userId: string;
  name: string;
  completion: number;
}

export interface UserActivity {
  userId: string;
  name: string;
  lastActive: string;
  actionsCount: number;
}

export interface DepartmentStats {
  departmentId: string;
  name: string;
  completion: number;
  goalCount: number;
  userCount: number;
}
