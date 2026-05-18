import { Controller, Get, Patch, Param, Query, UseGuards, Sse } from '@nestjs/common';
import { Observable, filter, map } from 'rxjs';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  getAll(@CurrentUser() user: { id: string }, @Query('unread') unread?: string) {
    return this.svc.getAll(user.id, unread === 'true');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.svc.getUnreadCount(user.id);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'SSE stream for real-time notifications' })
  streamNotifications(@CurrentUser() user: { id: string }): Observable<any> {
    return this.svc.sseStream.pipe(
      filter((event) => event.recipientId === user.id),
      map((event) => ({ data: event.notification }))
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.markRead(id, user.id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.svc.markAllRead(user.id);
  }
}
