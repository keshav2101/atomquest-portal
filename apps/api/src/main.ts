// ============================================================
// NestJS Application Entry Point — AtomQuest Portal
// ============================================================

import * as prismaClient from '@prisma/client';
(prismaClient as any).Role = { ADMIN: 'ADMIN', MANAGER: 'MANAGER', EMPLOYEE: 'EMPLOYEE' };
(prismaClient as any).GoalStatus = { DRAFT: 'DRAFT', SUBMITTED: 'SUBMITTED', APPROVED: 'APPROVED', REJECTED: 'REJECTED', LOCKED: 'LOCKED', COMPLETED: 'COMPLETED' };
(prismaClient as any).UoMType = { NUMERIC_MIN: 'NUMERIC_MIN', NUMERIC_MAX: 'NUMERIC_MAX', PERCENTAGE: 'PERCENTAGE', TIMELINE: 'TIMELINE', ZERO_BASED: 'ZERO_BASED' };
(prismaClient as any).Quarter = { Q1: 'Q1', Q2: 'Q2', Q3: 'Q3', Q4: 'Q4' };
(prismaClient as any).NotificationType = { GOAL_SUBMITTED: 'GOAL_SUBMITTED', GOAL_APPROVED: 'GOAL_APPROVED', GOAL_REJECTED: 'GOAL_REJECTED', CHECKIN_REMINDER: 'CHECKIN_REMINDER', ESCALATION_WARNING: 'ESCALATION_WARNING', GOAL_LOCKED: 'GOAL_LOCKED', CYCLE_OPENED: 'CYCLE_OPENED', COMMENT_ADDED: 'COMMENT_ADDED' };
(prismaClient as any).EscalationStatus = { OPEN: 'OPEN', ESCALATED: 'ESCALATED', RESOLVED: 'RESOLVED' };

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 4000);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe — auto-transform + whitelist
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API documentation
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AtomQuest Portal API')
      .setDescription('Goal Setting & Performance Tracking Portal — API Documentation')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addTag('auth', 'Authentication endpoints')
      .addTag('goals', 'Goal management')
      .addTag('checkins', 'Quarterly check-ins')
      .addTag('approvals', 'Approval workflow')
      .addTag('analytics', 'Analytics & dashboards')
      .addTag('reports', 'Report generation & export')
      .addTag('audit', 'Audit trail')
      .addTag('notifications', 'Notification management')
      .addTag('escalations', 'Escalation engine')
      .addTag('users', 'User management')
      .addTag('departments', 'Department management')
      .addTag('cycles', 'Reporting cycle configuration')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`🚀 AtomQuest API running on http://localhost:${port}/api/v1`);
}

bootstrap();
