import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SharedGoalsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(cycleId?: string) {
    return this.prisma.sharedGoal.findMany({
      where: cycleId ? { cycleId } : {},
      include: { _count: { select: { linkedGoals: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.sharedGoal.findUnique({
      where: { id },
      include: { linkedGoals: { include: { owner: { select: { id: true, name: true } } } } },
    });
  }

  create(dto: any, createdById: string) {
    return this.prisma.sharedGoal.create({
      data: {
        title: dto.title,
        description: dto.description,
        thrustArea: dto.thrustArea,
        uomType: dto.uomType,
        target: dto.target,
        timeline: new Date(dto.timeline),
        cycleId: dto.cycleId || null,
        createdById,
      },
    });
  }
}
