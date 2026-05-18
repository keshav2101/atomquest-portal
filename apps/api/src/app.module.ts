// ============================================================
// App Root Module — imports all feature modules
// ============================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GoalsModule } from './goals/goals.module';
import { CheckinsModule } from './checkins/checkins.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { SharedGoalsModule } from './shared-goals/shared-goals.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EscalationsModule } from './escalations/escalations.module';
import { CyclesModule } from './cycles/cycles.module';
import { ReportsModule } from './reports/reports.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DepartmentsModule } from './departments/departments.module';

@Module({
  imports: [
    // Configuration (loads .env)
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),

    // Rate limiting: 100 requests per minute globally
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Cron jobs for escalation engine
    ScheduleModule.forRoot(),

    // Event Emitter for SSE and decoupled logic
    EventEmitterModule.forRoot(),

    // Core infrastructure
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    GoalsModule,
    CheckinsModule,
    ApprovalsModule,
    SharedGoalsModule,
    AuditModule,
    NotificationsModule,
    EscalationsModule,
    CyclesModule,
    ReportsModule,
    AnalyticsModule,
    DepartmentsModule,
  ],
})
export class AppModule {}
