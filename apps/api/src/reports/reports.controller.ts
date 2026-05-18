import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('export/csv')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Export goals report as CSV' })
  exportCSV(@Query() filters: any, @Res() res: Response) {
    return this.reportsService.exportGoalsCSV(res, filters);
  }

  @Get('export/excel')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Export goals report as Excel (.xlsx)' })
  exportExcel(@Query() filters: any, @Res() res: Response) {
    return this.reportsService.exportGoalsExcel(res, filters);
  }

  @Get('department')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get department summary report' })
  getDepartmentReport() {
    return this.reportsService.generateDepartmentReport();
  }

  @Get('escalations')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get escalation report' })
  getEscalationReport() {
    return this.reportsService.generateEscalationReport();
  }
}
