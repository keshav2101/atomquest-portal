// ============================================================
// Escalations Service — Rule-based escalation engine
// Cron job runs daily, checks for violations
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscalationStatus, GoalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscalationsService {
  private readonly logger = new Logger(EscalationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Daily cron: check for escalation-worthy conditions */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async runEscalationEngine() {
    this.logger.log('🔔 Running escalation engine...');
    await this.checkGoalNotSubmitted();
    await this.checkApprovalPending();
    await this.checkCheckinIncomplete();
    this.logger.log('✅ Escalation engine complete');
  }

  /** Rule 1: Employees who haven't submitted goals 7+ days before cycle end */
  private async checkGoalNotSubmitted() {
    const cycle = await this.prisma.reportingCycle.findFirst({ where: { isActive: true } });
    if (!cycle) return;

    const employees = await this.prisma.user.findMany({
      where: { role: 'EMPLOYEE', isActive: true },
      select: { id: true, name: true, managerId: true },
    });

    for (const emp of employees) {
      const submittedGoal = await this.prisma.goal.findFirst({
        where: { ownerId: emp.id, status: { not: GoalStatus.DRAFT } },
      });
      if (!submittedGoal) {
        const existing = await this.prisma.escalation.findFirst({
          where: { targetId: emp.id, type: 'GOAL_NOT_SUBMITTED', status: EscalationStatus.OPEN },
        });
        if (!existing && emp.managerId) {
          await this.prisma.escalation.create({
            data: {
              type: 'GOAL_NOT_SUBMITTED',
              description: `${emp.name} has not submitted goals for the active cycle.`,
              targetId: emp.id,
              targetType: 'User',
              level: 2,
              status: EscalationStatus.OPEN,
              assignedToId: emp.managerId,
              createdById: emp.managerId,
            },
          });
          await this.prisma.notification.create({
            data: {
              type: 'ESCALATION_WARNING',
              title: 'Escalation: Goal Not Submitted',
              message: `${emp.name} has not submitted goals. Please follow up.`,
              recipientId: emp.managerId,
              linkUrl: '/escalations',
            },
          });
        }
      }
    }
  }

  /** Rule 2: Goals pending approval for more than 5 days */
  private async checkApprovalPending() {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const pendingGoals = await this.prisma.goal.findMany({
      where: { status: GoalStatus.SUBMITTED, submittedAt: { lt: fiveDaysAgo } },
      include: { owner: { select: { managerId: true, name: true } } },
    });

    for (const goal of pendingGoals) {
      const existing = await this.prisma.escalation.findFirst({
        where: { targetId: goal.id, type: 'APPROVAL_PENDING', status: EscalationStatus.OPEN },
      });
      if (!existing && (goal.owner as any).managerId) {
        await this.prisma.escalation.create({
          data: {
            type: 'APPROVAL_PENDING',
            description: `Goal "${goal.title}" by ${(goal.owner as any).name} has been pending approval for 5+ days.`,
            targetId: goal.id,
            targetType: 'Goal',
            level: 3,
            status: EscalationStatus.OPEN,
            assignedToId: (goal.owner as any).managerId,
            createdById: (goal.owner as any).managerId,
          },
        });
      }
    }
  }

  /** Rule 3: Check-in incomplete for active quarter */
  private async checkCheckinIncomplete() {
    const cycle = await this.prisma.reportingCycle.findFirst({ where: { isActive: true } });
    if (!cycle) return;

    const now = new Date();
    let activeQuarter: string | null = null;
    if (now >= cycle.q1Start && now <= cycle.q1End) activeQuarter = 'Q1';
    else if (now >= cycle.q2Start && now <= cycle.q2End) activeQuarter = 'Q2';
    else if (now >= cycle.q3Start && now <= cycle.q3End) activeQuarter = 'Q3';
    else if (now >= cycle.q4Start && now <= cycle.q4End) activeQuarter = 'Q4';
    if (!activeQuarter) return;

    // Find approved goals without check-in for active quarter
    const approvedGoals = await this.prisma.goal.findMany({
      where: { status: { in: [GoalStatus.APPROVED] } },
      select: { id: true, title: true, ownerId: true, owner: { select: { managerId: true, name: true } } },
    });

    for (const goal of approvedGoals) {
      const checkin = await this.prisma.goalCheckin.findUnique({
        where: { goalId_quarter: { goalId: goal.id, quarter: activeQuarter as any } },
      });
      if (!checkin) {
        const existing = await this.prisma.escalation.findFirst({
          where: {
            targetId: goal.id,
            type: 'CHECKIN_INCOMPLETE',
            status: EscalationStatus.OPEN,
            metadata: { path: ['quarter'], equals: activeQuarter },
          },
        });
        if (!existing) {
          await this.prisma.escalation.create({
            data: {
              type: 'CHECKIN_INCOMPLETE',
              description: `${(goal.owner as any).name} has not submitted a ${activeQuarter} check-in for goal "${goal.title}".`,
              targetId: goal.id,
              targetType: 'Goal',
              level: 2,
              status: EscalationStatus.OPEN,
              assignedToId: (goal.owner as any).managerId ?? goal.ownerId,
              createdById: goal.ownerId,
            },
          });
        }
      }
    }
  }

  async findAll(filters: { status?: string; type?: string } = {}) {
    return this.prisma.escalation.findMany({
      where: {
        ...(filters.status ? { status: filters.status as EscalationStatus } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async resolve(id: string, note: string, adminId: string) {
    return this.prisma.escalation.update({
      where: { id },
      data: { status: EscalationStatus.RESOLVED, resolvedAt: new Date(), resolvedNote: note },
    });
  }
}
