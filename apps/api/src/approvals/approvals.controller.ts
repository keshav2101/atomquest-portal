import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApprovalsService } from './approvals.service';
import { ApprovalActionDto } from './dto/approval-action.dto';

@ApiTags('approvals')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Get pending goal approvals for current manager' })
  getPending(@CurrentUser() user: { id: string; role: Role }) {
    return this.approvalsService.getPendingApprovals(user.id);
  }

  @Post(':goalId')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Approve or reject a submitted goal' })
  processApproval(
    @Param('goalId') goalId: string,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.approvalsService.processApproval(goalId, dto, user);
  }

  @Post('bulk-approve/:ownerId')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Bulk approve all submitted goals for an employee' })
  bulkApprove(@Param('ownerId') ownerId: string, @CurrentUser() user: { id: string; role: Role }) {
    return this.approvalsService.bulkApprove(ownerId, user);
  }
}
