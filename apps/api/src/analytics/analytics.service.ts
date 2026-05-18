// ============================================================
// Analytics Service — Dashboard aggregations
// ============================================================

import { Injectable } from '@nestjs/common';
import { GoalStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Employee dashboard — their own goals summary. */
  async getEmployeeDashboard(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { ownerId: userId },
      include: { checkins: true },
    });

    const totalGoals = goals.length;
    const approvedGoals = goals.filter((g) => g.status === GoalStatus.APPROVED || g.status === GoalStatus.LOCKED).length;
    const draftGoals = goals.filter((g) => g.status === GoalStatus.DRAFT).length;
    const submittedGoals = goals.filter((g) => g.status === GoalStatus.SUBMITTED).length;

    // Weighted completion
    const approvedWithCheckins = goals.filter(
      (g) => (g.status === GoalStatus.APPROVED || g.status === GoalStatus.LOCKED) && g.checkins.length > 0,
    );
    const totalWeight = approvedWithCheckins.reduce((s, g) => s + g.weightage, 0);
    const weightedProgress = totalWeight === 0
      ? 0
      : approvedWithCheckins.reduce((s, g) => {
          const lastCheckin = g.checkins[g.checkins.length - 1];
          return s + lastCheckin.progressPercent * g.weightage;
        }, 0) / totalWeight;

    const completionPercent = Math.round(weightedProgress);

    // Quarterly trend from KPI history
    const kpiHistory = await this.prisma.kPIHistory.findMany({
      where: { goalId: { in: goals.map((g) => g.id) } },
      orderBy: { recordedAt: 'asc' },
    });

    const quarterlyTrend = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
      const entries = kpiHistory.filter((k) => k.quarter === q);
      const avg = entries.length > 0
        ? Math.round(entries.reduce((s, e) => s + e.value, 0) / entries.length)
        : 0;
      return { quarter: q, completion: avg };
    });

    // Pending check-ins
    const activeGoalIds = goals
      .filter((g) => g.status === GoalStatus.APPROVED || g.status === GoalStatus.LOCKED)
      .map((g) => g.id);
    const existingCheckinGoals = new Set(
      (await this.prisma.goalCheckin.findMany({
        where: { goalId: { in: activeGoalIds } },
        select: { goalId: true },
      })).map((c) => c.goalId),
    );
    const pendingCheckins = activeGoalIds.filter((id) => !existingCheckinGoals.has(id)).length;

    const recentNotifications = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      totalGoals,
      completionPercent,
      pendingCheckins,
      approvedGoals,
      draftGoals,
      submittedGoals,
      quarterlyTrend,
      recentNotifications,
    };
  }

  /** Manager dashboard — team statistics. */
  async getManagerDashboard(managerId: string) {
    const teamMembers = await this.prisma.user.findMany({
      where: { managerId, isActive: true },
      select: { id: true, name: true },
    });
    const teamIds = teamMembers.map((m) => m.id);

    const allGoals = await this.prisma.goal.findMany({
      where: { ownerId: { in: teamIds } },
      include: { checkins: true },
    });

    const pendingApprovals = allGoals.filter((g) => g.status === GoalStatus.SUBMITTED).length;
    const delayedSubmissions = teamIds.length - new Set(
      allGoals
        .filter((g) => g.status !== GoalStatus.DRAFT)
        .map((g) => g.ownerId),
    ).size;

    // Team completion percent
    const approvedGoals = allGoals.filter(
      (g) => g.status === GoalStatus.APPROVED || g.status === GoalStatus.LOCKED,
    );
    const teamCompletion = approvedGoals.length === 0
      ? 0
      : Math.round(
          approvedGoals.reduce((s, g) => {
            const lastCheckin = g.checkins[g.checkins.length - 1];
            return s + (lastCheckin?.progressPercent ?? 0);
          }, 0) / approvedGoals.length,
        );

    const goalStatusDistribution = [
      GoalStatus.DRAFT, GoalStatus.SUBMITTED, GoalStatus.APPROVED, GoalStatus.REJECTED,
    ].map((status) => ({
      status,
      count: allGoals.filter((g) => g.status === status).length,
    }));

    // Top performers
    const topPerformers = await Promise.all(
      teamMembers.slice(0, 5).map(async (member) => {
        const memberGoals = allGoals.filter((g) => g.ownerId === member.id && g.checkins.length > 0);
        const avg = memberGoals.length === 0
          ? 0
          : Math.round(
              memberGoals.reduce((s, g) => {
                const last = g.checkins[g.checkins.length - 1];
                return s + (last?.progressPercent ?? 0);
              }, 0) / memberGoals.length,
            );
        return { userId: member.id, name: member.name, completion: avg };
      }),
    );
    topPerformers.sort((a, b) => b.completion - a.completion);

    const escalations = await this.prisma.escalation.findMany({
      where: { assignedToId: managerId, status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Quarterly trend across team
    const kpiHistory = await this.prisma.kPIHistory.findMany({
      where: { goalId: { in: allGoals.map((g) => g.id) } },
    });
    const quarterlyTrend = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
      const entries = kpiHistory.filter((k) => k.quarter === q);
      const avg = entries.length > 0
        ? Math.round(entries.reduce((s, e) => s + e.value, 0) / entries.length)
        : 0;
      return { quarter: q, completion: avg };
    });

    return {
      teamSize: teamMembers.length,
      pendingApprovals,
      teamCompletionPercent: teamCompletion,
      delayedSubmissions,
      goalStatusDistribution,
      quarterlyTrend,
      topPerformers,
      escalations,
    };
  }

  /** Admin dashboard — org-wide statistics. */
  async getAdminDashboard() {
    const [totalUsers, totalGoals, escalations] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.goal.count(),
      this.prisma.escalation.count({ where: { status: 'OPEN' } }),
    ]);

    const allGoals = await this.prisma.goal.findMany({
      include: { checkins: true, owner: { select: { departmentId: true } } },
    });

    const approvedGoals = allGoals.filter(
      (g) => g.status === GoalStatus.APPROVED || g.status === GoalStatus.LOCKED,
    );
    const orgCompletion = approvedGoals.length === 0
      ? 0
      : Math.round(
          approvedGoals.reduce((s, g) => {
            const last = g.checkins[g.checkins.length - 1];
            return s + (last?.progressPercent ?? 0);
          }, 0) / approvedGoals.length,
        );

    // Department breakdown
    const departments = await this.prisma.department.findMany({
      include: { users: { select: { id: true } } },
    });

    const departmentBreakdown = departments.map((dept) => {
      const deptUserIds = dept.users.map((u) => u.id);
      const deptGoals = allGoals.filter((g) => deptUserIds.includes((g.owner as any)?.departmentId ?? ''));
      const deptApproved = deptGoals.filter(
        (g) => g.status === GoalStatus.APPROVED || g.status === GoalStatus.LOCKED,
      );
      const completion = deptApproved.length === 0
        ? 0
        : Math.round(
            deptApproved.reduce((s, g) => {
              const last = g.checkins[g.checkins.length - 1];
              return s + (last?.progressPercent ?? 0);
            }, 0) / deptApproved.length,
          );
      return {
        departmentId: dept.id,
        name: dept.name,
        completion,
        goalCount: deptGoals.length,
        userCount: deptUserIds.length,
      };
    });

    const goalStatusDistribution = [
      GoalStatus.DRAFT, GoalStatus.SUBMITTED, GoalStatus.APPROVED,
      GoalStatus.REJECTED, GoalStatus.LOCKED, GoalStatus.COMPLETED,
    ].map((status) => ({
      status,
      count: allGoals.filter((g) => g.status === status).length,
    }));

    const recentActivity = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    return {
      totalUsers,
      totalGoals,
      orgCompletionPercent: orgCompletion,
      totalEscalations: escalations,
      departmentBreakdown,
      goalStatusDistribution,
      recentActivity,
    };
  }

  /** Quarterly comparison trend for analytics page. */
  async getQuarterlyTrend(departmentId?: string) {
    const goals = await this.prisma.goal.findMany({
      where: departmentId ? { owner: { departmentId } } : {},
      select: { id: true },
    });
    const goalIds = goals.map((g) => g.id);

    const history = await this.prisma.kPIHistory.findMany({
      where: { goalId: { in: goalIds } },
    });

    return ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
      const entries = history.filter((h) => h.quarter === q);
      const avg = entries.length > 0
        ? Math.round(entries.reduce((s, e) => s + e.value, 0) / entries.length)
        : 0;
      return { quarter: q, completion: avg, count: entries.length };
    });
  }

  /** Department comparison for analytics heatmap. */
  async getDepartmentStats() {
    const departments = await this.prisma.department.findMany({
      include: { users: { select: { id: true } } },
    });

    return Promise.all(
      departments.map(async (dept) => {
        const deptUserIds = dept.users.map((u) => u.id);
        const goals = await this.prisma.goal.findMany({
          where: { ownerId: { in: deptUserIds } },
          include: { checkins: true },
        });
        const approved = goals.filter(
          (g) => g.status === GoalStatus.APPROVED || g.status === GoalStatus.LOCKED,
        );
        const avg = approved.length === 0
          ? 0
          : Math.round(
              approved.reduce((s, g) => {
                const last = g.checkins[g.checkins.length - 1];
                return s + (last?.progressPercent ?? 0);
              }, 0) / approved.length,
            );
        return {
          departmentId: dept.id,
          name: dept.name,
          completion: avg,
          goalCount: goals.length,
          userCount: deptUserIds.length,
        };
      }),
    );
  }
}
