import * as client from '@prisma/client';

declare module '@prisma/client' {
  export enum Role {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    EMPLOYEE = 'EMPLOYEE'
  }

  export enum GoalStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    LOCKED = 'LOCKED',
    COMPLETED = 'COMPLETED'
  }

  export enum UoMType {
    NUMERIC_MIN = 'NUMERIC_MIN',
    NUMERIC_MAX = 'NUMERIC_MAX',
    PERCENTAGE = 'PERCENTAGE',
    TIMELINE = 'TIMELINE',
    ZERO_BASED = 'ZERO_BASED'
  }

  export enum Quarter {
    Q1 = 'Q1',
    Q2 = 'Q2',
    Q3 = 'Q3',
    Q4 = 'Q4'
  }

  export enum NotificationType {
    GOAL_SUBMITTED = 'GOAL_SUBMITTED',
    GOAL_APPROVED = 'GOAL_APPROVED',
    GOAL_REJECTED = 'GOAL_REJECTED',
    CHECKIN_REMINDER = 'CHECKIN_REMINDER',
    ESCALATION_WARNING = 'ESCALATION_WARNING',
    GOAL_LOCKED = 'GOAL_LOCKED',
    CYCLE_OPENED = 'CYCLE_OPENED',
    COMMENT_ADDED = 'COMMENT_ADDED'
  }

  export enum EscalationStatus {
    OPEN = 'OPEN',
    ESCALATED = 'ESCALATED',
    RESOLVED = 'RESOLVED'
  }
}
