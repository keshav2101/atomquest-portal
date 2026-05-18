import { z } from 'zod';
import { UoMType, GoalStatus, Role, Quarter } from '../types';

// ============================================================
// Shared Zod Validation Schemas — AtomQuest Portal
// Used by frontend (React Hook Form) and backend (NestJS DTOs)
// ============================================================

// --- Auth ---
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// --- Goal ---
export const CreateGoalSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  thrustArea: z.string().min(1, 'Thrust area is required'),
  uomType: z.nativeEnum(UoMType, { errorMap: () => ({ message: 'Invalid UoM type' }) }),
  target: z.number({ required_error: 'Target is required' }).min(0, 'Target must be >= 0'),
  weightage: z
    .number({ required_error: 'Weightage is required' })
    .min(10, 'Minimum weightage is 10%')
    .max(100, 'Maximum weightage is 100%'),
  timeline: z.string().min(1, 'Timeline/deadline is required'),
  isShared: z.boolean().default(false),
  sharedGoalId: z.string().optional().nullable(),
});
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;

export const UpdateGoalSchema = CreateGoalSchema.partial().extend({
  id: z.string().uuid('Invalid goal ID'),
});
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;

// --- Check-in ---
export const CreateCheckinSchema = z.object({
  goalId: z.string().uuid('Invalid goal ID'),
  quarter: z.nativeEnum(Quarter, { errorMap: () => ({ message: 'Invalid quarter' }) }),
  achievement: z.number({ required_error: 'Achievement is required' }).min(0),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().default(''),
});
export type CreateCheckinInput = z.infer<typeof CreateCheckinSchema>;

// --- Approval ---
export const ApprovalActionSchema = z.object({
  goalId: z.string().uuid('Invalid goal ID'),
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().max(500).optional(),
  adjustedWeightage: z.number().min(10).max(100).optional(),
  adjustedTarget: z.number().min(0).optional(),
});
export type ApprovalActionInput = z.infer<typeof ApprovalActionSchema>;

// --- Comment ---
export const CreateCommentSchema = z.object({
  goalId: z.string().uuid('Invalid goal ID'),
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
});
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

// --- User ---
export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  role: z.nativeEnum(Role),
  departmentId: z.string().uuid('Invalid department'),
  managerId: z.string().uuid().optional().nullable(),
  employeeId: z.string().min(1, 'Employee ID is required').max(20),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = CreateUserSchema
  .omit({ password: true })
  .partial()
  .extend({ id: z.string().uuid() });
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// --- Reporting Cycle ---
export const CreateCycleSchema = z.object({
  name: z.string().min(1, 'Cycle name is required'),
  year: z.number().min(2020).max(2100),
  q1Start: z.string().min(1),
  q1End: z.string().min(1),
  q2Start: z.string().min(1),
  q2End: z.string().min(1),
  q3Start: z.string().min(1),
  q3End: z.string().min(1),
  q4Start: z.string().min(1),
  q4End: z.string().min(1),
}).refine(
  (data) => new Date(data.q1End) > new Date(data.q1Start),
  { message: 'Q1 end must be after Q1 start', path: ['q1End'] },
);
export type CreateCycleInput = z.infer<typeof CreateCycleSchema>;

// --- Filters / Query Params ---
export const GoalFilterSchema = z.object({
  status: z.nativeEnum(GoalStatus).optional(),
  thrustArea: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'weightage', 'title', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type GoalFilterInput = z.infer<typeof GoalFilterSchema>;
