// Notifications, Audit, Escalations, Cycles, Departments, SharedGoals modules

// ---- notifications.service.ts ----
// Full service in: apps/api/src/notifications/notifications.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subject } from 'rxjs';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend;
  public readonly sseStream = new Subject<any>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_stub_key');
  }

  async getAll(userId: string, onlyUnread = false) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId, ...(onlyUnread ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
    return { count };
  }

  async create(data: {
    type: string;
    title: string;
    message: string;
    recipientId: string;
    linkUrl?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: data as any,
      include: { recipient: { select: { email: true, name: true } } },
    });

    // 1. Emit to SSE stream (frontend will listen to this)
    this.sseStream.next({
      recipientId: data.recipientId,
      notification,
    });

    // 2. Send Real Email via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        await this.resend.emails.send({
          from: 'AtomQuest <notifications@atomquest.com>',
          to: notification.recipient.email,
          subject: data.title,
          html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 20px;">AtomQuest Notifications</h1>
              </div>
              <div style="padding: 30px;">
                <h2 style="margin-top: 0;">Hi ${notification.recipient.name},</h2>
                <p style="font-size: 16px; line-height: 1.5;">${data.message}</p>
                ${data.linkUrl ? `
                  <div style="margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${data.linkUrl}" 
                       style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                      View Details
                    </a>
                  </div>
                ` : ''}
              </div>
              <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
                This is an automated message from AtomQuest. Please do not reply.
              </div>
            </div>
          `,
        });
        this.logger.log(`Email sent successfully to ${notification.recipient.email}`);
      } catch (err) {
        this.logger.error(`Failed to send email to ${notification.recipient.email}: ${err.message}`);
      }
    } else {
      this.logger.warn('RESEND_API_KEY not set. Email notification skipped.');
    }

    return notification;
  }
}
