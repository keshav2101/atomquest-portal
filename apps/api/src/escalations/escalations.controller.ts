import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EscalationsService } from './escalations.service';

@ApiTags('escalations')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('escalations')
export class EscalationsController {
  constructor(private readonly svc: EscalationsService) {}

  @Get()
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'List all escalations' })
  findAll(@Query() filters: any) {
    return this.svc.findAll(filters);
  }

  @Patch(':id/resolve')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Resolve an escalation' })
  resolve(
    @Param('id') id: string,
    @Body('note') note: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.resolve(id, note, user.id);
  }
}
