// ============================================================
// Approvals Service — Manager goal approval workflow
// ============================================================

import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { GoalStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalActionDto } from './dto/approval-action.dto';

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns all submitted goals pending approval for the current manager. */
  async getPendingApprovals(managerId: string) {
    const teamIds = await this.prisma.user
      .findMany({ where: { managerId, isActive: true }, select: { id: true } })
      .then((u) => u.map((x) => x.id));

    return this.prisma.goal.findMany({
      where: { ownerId: { in: teamIds }, status: GoalStatus.SUBMITTED },
      include: {
        owner: { select: { id: true, name: true, email: true, employeeId: true, department: { select: { name: true } } } },
        cycle: { select: { id: true, name: true } },
        _count: { select: { checkins: true } },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  /** Manager approves or rejects a submitted goal. */
  async processApproval(
    goalId: string,
    dto: ApprovalActionDto,
    manager: { id: string; role: Role },
  ) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException(`Goal ${goalId} not found`);
    if (goal.status !== GoalStatus.SUBMITTED) {
      throw new BadRequestException(`Goal is not in SUBMITTED status. Current: ${goal.status}`);
    }

    // Verify manager owns this report
    if (manager.role === Role.MANAGER) {
      const owner = await this.prisma.user.findUnique({ where: { id: goal.ownerId } });
      if (!owner || owner.managerId !== manager.id) {
        throw new ForbiddenException('This employee is not in your team');
      }
    }

    const isApprove = dto.action === 'APPROVE';

    const updated = await this.prisma.goal.update({
      where: { id: goalId },
      data: {
        status: isApprove ? GoalStatus.APPROVED : GoalStatus.REJECTED,
        approverId: manager.id,
        approvedAt: isApprove ? new Date() : undefined,
        rejectedAt: !isApprove ? new Date() : undefined,
        // Inline edits by manager during approval
        weightage: dto.adjustedWeightage ?? undefined,
        target: dto.adjustedTarget ?? undefined,
        // Lock on approval
        isLocked: isApprove,
        lockedAt: isApprove ? new Date() : undefined,
        lockedById: isApprove ? manager.id : undefined,
      },
      include: { owner: true },
    });

    // Add manager comment if provided
    if (dto.comment) {
      await this.prisma.goalComment.create({
        data: { goalId, content: dto.comment, authorId: manager.id },
      });
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Goal',
        entityId: goalId,
        action: isApprove ? 'APPROVE' : 'REJECT',
        changedById: manager.id,
        before: { status: GoalStatus.SUBMITTED },
        after: { status: updated.status, isLocked: updated.isLocked },
        metadata: dto.comment ? { comment: dto.comment } : undefined,
        goalId,
      },
    });

    // Notify goal owner
    await this.prisma.notification.create({
      data: {
        type: isApprove ? 'GOAL_APPROVED' : 'GOAL_REJECTED',
        title: isApprove ? 'Goal Approved ✅' : 'Goal Rejected ❌',
        message: isApprove
          ? `Your goal "${goal.title}" has been approved.`
          : `Your goal "${goal.title}" was rejected. Reason: ${dto.comment || 'No comment provided.'}`,
        recipientId: goal.ownerId,
        linkUrl: `/goals/${goalId}`,
      },
    });

    return updated;
  }

  /** Bulk-approve all submitted goals for an employee. */
  async bulkApprove(ownerId: string, manager: { id: string; role: Role }) {
    const goals = await this.prisma.goal.findMany({
      where: { ownerId, status: GoalStatus.SUBMITTED },
    });
    if (goals.length === 0) throw new BadRequestException('No submitted goals found for this employee');

    const results = await Promise.all(
      goals.map((g) =>
        this.processApproval(g.id, { action: 'APPROVE', comment: 'Bulk approved' }, manager),
      ),
    );
    return { message: `Approved ${results.length} goals`, goals: results };
  }
}
