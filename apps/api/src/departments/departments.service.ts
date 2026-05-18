import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.department.findMany({
      include: {
        head: { select: { id: true, name: true, email: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      include: {
        head: { select: { id: true, name: true } },
        users: { select: { id: true, name: true, role: true, employeeId: true } },
      },
    });
  }
}
