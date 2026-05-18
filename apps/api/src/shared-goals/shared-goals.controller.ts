import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SharedGoalsService } from './shared-goals.service';

@ApiTags('shared-goals')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shared-goals')
export class SharedGoalsController {
  constructor(private readonly svc: SharedGoalsService) {}

  @Get()
  findAll(@Query('cycleId') cycleId?: string) { return this.svc.findAll(cycleId); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: any, @CurrentUser() user: { id: string }) {
    return this.svc.create(dto, user.id);
  }
}
