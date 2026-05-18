import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get role-specific dashboard data' })
  getDashboard(@CurrentUser() user: { id: string; role: Role }) {
    if (user.role === Role.EMPLOYEE) return this.analyticsService.getEmployeeDashboard(user.id);
    if (user.role === Role.MANAGER) return this.analyticsService.getManagerDashboard(user.id);
    return this.analyticsService.getAdminDashboard();
  }

  @Get('employee')
  @ApiOperation({ summary: 'Get employee dashboard (self or manager viewing a specific employee)' })
  getEmployeeDashboard(@CurrentUser() user: { id: string }) {
    return this.analyticsService.getEmployeeDashboard(user.id);
  }

  @Get('manager')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Get manager dashboard' })
  getManagerDashboard(@CurrentUser() user: { id: string }) {
    return this.analyticsService.getManagerDashboard(user.id);
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin org-wide dashboard' })
  getAdminDashboard() {
    return this.analyticsService.getAdminDashboard();
  }

  @Get('quarterly')
  @ApiOperation({ summary: 'Get quarterly trend data' })
  getQuarterlyTrend(@Query('departmentId') departmentId?: string) {
    return this.analyticsService.getQuarterlyTrend(departmentId);
  }

  @Get('departments')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Get department comparison stats' })
  getDepartmentStats() {
    return this.analyticsService.getDepartmentStats();
  }
}
