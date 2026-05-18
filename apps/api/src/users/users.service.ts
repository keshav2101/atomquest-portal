// ============================================================
// Users Service — CRUD operations for user management
// ============================================================

import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  employeeId: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true, code: true } },
  manager: { select: { id: true, name: true, email: true } },
  _count: { select: { goals: true, directReports: true } },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    role?: Role;
    departmentId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, departmentId, search, page = 1, limit = 20 } = params;
    const pageNum = parseInt(page as any, 10) || 1;
    const limitNum = parseInt(limit as any, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(dto: CreateUserDto, createdById: string) {
    // Check for duplicate email
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException(`Email ${dto.email} is already registered`);

    const existingEmpId = await this.prisma.user.findUnique({ where: { employeeId: dto.employeeId } });
    if (existingEmpId) throw new ConflictException(`Employee ID ${dto.employeeId} already exists`);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        employeeId: dto.employeeId,
        departmentId: dto.departmentId,
        managerId: dto.managerId || null,
      },
      select: USER_SELECT,
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: user.id,
        action: 'CREATE',
        changedById: createdById,
        after: JSON.stringify({ name: user.name, email: user.email, role: user.role }),
      },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, updatedById: string) {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== (user as any).email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException(`Email ${dto.email} already in use`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role,
        departmentId: dto.departmentId,
        managerId: dto.managerId || null,
        isActive: dto.isActive,
      },
      select: USER_SELECT,
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: id,
        action: 'UPDATE',
        changedById: updatedById,
        before: JSON.stringify(user),
        after: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async deactivate(id: string, adminId: string) {
    const user = await this.findOne(id);
    if (!(user as any).isActive) throw new BadRequestException('User is already inactive');

    await this.prisma.user.update({ where: { id }, data: { isActive: false } });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: id,
        action: 'DEACTIVATE',
        changedById: adminId,
      },
    });

    return { message: 'User deactivated successfully' };
  }

  async getTeamMembers(managerId: string) {
    return this.prisma.user.findMany({
      where: { managerId, isActive: true },
      select: USER_SELECT,
    });
  }

  async resetPassword(id: string, newPassword: string, adminId: string) {
    if (newPassword.length < 8) throw new BadRequestException('Password too short');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    await this.prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: id,
        action: 'PASSWORD_RESET',
        changedById: adminId,
      },
    });
    return { message: 'Password reset successfully' };
  }
}
