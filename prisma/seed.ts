// ============================================================
// Database Seed Script — AtomQuest Portal
// Generates: 3 departments, 10 demo users, 1 cycle,
//            30 goals, historical check-ins, notifications,
//            audit logs, shared goals
// ============================================================

import { PrismaClient, Role, GoalStatus, UoMType, Quarter, NotificationType, EscalationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function hash(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Starting seed...');

  // --------------------------------------------------------
  // DEPARTMENTS
  // --------------------------------------------------------
  const [engineering, marketing, hr] = await Promise.all([
    prisma.department.upsert({
      where: { code: 'ENG' },
      update: {},
      create: { name: 'Engineering', code: 'ENG' },
    }),
    prisma.department.upsert({
      where: { code: 'MKT' },
      update: {},
      create: { name: 'Marketing', code: 'MKT' },
    }),
    prisma.department.upsert({
      where: { code: 'HR' },
      update: {},
      create: { name: 'Human Resources', code: 'HR' },
    }),
  ]);
  console.log('✅ Departments created');

  // --------------------------------------------------------
  // USERS
  // --------------------------------------------------------
  const adminHash     = await hash('Admin@123');
  const managerHash   = await hash('Manager@123');
  const employeeHash  = await hash('Employee@123');

  // Admin/HR
  const admin = await prisma.user.upsert({
    where: { email: 'admin@atomberg.com' },
    update: {},
    create: {
      name: 'Aditi Sharma',
      email: 'admin@atomberg.com',
      passwordHash: adminHash,
      role: Role.ADMIN,
      employeeId: 'ATM-001',
      departmentId: hr.id,
    },
  });

  // Managers
  const manager1 = await prisma.user.upsert({
    where: { email: 'manager1@atomberg.com' },
    update: {},
    create: {
      name: 'Rohan Mehta',
      email: 'manager1@atomberg.com',
      passwordHash: managerHash,
      role: Role.MANAGER,
      employeeId: 'ATM-002',
      departmentId: engineering.id,
    },
  });
  const manager2 = await prisma.user.upsert({
    where: { email: 'manager2@atomberg.com' },
    update: {},
    create: {
      name: 'Priya Nair',
      email: 'manager2@atomberg.com',
      passwordHash: managerHash,
      role: Role.MANAGER,
      employeeId: 'ATM-003',
      departmentId: marketing.id,
    },
  });

  // Employees under Engineering
  const emp1 = await prisma.user.upsert({
    where: { email: 'emp1@atomberg.com' },
    update: {},
    create: {
      name: 'Arjun Patel',
      email: 'emp1@atomberg.com',
      passwordHash: employeeHash,
      role: Role.EMPLOYEE,
      employeeId: 'ATM-004',
      departmentId: engineering.id,
      managerId: manager1.id,
    },
  });
  const emp2 = await prisma.user.upsert({
    where: { email: 'emp2@atomberg.com' },
    update: {},
    create: {
      name: 'Sneha Gupta',
      email: 'emp2@atomberg.com',
      passwordHash: employeeHash,
      role: Role.EMPLOYEE,
      employeeId: 'ATM-005',
      departmentId: engineering.id,
      managerId: manager1.id,
    },
  });
  const emp3 = await prisma.user.upsert({
    where: { email: 'emp3@atomberg.com' },
    update: {},
    create: {
      name: 'Karan Singh',
      email: 'emp3@atomberg.com',
      passwordHash: employeeHash,
      role: Role.EMPLOYEE,
      employeeId: 'ATM-006',
      departmentId: engineering.id,
      managerId: manager1.id,
    },
  });

  // Employees under Marketing
  const emp4 = await prisma.user.upsert({
    where: { email: 'emp4@atomberg.com' },
    update: {},
    create: {
      name: 'Divya Reddy',
      email: 'emp4@atomberg.com',
      passwordHash: employeeHash,
      role: Role.EMPLOYEE,
      employeeId: 'ATM-007',
      departmentId: marketing.id,
      managerId: manager2.id,
    },
  });
  const emp5 = await prisma.user.upsert({
    where: { email: 'emp5@atomberg.com' },
    update: {},
    create: {
      name: 'Amit Kumar',
      email: 'emp5@atomberg.com',
      passwordHash: employeeHash,
      role: Role.EMPLOYEE,
      employeeId: 'ATM-008',
      departmentId: marketing.id,
      managerId: manager2.id,
    },
  });
  const emp6 = await prisma.user.upsert({
    where: { email: 'emp6@atomberg.com' },
    update: {},
    create: {
      name: 'Meera Joshi',
      email: 'emp6@atomberg.com',
      passwordHash: employeeHash,
      role: Role.EMPLOYEE,
      employeeId: 'ATM-009',
      departmentId: hr.id,
      managerId: admin.id,
    },
  });

  console.log('✅ Users created');

  // Set department heads
  await prisma.department.update({ where: { id: engineering.id }, data: { headId: manager1.id } });
  await prisma.department.update({ where: { id: marketing.id },  data: { headId: manager2.id } });
  await prisma.department.update({ where: { id: hr.id },         data: { headId: admin.id } });

  // --------------------------------------------------------
  // REPORTING CYCLE — FY 2025-26
  // --------------------------------------------------------
  const cycle = await prisma.reportingCycle.upsert({
    where: { name: 'FY 2025-26' },
    update: {},
    create: {
      name: 'FY 2025-26',
      year: 2025,
      q1Start: new Date('2025-07-01'),
      q1End:   new Date('2025-07-31'),
      q2Start: new Date('2025-10-01'),
      q2End:   new Date('2025-10-31'),
      q3Start: new Date('2026-01-01'),
      q3End:   new Date('2026-01-31'),
      q4Start: new Date('2026-03-01'),
      q4End:   new Date('2026-04-15'),
      isActive: true,
    },
  });
  console.log('✅ Reporting cycle created');

  // --------------------------------------------------------
  // SHARED GOAL
  // --------------------------------------------------------
  const sharedGoal = await prisma.sharedGoal.create({
    data: {
      title: 'Achieve 99.5% System Uptime',
      description: 'Maintain platform reliability with zero critical incidents.',
      thrustArea: 'Process Improvement',
      uomType: UoMType.PERCENTAGE,
      target: 99.5,
      achievement: 99.2,
      timeline: new Date('2026-03-31'),
      cycleId: cycle.id,
      createdById: admin.id,
    },
  });
  console.log('✅ Shared goal created');

  // --------------------------------------------------------
  // GOALS — Employee 1 (Arjun Patel)
  // --------------------------------------------------------
  const goal1 = await prisma.goal.create({
    data: {
      title: 'Deliver Fan Controller Firmware v3.0',
      description: 'Complete and ship the next-gen fan controller firmware with BLE support and energy optimization algorithms.',
      thrustArea: 'Innovation & R&D',
      uomType: UoMType.NUMERIC_MAX,
      target: 100,
      achievement: 85,
      weightage: 30,
      status: GoalStatus.APPROVED,
      timeline: new Date('2026-03-31'),
      ownerId: emp1.id,
      approverId: manager1.id,
      cycleId: cycle.id,
      isLocked: true,
      lockedAt: new Date('2025-06-01'),
      lockedById: manager1.id,
      submittedAt: new Date('2025-05-20'),
      approvedAt: new Date('2025-06-01'),
    },
  });

  const goal2 = await prisma.goal.create({
    data: {
      title: 'Reduce Critical Bug Backlog by 60%',
      description: 'Clear the critical and high-priority bug backlog to improve product stability.',
      thrustArea: 'Quality Assurance',
      uomType: UoMType.NUMERIC_MIN,
      target: 40,
      achievement: 55,
      weightage: 25,
      status: GoalStatus.APPROVED,
      timeline: new Date('2026-03-31'),
      ownerId: emp1.id,
      approverId: manager1.id,
      cycleId: cycle.id,
      isLocked: true,
      lockedAt: new Date('2025-06-01'),
      submittedAt: new Date('2025-05-20'),
      approvedAt: new Date('2025-06-01'),
    },
  });

  const goal3 = await prisma.goal.create({
    data: {
      title: 'System Uptime SLA',
      description: 'Maintain 99.5% system uptime for all production services.',
      thrustArea: 'Process Improvement',
      uomType: UoMType.PERCENTAGE,
      target: 99.5,
      achievement: 99.2,
      weightage: 25,
      status: GoalStatus.APPROVED,
      timeline: new Date('2026-03-31'),
      ownerId: emp1.id,
      approverId: manager1.id,
      cycleId: cycle.id,
      isShared: true,
      sharedGoalId: sharedGoal.id,
      isLocked: true,
      submittedAt: new Date('2025-05-20'),
      approvedAt: new Date('2025-06-01'),
    },
  });

  const goal4 = await prisma.goal.create({
    data: {
      title: 'Complete AWS Solutions Architect Certification',
      description: 'Obtain AWS SAA-C03 certification to enhance cloud architecture skills.',
      thrustArea: 'People Development',
      uomType: UoMType.ZERO_BASED,
      target: 0,
      achievement: 0,
      weightage: 20,
      status: GoalStatus.APPROVED,
      timeline: new Date('2025-12-31'),
      ownerId: emp1.id,
      approverId: manager1.id,
      cycleId: cycle.id,
      isLocked: true,
      submittedAt: new Date('2025-05-20'),
      approvedAt: new Date('2025-06-01'),
    },
  });

  // DRAFT goal — not yet submitted
  await prisma.goal.create({
    data: {
      title: 'Implement CI/CD Pipeline Improvements',
      description: 'Reduce deployment time by 40% through pipeline optimization.',
      thrustArea: 'Digital Transformation',
      uomType: UoMType.NUMERIC_MIN,
      target: 60,
      weightage: 0,
      status: GoalStatus.DRAFT,
      timeline: new Date('2026-03-31'),
      ownerId: emp1.id,
      cycleId: cycle.id,
    },
  });

  console.log('✅ Employee 1 goals created');

  // --------------------------------------------------------
  // GOALS — Employee 2 (Sneha Gupta)
  // --------------------------------------------------------
  await prisma.goal.createMany({
    data: [
      {
        title: 'Launch Mobile App v2.0',
        description: 'Deliver the redesigned Atomberg mobile app with new UI and features.',
        thrustArea: 'Innovation & R&D',
        uomType: UoMType.TIMELINE,
        target: new Date('2026-01-15').getTime(),
        achievement: new Date('2026-01-10').getTime(),
        weightage: 35,
        status: GoalStatus.APPROVED,
        timeline: new Date('2026-01-15'),
        ownerId: emp2.id,
        approverId: manager1.id,
        cycleId: cycle.id,
        isLocked: true,
        submittedAt: new Date('2025-05-25'),
        approvedAt: new Date('2025-06-05'),
      },
      {
        title: 'API Response Time < 200ms',
        description: 'Optimize all critical API endpoints to respond within 200ms at p95.',
        thrustArea: 'Quality Assurance',
        uomType: UoMType.NUMERIC_MIN,
        target: 200,
        achievement: 165,
        weightage: 30,
        status: GoalStatus.APPROVED,
        timeline: new Date('2026-03-31'),
        ownerId: emp2.id,
        approverId: manager1.id,
        cycleId: cycle.id,
        isLocked: true,
        submittedAt: new Date('2025-05-25'),
        approvedAt: new Date('2025-06-05'),
      },
      {
        title: 'Code Review Participation Rate',
        description: 'Participate in 90% of all team code reviews.',
        thrustArea: 'Process Improvement',
        uomType: UoMType.PERCENTAGE,
        target: 90,
        achievement: 88,
        weightage: 20,
        status: GoalStatus.SUBMITTED,
        timeline: new Date('2026-03-31'),
        ownerId: emp2.id,
        cycleId: cycle.id,
        submittedAt: new Date('2025-05-28'),
      },
      {
        title: 'Zero Production Incidents',
        description: 'Ensure zero P0 production incidents caused by code changes.',
        thrustArea: 'Safety & Environment',
        uomType: UoMType.ZERO_BASED,
        target: 0,
        achievement: 0,
        weightage: 15,
        status: GoalStatus.SUBMITTED,
        timeline: new Date('2026-03-31'),
        ownerId: emp2.id,
        cycleId: cycle.id,
        submittedAt: new Date('2025-05-28'),
      },
    ],
  });
  console.log('✅ Employee 2 goals created');

  // --------------------------------------------------------
  // GOALS — Employee 4 (Divya Reddy, Marketing)
  // --------------------------------------------------------
  await prisma.goal.createMany({
    data: [
      {
        title: 'Q2 Lead Generation Target',
        description: 'Generate 5000 qualified marketing leads through digital campaigns.',
        thrustArea: 'Revenue Growth',
        uomType: UoMType.NUMERIC_MAX,
        target: 5000,
        achievement: 4200,
        weightage: 40,
        status: GoalStatus.APPROVED,
        timeline: new Date('2026-03-31'),
        ownerId: emp4.id,
        approverId: manager2.id,
        cycleId: cycle.id,
        isLocked: true,
        submittedAt: new Date('2025-05-22'),
        approvedAt: new Date('2025-06-03'),
      },
      {
        title: 'Social Media Engagement Rate',
        description: 'Achieve 5% average engagement rate across all social platforms.',
        thrustArea: 'Customer Satisfaction',
        uomType: UoMType.PERCENTAGE,
        target: 5,
        achievement: 4.8,
        weightage: 30,
        status: GoalStatus.APPROVED,
        timeline: new Date('2026-03-31'),
        ownerId: emp4.id,
        approverId: manager2.id,
        cycleId: cycle.id,
        isLocked: true,
        submittedAt: new Date('2025-05-22'),
        approvedAt: new Date('2025-06-03'),
      },
      {
        title: 'Brand Awareness Campaign Launch',
        description: 'Launch pan-India brand awareness campaign by Q2.',
        thrustArea: 'Innovation & R&D',
        uomType: UoMType.TIMELINE,
        target: new Date('2025-10-01').getTime(),
        achievement: new Date('2025-09-28').getTime(),
        weightage: 30,
        status: GoalStatus.APPROVED,
        timeline: new Date('2025-10-01'),
        ownerId: emp4.id,
        approverId: manager2.id,
        cycleId: cycle.id,
        isLocked: true,
        submittedAt: new Date('2025-05-22'),
        approvedAt: new Date('2025-06-03'),
      },
    ],
  });
  console.log('✅ Employee 4 goals created');

  // --------------------------------------------------------
  // REJECTED GOAL (Demo: emp3 has a rejected goal)
  // --------------------------------------------------------
  await prisma.goal.create({
    data: {
      title: 'Migrate Legacy Services to Kubernetes',
      description: 'Containerize and migrate 5 legacy services to Kubernetes by Q3.',
      thrustArea: 'Digital Transformation',
      uomType: UoMType.NUMERIC_MAX,
      target: 5,
      achievement: 0,
      weightage: 40,
      status: GoalStatus.REJECTED,
      timeline: new Date('2026-01-31'),
      ownerId: emp3.id,
      approverId: manager1.id,
      cycleId: cycle.id,
      submittedAt: new Date('2025-05-26'),
      rejectedAt: new Date('2025-06-10'),
    },
  });
  console.log('✅ Rejected goal created');

  // --------------------------------------------------------
  // CHECK-INS for goal1 (Arjun's Firmware Goal)
  // --------------------------------------------------------
  await prisma.goalCheckin.createMany({
    data: [
      {
        goalId: goal1.id,
        quarter: Quarter.Q1,
        achievement: 20,
        progressPercent: 20,
        notes: 'Initial BLE module integration complete. Core firmware architecture designed.',
        createdById: emp1.id,
      },
      {
        goalId: goal1.id,
        quarter: Quarter.Q2,
        achievement: 55,
        progressPercent: 55,
        notes: 'Energy optimization algorithms implemented. QA testing in progress.',
        createdById: emp1.id,
      },
      {
        goalId: goal1.id,
        quarter: Quarter.Q3,
        achievement: 85,
        progressPercent: 85,
        notes: 'Beta firmware shipped to 500 units. Final UAT underway.',
        createdById: emp1.id,
      },
    ],
  });

  // Check-ins for goal2
  await prisma.goalCheckin.createMany({
    data: [
      {
        goalId: goal2.id,
        quarter: Quarter.Q1,
        achievement: 80,
        progressPercent: 50,
        notes: 'Identified and triaged 80 critical bugs. Resolution in progress.',
        createdById: emp1.id,
      },
      {
        goalId: goal2.id,
        quarter: Quarter.Q2,
        achievement: 60,
        progressPercent: 67,
        notes: 'Bug count reduced to 60. Automation tests added to prevent regressions.',
        createdById: emp1.id,
      },
      {
        goalId: goal2.id,
        quarter: Quarter.Q3,
        achievement: 55,
        progressPercent: 73,
        notes: 'Down to 55 critical bugs. On track for target.',
        createdById: emp1.id,
      },
    ],
  });
  console.log('✅ Check-ins created');

  // --------------------------------------------------------
  // COMMENTS
  // --------------------------------------------------------
  await prisma.goalComment.createMany({
    data: [
      {
        goalId: goal1.id,
        content: 'Great progress on the BLE integration. Keep up the momentum for Q4!',
        authorId: manager1.id,
      },
      {
        goalId: goal1.id,
        content: 'UAT feedback looks positive. Targeting final release by mid-March.',
        authorId: emp1.id,
      },
      {
        goalId: goal2.id,
        content: 'Focus on automating regression tests to prevent new bugs from being introduced.',
        authorId: manager1.id,
      },
    ],
  });
  console.log('✅ Comments created');

  // --------------------------------------------------------
  // AUDIT LOGS
  // --------------------------------------------------------
  await prisma.auditLog.createMany({
    data: [
      {
        entityType: 'Goal',
        entityId: goal1.id,
        action: 'CREATE',
        changedById: emp1.id,
        after: { title: goal1.title, status: 'DRAFT' },
        goalId: goal1.id,
      },
      {
        entityType: 'Goal',
        entityId: goal1.id,
        action: 'SUBMIT',
        changedById: emp1.id,
        before: { status: 'DRAFT' },
        after: { status: 'SUBMITTED' },
        goalId: goal1.id,
      },
      {
        entityType: 'Goal',
        entityId: goal1.id,
        action: 'APPROVE',
        changedById: manager1.id,
        before: { status: 'SUBMITTED' },
        after: { status: 'APPROVED', isLocked: true },
        goalId: goal1.id,
      },
      {
        entityType: 'Goal',
        entityId: goal2.id,
        action: 'CREATE',
        changedById: emp1.id,
        after: { title: goal2.title, status: 'DRAFT' },
        goalId: goal2.id,
      },
      {
        entityType: 'User',
        entityId: admin.id,
        action: 'LOGIN',
        changedById: admin.id,
        metadata: { ip: '192.168.1.1' },
      },
    ],
  });
  console.log('✅ Audit logs created');

  // --------------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      {
        type: NotificationType.GOAL_APPROVED,
        title: 'Goal Approved ✅',
        message: `Your goal "${goal1.title}" has been approved by ${manager1.name}.`,
        recipientId: emp1.id,
        isRead: false,
        linkUrl: `/goals/${goal1.id}`,
      },
      {
        type: NotificationType.GOAL_APPROVED,
        title: 'Goal Approved ✅',
        message: `Your goal "${goal2.title}" has been approved.`,
        recipientId: emp1.id,
        isRead: true,
        readAt: new Date(),
        linkUrl: `/goals/${goal2.id}`,
      },
      {
        type: NotificationType.GOAL_SUBMITTED,
        title: 'New Goal Pending Approval',
        message: `${emp2.name} has submitted goals for your review.`,
        recipientId: manager1.id,
        isRead: false,
        linkUrl: '/approvals',
      },
      {
        type: NotificationType.CHECKIN_REMINDER,
        title: 'Q4 Check-in Window Open',
        message: 'The Q4 check-in window is now open. Submit your achievements by April 15.',
        recipientId: emp1.id,
        isRead: false,
        linkUrl: '/checkins',
      },
      {
        type: NotificationType.ESCALATION_WARNING,
        title: 'Escalation Notice',
        message: `${emp3.name} has not submitted goals for FY 2025-26.`,
        recipientId: admin.id,
        isRead: false,
        linkUrl: '/escalations',
      },
    ],
  });
  console.log('✅ Notifications created');

  // --------------------------------------------------------
  // ESCALATION
  // --------------------------------------------------------
  await prisma.escalation.create({
    data: {
      type: 'GOAL_NOT_SUBMITTED',
      description: `${emp3.name} (ATM-006) has not submitted goals for FY 2025-26 despite two reminders.`,
      targetId: emp3.id,
      targetType: 'User',
      level: 2,
      status: EscalationStatus.OPEN,
      assignedToId: manager1.id,
      createdById: admin.id,
    },
  });
  console.log('✅ Escalation created');

  // --------------------------------------------------------
  // KPI HISTORY
  // --------------------------------------------------------
  await prisma.kPIHistory.createMany({
    data: [
      { goalId: goal1.id, quarter: Quarter.Q1, value: 20 },
      { goalId: goal1.id, quarter: Quarter.Q2, value: 55 },
      { goalId: goal1.id, quarter: Quarter.Q3, value: 85 },
      { goalId: goal2.id, quarter: Quarter.Q1, value: 50 },
      { goalId: goal2.id, quarter: Quarter.Q2, value: 67 },
      { goalId: goal2.id, quarter: Quarter.Q3, value: 73 },
    ],
  });
  console.log('✅ KPI history created');

  // --------------------------------------------------------
  // ACTIVITY LOGS
  // --------------------------------------------------------
  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id,    action: 'Logged in',               metadata: {} },
      { userId: emp1.id,     action: 'Created goal: Deliver Fan Controller Firmware v3.0' },
      { userId: emp1.id,     action: 'Submitted goal sheet for FY 2025-26' },
      { userId: manager1.id, action: 'Approved goals for Arjun Patel' },
      { userId: emp1.id,     action: 'Submitted Q3 check-in for Firmware goal' },
    ],
  });
  console.log('✅ Activity logs created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin:     admin@atomberg.com    / Admin@123');
  console.log('   Manager 1: manager1@atomberg.com / Manager@123');
  console.log('   Manager 2: manager2@atomberg.com / Manager@123');
  console.log('   Employee 1: emp1@atomberg.com    / Employee@123');
  console.log('   Employee 2: emp2@atomberg.com    / Employee@123');
  console.log('   Employee 3: emp3@atomberg.com    / Employee@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
