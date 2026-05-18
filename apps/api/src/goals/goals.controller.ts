// ============================================================
// Goals Controller — Full CRUD + workflow actions
// ============================================================

import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@ApiTags('goals')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'List goals (filtered by role)' })
  findAll(@Query() query: any, @CurrentUser() user: { id: string; role: Role }) {
    return this.goalsService.findAll({ ...query, currentUser: user });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a goal by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string; role: Role }) {
    return this.goalsService.findOne(id, user);
  }

  @Post()
  @Roles(Role.EMPLOYEE, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new goal' })
  create(@Body() dto: CreateGoalDto, @CurrentUser() user: { id: string; role: Role }) {
    return this.goalsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.goalsService.update(id, dto, user);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit all draft goals for approval' })
  submit(@Param('id') id: string, @CurrentUser() user: { id: string; role: Role }) {
    return this.goalsService.submit(id, user);
  }

  @Patch(':id/unlock')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Unlock an approved/locked goal (Admin only)' })
  unlock(@Param('id') id: string, @CurrentUser() user: { id: string; role: Role }) {
    return this.goalsService.unlock(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a draft goal' })
  delete(@Param('id') id: string, @CurrentUser() user: { id: string; role: Role }) {
    return this.goalsService.delete(id, user);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Get audit history for a goal' })
  getAudit(@Param('id') id: string) {
    return this.goalsService.getAuditHistory(id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a goal' })
  addComment(
    @Param('id') id: string,
    @Body('content') content: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.goalsService.addComment(id, content, user.id);
  }
}
