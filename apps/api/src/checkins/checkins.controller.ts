import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CheckinsService } from './checkins.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@ApiTags('checkins')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a quarterly check-in (window enforced)' })
  create(@Body() dto: CreateCheckinDto, @CurrentUser() user: { id: string }) {
    return this.checkinsService.create(dto, user);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my check-ins and active quarter window' })
  findMine(@CurrentUser() user: { id: string }) {
    return this.checkinsService.findMyCheckins(user.id);
  }

  @Get('window')
  @ApiOperation({ summary: 'Get current active check-in quarter window' })
  getWindow() {
    return this.checkinsService.getActiveWindow();
  }

  @Get('goal/:goalId')
  @ApiOperation({ summary: 'Get all check-ins for a specific goal' })
  findByGoal(@Param('goalId') goalId: string) {
    return this.checkinsService.findByGoal(goalId);
  }
}
