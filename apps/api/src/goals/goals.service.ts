// ============================================================
// Goals Service — Core business logic for goal management
// Enforces: max 8 goals, weightage constraints, lock rules,
//           progress calculation, audit logging
// ============================================================

import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { GoalStatus, Role, UoMType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { MAX_GOALS_PER_EMPLOYEE } from './goals.constants';

const GOAL_SELECT = {
  id: true,
  title: true,
  description: true,
  thrustArea: true,
  uomType: true,
  target: true,
  achievement: true,
  weightage: true,
  status: true,
  timeline: true,
  isShared: true,
  isLocked: true,
  lockedAt: true,
  sharedGoalId: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true, email: true, employeeId: true } },
  approver: { select: { id: true, name: true, email: true } },
  cycle: { select: { id: true, name: true, year: true } },
  checkins: {
    orderBy: { createdAt: 'asc' as const },
    include: { createdBy: { select: { id: true, name: true } } },
  },
  comments: {
    orderBy: { createdAt: 'desc' as const },
    include: { author: { select: { id: true, name: true, role: true } } },
  },
  _count: { select: { checkins: true, comments: true } },
};

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Helpers ----

  /**
   * Progress calculation engine — mirrors the shared package logic.
   * Kept here so the server can compute progress at check-in time.
   */
  private computeProgress(uomType: UoMType, target: number, achievement: number): number {
    if (!target || achievement == null) return 0;
    const clamp = (v: number) => Math.max(0, Math.min(100, v));
    switch (uomType) {
      case UoMType.NUMERIC_MAX:
        return clamp((achievement / target) * 100);
      case UoMType.NUMERIC_MIN:
        return clamp(achievement <= target ? 100 : (target / achievement) * 100);
      case UoMType.PERCENTAGE:
        return clamp(achievement);
      case UoMType.ZERO_BASED:
        return achievement === 0 ? 100 : 0;
      case UoMType.TIMELINE:
        return achievement <= target ? 100 : 0;
      default:
        return 0;
    }
  }

  private async assertNotLocked(goalId: string, userRole: Role) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException(`Goal ${goalId} not found`);
    if (goal.isLocked && userRole !== Role.ADMIN) {
      throw new ForbiddenException('This goal is locked. Only Admins can edit locked goals.');
    }
    return goal;
  }

  private async auditGoal(
    goalId: string,
    action: string,
    changedById: string,
    before?: object,
    after?: object,
    metadata?: object,
  ) {
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Goal',
        entityId: goalId,
        action,
        changedById,
        before: before ?? undefined,
        after: after ?? undefined,
        metadata: metadata ?? undefined,
        goalId,
      },
    });
  }

  // ---- Queries ----

  async findAll(params: {
    status?: GoalStatus;
    thrustArea?: string;
    ownerId?: string;
    departmentId?: string;
    search?: string;
    cycleId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    currentUser: { id: string; role: Role };
  }) {
    const {
      status, thrustArea, search, cycleId,
      page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc',
      currentUser,
    } = params;

    const skip = (page - 1) * limit;
    const where: any = {};

    // RBAC: employees only see their own goals
    if (currentUser.role === Role.EMPLOYEE) {
      where.ownerId = currentUser.id;
    } else if (currentUser.role === Role.MANAGER) {
      // Managers see goals from their direct reports
      const teamIds = await this.prisma.user
        .findMany({ where: { managerId: currentUser.id }, select: { id: true } })
        .then((u) => u.map((x) => x.id));
      where.ownerId = { in: teamIds };
    }
    // Admin sees all

    if (status) where.status = status;
    if (thrustArea) where.thrustArea = thrustArea;
    if (cycleId) where.cycleId = cycleId;
    if (params.ownerId && currentUser.role !== Role.EMPLOYEE) where.ownerId = params.ownerId;
    if (params.departmentId) {
      where.owner = { departmentId: params.departmentId };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { thrustArea: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [goals, total] = await Promise.all([
      this.prisma.goal.findMany({
        where,
        select: GOAL_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.goal.count({ where }),
    ]);

    return { goals, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, currentUser: { id: string; role: Role }) {
    const goal = await this.prisma.goal.findUnique({ where: { id }, select: GOAL_SELECT });
    if (!goal) throw new NotFoundException(`Goal ${id} not found`);

    // RBAC: employees can only view own goals
    if (currentUser.role === Role.EMPLOYEE && (goal.owner as any).id !== currentUser.id) {
      throw new ForbiddenException('You do not have access to this goal');
    }

    return goal;
  }

  async create(dto: CreateGoalDto, currentUser: { id: string; role: Role }) {
    const ownerId = dto.ownerId || currentUser.id;

    // Business rule: max 8 goals per employee
    const goalCount = await this.prisma.goal.count({ where: { ownerId } });
    if (goalCount >= MAX_GOALS_PER_EMPLOYEE) {
      throw new BadRequestException(
        `Maximum of ${MAX_GOALS_PER_EMPLOYEE} goals allowed per employee. Current: ${goalCount}`,
      );
    }

    // Weightage validation
    if (dto.weightage < 10) {
      throw new BadRequestException('Minimum weightage per goal is 10%');
    }

    // If shared goal, validate reference
    if (dto.isShared && dto.sharedGoalId) {
      const sharedGoal = await this.prisma.sharedGoal.findUnique({ where: { id: dto.sharedGoalId } });
      if (!sharedGoal) throw new NotFoundException(`Shared goal ${dto.sharedGoalId} not found`);
    }

    const goal = await this.prisma.goal.create({
      data: {
        title: dto.title,
        description: dto.description,
        thrustArea: dto.thrustArea,
        uomType: dto.uomType as UoMType,
        target: dto.target,
        weightage: dto.weightage,
        timeline: new Date(dto.timeline),
        ownerId,
        cycleId: dto.cycleId || null,
        isShared: dto.isShared || false,
        sharedGoalId: dto.sharedGoalId || null,
        status: GoalStatus.DRAFT,
      },
      select: GOAL_SELECT,
    });

    await this.auditGoal(goal.id, 'CREATE', currentUser.id, undefined, {
      title: goal.title, status: 'DRAFT', weightage: goal.weightage,
    });

    return goal;
  }

  async update(id: string, dto: UpdateGoalDto, currentUser: { id: string; role: Role }) {
    const existing = await this.assertNotLocked(id, currentUser.role);

    // Only owner or admin can update
    if (existing.ownerId !== currentUser.id && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only edit your own goals');
    }

    // Cannot edit approved goals (unless admin)
    if (existing.status === GoalStatus.APPROVED && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Approved goals cannot be edited. Contact Admin to unlock.');
    }

    // Shared goal: only weightage editable by employee
    if (existing.isShared && currentUser.role === Role.EMPLOYEE) {
      const updated = await this.prisma.goal.update({
        where: { id },
        data: { weightage: dto.weightage },
        select: GOAL_SELECT,
      });
      await this.auditGoal(id, 'UPDATE', currentUser.id, existing, updated, { note: 'shared-goal-weightage-only' });
      return updated;
    }

    const updated = await this.prisma.goal.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        thrustArea: dto.thrustArea,
        uomType: dto.uomType as UoMType | undefined,
        target: dto.target,
        weightage: dto.weightage,
        timeline: dto.timeline ? new Date(dto.timeline) : undefined,
        // Reset to DRAFT if edited after rejection
        status: existing.status === GoalStatus.REJECTED ? GoalStatus.DRAFT : undefined,
      },
      select: GOAL_SELECT,
    });

    await this.auditGoal(id, 'UPDATE', currentUser.id, existing, updated);
    return updated;
  }

  async submit(goalId: string, currentUser: { id: string; role: Role }) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException(`Goal ${goalId} not found`);
    if (goal.ownerId !== currentUser.id) throw new ForbiddenException('You can only submit your own goals');
    if (goal.status !== GoalStatus.DRAFT && goal.status !== GoalStatus.REJECTED) {
      throw new BadRequestException(`Goal cannot be submitted from status: ${goal.status}`);
    }

    // Validate total weightage before submission
    const allGoals = await this.prisma.goal.findMany({
      where: { ownerId: currentUser.id, status: { in: [GoalStatus.DRAFT, GoalStatus.APPROVED] } },
      select: { weightage: true },
    });
    const totalWeight = allGoals.reduce((s, g) => s + g.weightage, 0) + (goal.status === GoalStatus.DRAFT ? 0 : 0);

    // For submission, ALL goals of the employee must sum to 100
    const allOwnerGoals = await this.prisma.goal.findMany({
      where: { ownerId: currentUser.id, status: { not: GoalStatus.REJECTED } },
      select: { id: true, weightage: true },
    });
    const weightSum = allOwnerGoals.reduce((s, g) => s + g.weightage, 0);
    if (Math.round(weightSum) !== 100) {
      throw new BadRequestException(
        `Total goal weightage must equal 100%. Current total: ${weightSum}%. Please adjust goal weightages before submitting.`,
      );
    }

    const updated = await this.prisma.goal.updateMany({
      where: { ownerId: currentUser.id, status: GoalStatus.DRAFT },
      data: { status: GoalStatus.SUBMITTED, submittedAt: new Date() },
    });

    // Notify manager
    const owner = await this.prisma.user.findUnique({ where: { id: currentUser.id } });
    if (owner?.managerId) {
      await this.prisma.notification.create({
        data: {
          type: 'GOAL_SUBMITTED',
          title: 'New Goal Submission Pending Approval',
          message: `${owner.name} has submitted their goal sheet for review.`,
          recipientId: owner.managerId,
          linkUrl: '/approvals',
        },
      });
    }

    await this.auditGoal(goalId, 'SUBMIT', currentUser.id, { status: 'DRAFT' }, { status: 'SUBMITTED' });

    return { message: 'Goal sheet submitted successfully', updatedCount: updated.count };
  }

  async unlock(goalId: string, adminUser: { id: string; role: Role }) {
    if (adminUser.role !== Role.ADMIN) throw new ForbiddenException('Only admins can unlock goals');
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException(`Goal ${goalId} not found`);

    const updated = await this.prisma.goal.update({
      where: { id: goalId },
      data: { isLocked: false, lockedAt: null, status: GoalStatus.APPROVED },
      select: GOAL_SELECT,
    });

    await this.auditGoal(goalId, 'UNLOCK', adminUser.id, { isLocked: true }, { isLocked: false });
    return updated;
  }

  async delete(id: string, currentUser: { id: string; role: Role }) {
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException(`Goal ${id} not found`);
    if (goal.ownerId !== currentUser.id && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own goals');
    }
    if (goal.status !== GoalStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT goals can be deleted');
    }

    await this.prisma.goal.delete({ where: { id } });
    await this.auditGoal(id, 'DELETE', currentUser.id, goal);
    return { message: 'Goal deleted' };
  }

  async getAuditHistory(goalId: string) {
    return this.prisma.auditLog.findMany({
      where: { goalId },
      orderBy: { createdAt: 'desc' },
      include: { changedBy: { select: { id: true, name: true, role: true } } },
    });
  }

  async addComment(goalId: string, content: string, authorId: string) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException(`Goal ${goalId} not found`);

    const comment = await this.prisma.goalComment.create({
      data: { goalId, content, authorId },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    // Notify goal owner
    if (goal.ownerId !== authorId) {
      await this.prisma.notification.create({
        data: {
          type: 'COMMENT_ADDED',
          title: 'New Comment on Your Goal',
          message: `A comment was added to "${goal.title}".`,
          recipientId: goal.ownerId,
          linkUrl: `/goals/${goalId}`,
        },
      });
    }

    return comment;
  }
}
