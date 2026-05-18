// ============================================================
// Reports Service — CSV and Excel export
// ============================================================

import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { GoalStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { createObjectCsvStringifier } from 'csv-writer';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getGoalsData(filters: {
    departmentId?: string;
    ownerId?: string;
    status?: GoalStatus;
    cycleId?: string;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.cycleId) where.cycleId = filters.cycleId;
    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.departmentId) where.owner = { departmentId: filters.departmentId };

    return this.prisma.goal.findMany({
      where,
      include: {
        owner: { include: { department: true } },
        checkins: { orderBy: { createdAt: 'asc' } },
        cycle: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Stream a CSV report of goals to the HTTP response. */
  async exportGoalsCSV(res: Response, filters: any) {
    const goals = await this.getGoalsData(filters);

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'employeeId', title: 'Employee ID' },
        { id: 'name', title: 'Employee Name' },
        { id: 'department', title: 'Department' },
        { id: 'title', title: 'Goal Title' },
        { id: 'thrustArea', title: 'Thrust Area' },
        { id: 'uomType', title: 'UoM Type' },
        { id: 'target', title: 'Target' },
        { id: 'achievement', title: 'Achievement' },
        { id: 'weightage', title: 'Weightage (%)' },
        { id: 'status', title: 'Status' },
        { id: 'timeline', title: 'Timeline' },
        { id: 'q1Progress', title: 'Q1 Progress (%)' },
        { id: 'q2Progress', title: 'Q2 Progress (%)' },
        { id: 'q3Progress', title: 'Q3 Progress (%)' },
        { id: 'q4Progress', title: 'Q4 Progress (%)' },
        { id: 'cycle', title: 'Cycle' },
        { id: 'createdAt', title: 'Created At' },
      ],
    });

    const records = goals.map((goal) => {
      const getCheckin = (q: string) => {
        const c = goal.checkins.find((c) => c.quarter === q);
        return c ? c.progressPercent.toFixed(1) : 'N/A';
      };
      return {
        employeeId: (goal.owner as any).employeeId,
        name: (goal.owner as any).name,
        department: (goal.owner as any).department?.name || 'N/A',
        title: goal.title,
        thrustArea: goal.thrustArea,
        uomType: goal.uomType,
        target: goal.target,
        achievement: goal.achievement ?? 0,
        weightage: goal.weightage,
        status: goal.status,
        timeline: new Date(goal.timeline).toLocaleDateString('en-IN'),
        q1Progress: getCheckin('Q1'),
        q2Progress: getCheckin('Q2'),
        q3Progress: getCheckin('Q3'),
        q4Progress: getCheckin('Q4'),
        cycle: (goal.cycle as any)?.name || 'N/A',
        createdAt: new Date(goal.createdAt).toLocaleDateString('en-IN'),
      };
    });

    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="atomquest-goals-report.csv"');
    res.send(csvContent);
  }

  /** Stream an Excel report of goals to the HTTP response. */
  async exportGoalsExcel(res: Response, filters: any) {
    const goals = await this.getGoalsData(filters);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AtomQuest Portal';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Goals Report', {
      pageSetup: { fitToPage: true, orientation: 'landscape' },
    });

    // Header style
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      },
    };

    sheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 14 },
      { header: 'Name', key: 'name', width: 22 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Goal Title', key: 'title', width: 40 },
      { header: 'Thrust Area', key: 'thrustArea', width: 22 },
      { header: 'UoM', key: 'uomType', width: 16 },
      { header: 'Target', key: 'target', width: 10 },
      { header: 'Achievement', key: 'achievement', width: 14 },
      { header: 'Weightage (%)', key: 'weightage', width: 15 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Timeline', key: 'timeline', width: 14 },
      { header: 'Q1 (%)', key: 'q1', width: 10 },
      { header: 'Q2 (%)', key: 'q2', width: 10 },
      { header: 'Q3 (%)', key: 'q3', width: 10 },
      { header: 'Q4 (%)', key: 'q4', width: 10 },
      { header: 'Cycle', key: 'cycle', width: 14 },
    ];

    // Apply header styles
    sheet.getRow(1).eachCell((cell) => { Object.assign(cell, headerStyle); });
    sheet.getRow(1).height = 28;

    // Status color map
    const statusColors: Record<string, string> = {
      APPROVED: 'FFD1FAE5', REJECTED: 'FFFEE2E2',
      SUBMITTED: 'FFFEF3C7', DRAFT: 'FFF1F5F9', LOCKED: 'FFE0E7FF',
    };

    goals.forEach((goal) => {
      const getProgress = (q: string) => {
        const c = goal.checkins.find((c) => c.quarter === q);
        return c ? +c.progressPercent.toFixed(1) : null;
      };
      const row = sheet.addRow({
        employeeId: (goal.owner as any).employeeId,
        name: (goal.owner as any).name,
        department: (goal.owner as any).department?.name || 'N/A',
        title: goal.title,
        thrustArea: goal.thrustArea,
        uomType: goal.uomType,
        target: goal.target,
        achievement: goal.achievement ?? 0,
        weightage: goal.weightage,
        status: goal.status,
        timeline: new Date(goal.timeline).toLocaleDateString('en-IN'),
        q1: getProgress('Q1'),
        q2: getProgress('Q2'),
        q3: getProgress('Q3'),
        q4: getProgress('Q4'),
        cycle: (goal.cycle as any)?.name || 'N/A',
      });

      // Color status cell
      const color = statusColors[goal.status] || 'FFFFFFFF';
      const statusCell = row.getCell('status');
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      statusCell.font = { bold: true };

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        cell.alignment = { vertical: 'middle' };
      });
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="atomquest-goals-report.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  }

  /** Department summary report. */
  async generateDepartmentReport() {
    const departments = await this.prisma.department.findMany({
      include: { users: { select: { id: true } } },
    });

    return Promise.all(
      departments.map(async (dept) => {
        const userIds = dept.users.map((u) => u.id);
        const goals = await this.prisma.goal.findMany({ where: { ownerId: { in: userIds } } });
        return {
          department: dept.name,
          code: dept.code,
          employees: userIds.length,
          totalGoals: goals.length,
          approved: goals.filter((g) => g.status === GoalStatus.APPROVED).length,
          submitted: goals.filter((g) => g.status === GoalStatus.SUBMITTED).length,
          rejected: goals.filter((g) => g.status === GoalStatus.REJECTED).length,
          draft: goals.filter((g) => g.status === GoalStatus.DRAFT).length,
        };
      }),
    );
  }

  /** Escalation report. */
  async generateEscalationReport() {
    return this.prisma.escalation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { name: true, role: true } },
        createdBy: { select: { name: true } },
      },
    });
  }
}
