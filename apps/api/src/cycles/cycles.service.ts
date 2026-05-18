import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.reportingCycle.findMany({ orderBy: { year: 'desc' } });
  }

  async getActive() {
    return this.prisma.reportingCycle.findFirst({ where: { isActive: true } });
  }

  async create(dto: any, adminId: string) {
    const existing = await this.prisma.reportingCycle.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Cycle "${dto.name}" already exists`);

    const cycle = await this.prisma.reportingCycle.create({
      data: {
        name: dto.name,
        year: dto.year,
        q1Start: new Date(dto.q1Start), q1End: new Date(dto.q1End),
        q2Start: new Date(dto.q2Start), q2End: new Date(dto.q2End),
        q3Start: new Date(dto.q3Start), q3End: new Date(dto.q3End),
        q4Start: new Date(dto.q4Start), q4End: new Date(dto.q4End),
        isActive: dto.isActive || false,
      },
    });
    await this.prisma.auditLog.create({
      data: { entityType: 'ReportingCycle', entityId: cycle.id, action: 'CREATE', changedById: adminId },
    });
    return cycle;
  }

  async setActive(id: string, adminId: string) {
    await this.prisma.reportingCycle.updateMany({ data: { isActive: false } });
    const cycle = await this.prisma.reportingCycle.update({
      where: { id }, data: { isActive: true },
    });
    await this.prisma.notification.createMany({
      data: (await this.prisma.user.findMany({ where: { isActive: true }, select: { id: true } })).map((u) => ({
        type: 'CYCLE_OPENED' as any,
        title: `New Cycle Activated: ${cycle.name}`,
        message: 'A new reporting cycle is now active. Please set your goals.',
        recipientId: u.id,
        linkUrl: '/goals',
      })),
    });
    return cycle;
  }
}
