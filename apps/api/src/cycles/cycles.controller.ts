import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CyclesService } from './cycles.service';

@ApiTags('cycles')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cycles')
export class CyclesController {
  constructor(private readonly svc: CyclesService) {}

  @Get() findAll() { return this.svc.findAll(); }
  @Get('active') getActive() { return this.svc.getActive(); }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: any, @CurrentUser() user: { id: string }) {
    return this.svc.create(dto, user.id);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  activate(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.setActive(id, user.id);
  }
}
