// ============================================================
// Check-ins Service — Quarterly check-in with window enforcement
// ============================================================

import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { GoalStatus, Quarter, UoMType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class CheckinsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Determines the currently active quarter from the active reporting cycle. */
  private async getActiveQuarter(): Promise<Quarter | null> {
    const cycle = await this.prisma.reportingCycle.findFirst({ where: { isActive: true } });
    if (!cycle) return null;

    const now = new Date();
    if (now >= cycle.q1Start && now <= cycle.q1End) return Quarter.Q1;
    if (now >= cycle.q2Start && now <= cycle.q2End) return Quarter.Q2;
    if (now >= cycle.q3Start && now <= cycle.q3End) return Quarter.Q3;
    if (now >= cycle.q4Start && now <= cycle.q4End) return Quarter.Q4;
    return null;
  }

  /** Progress calculation — mirrors shared package. */
  private computeProgress(uomType: UoMType, target: number, achievement: number): number {
    const clamp = (v: number) => Math.max(0, Math.min(100, v));
    if (!target && uomType !== UoMType.ZERO_BASED) return 0;
    switch (uomType) {
      case UoMType.NUMERIC_MAX: return clamp((achievement / target) * 100);
      case UoMType.NUMERIC_MIN: return clamp(achievement <= target ? 100 : (target / achievement) * 100);
      case UoMType.PERCENTAGE: return clamp(achievement);
      case UoMType.ZERO_BASED: return achievement === 0 ? 100 : 0;
      case UoMType.TIMELINE: return achievement <= target ? 100 : 0;
      default: return 0;
    }
  }

  async create(dto: CreateCheckinDto, currentUser: { id: string }) {
    const goal = await this.prisma.goal.findUnique({ where: { id: dto.goalId } });
    if (!goal) throw new NotFoundException(`Goal ${dto.goalId} not found`);

    // Only approved/locked goals can have check-ins
    if (goal.status !== GoalStatus.APPROVED && goal.status !== GoalStatus.LOCKED) {
      throw new BadRequestException('Check-ins can only be added to approved goals');
    }

    // Verify ownership
    if (goal.ownerId !== currentUser.id) {
      throw new ForbiddenException('You can only submit check-ins for your own goals');
    }

    // Enforce quarter window
    const activeQuarter = await this.getActiveQuarter();
    if (!activeQuarter) {
      throw new BadRequestException(
        'No check-in window is currently open. Check-ins are accepted during Q1 (July), Q2 (October), Q3 (January), Q4 (March/April).',
      );
    }
    if (dto.quarter !== activeQuarter) {
      throw new BadRequestException(
        `Only ${activeQuarter} check-ins are currently accepted. Submitted: ${dto.quarter}`,
      );
    }

    // Check for duplicate check-in in this quarter
    const existing = await this.prisma.goalCheckin.findUnique({
      where: { goalId_quarter: { goalId: dto.goalId, quarter: dto.quarter } },
    });
    if (existing) {
      throw new BadRequestException(
        `A check-in for ${dto.quarter} already exists for this goal. Contact Admin to update.`,
      );
    }

    const progressPercent = this.computeProgress(goal.uomType as UoMType, goal.target, dto.achievement);

    const checkin = await this.prisma.goalCheckin.create({
      data: {
        goalId: dto.goalId,
        quarter: dto.quarter,
        achievement: dto.achievement,
        progressPercent,
        notes: dto.notes || '',
        createdById: currentUser.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Update the goal's current achievement value
    await this.prisma.goal.update({
      where: { id: dto.goalId },
      data: { achievement: dto.achievement },
    });

    // Record KPI history
    await this.prisma.kPIHistory.create({
      data: {
        goalId: dto.goalId,
        quarter: dto.quarter,
        value: progressPercent,
      },
    });

    // If shared goal, sync achievement to the master record
    if (goal.isShared && goal.sharedGoalId) {
      await this.prisma.sharedGoal.update({
        where: { id: goal.sharedGoalId },
        data: { achievement: dto.achievement },
      });
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'GoalCheckin',
        entityId: checkin.id,
        action: 'CREATE_CHECKIN',
        changedById: currentUser.id,
        after: JSON.stringify({ quarter: dto.quarter, achievement: dto.achievement, progressPercent }),
        goalId: dto.goalId,
      },
    });

    return checkin;
  }

  async findByGoal(goalId: string) {
    return this.prisma.goalCheckin.findMany({
      where: { goalId },
      orderBy: { createdAt: 'asc' },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  async findMyCheckins(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true, uomType: true, target: true, weightage: true },
    });
    const goalIds = goals.map((g) => g.id);

    const checkins = await this.prisma.goalCheckin.findMany({
      where: { goalId: { in: goalIds } },
      include: { goal: { select: { id: true, title: true, uomType: true, target: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const activeQuarter = await this.getActiveQuarter();
    return { checkins, activeQuarter };
  }

  async getActiveWindow() {
    const cycle = await this.prisma.reportingCycle.findFirst({ where: { isActive: true } });
    const activeQuarter = await this.getActiveQuarter();
    return { activeQuarter, cycle };
  }
}
