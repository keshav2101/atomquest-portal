// Audit, Cycles, Departments, SharedGoals stub modules

// ---- audit ----
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    entityType?: string;
    entityId?: string;
    changedById?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const { entityType, entityId, changedById, action, from, to, page = 1, limit = 50 } = params;
    const pageNum = parseInt(page as any, 10) || 1;
    const limitNum = parseInt(limit as any, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (changedById) where.changedById = changedById;
    if (action) where.action = action;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: { changedBy: { select: { id: true, name: true, role: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }
}
