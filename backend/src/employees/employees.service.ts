import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Employee, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import {
  PaginatedResult,
  buildOrderBy,
  paginate,
} from '../common/pagination/pagination.dto';
import { rethrowConflict } from '../common/errors/prisma-error';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeesQuery } from './dto/list-employees.query';
import { SummaryQuery } from './dto/summary.query';

const INCLUDE_PROJECT = {
  project: { select: { id: true, name: true, status: true } },
} as const;

type EmployeeWithProject = Prisma.EmployeeGetPayload<{
  include: typeof INCLUDE_PROJECT;
}>;

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  from: string | null;
  to: string | null;
  employeeCount: number;
  totalHours: number;
  totalCost: number;
}

const SORTABLE = [
  'lastName',
  'firstName',
  'hourlyRate',
  'createdAt',
  'status',
] as const;

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(
    query: ListEmployeesQuery,
  ): Promise<PaginatedResult<EmployeeWithProject>> {
    const where: Prisma.EmployeeWhereInput = { deletedAt: null };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;

    const orderBy = buildOrderBy(query.sort, SORTABLE, [
      { lastName: 'asc' },
      { firstName: 'asc' },
    ]);
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: INCLUDE_PROJECT,
      }),
      this.prisma.employee.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<EmployeeWithProject> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: INCLUDE_PROJECT,
    });
    if (!employee) throw new NotFoundException(`Employee ${id} not found`);
    return employee;
  }

  async create(dto: CreateEmployeeDto): Promise<EmployeeWithProject> {
    await this.assertProjectExists(dto.projectId);
    try {
      const employee = await this.prisma.employee.create({
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email.trim().toLowerCase(),
          position: dto.position.trim(),
          projectId: dto.projectId,
          hourlyRate: new Prisma.Decimal(dto.hourlyRate),
          status: dto.status,
        },
        include: INCLUDE_PROJECT,
      });
      await this.audit.recordCreate('Employee', employee.id, employee);
      return employee;
    } catch (err) {
      return rethrowConflict(err, (target) =>
        target.includes('email')
          ? 'Another employee already uses this email address.'
          : 'Employee conflicts with an existing record.',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateEmployeeDto,
  ): Promise<EmployeeWithProject> {
    const before = await this.findOne(id);
    if (dto.projectId && dto.projectId !== before.projectId) {
      await this.assertProjectExists(dto.projectId);
    }

    const data: Prisma.EmployeeUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.position !== undefined) data.position = dto.position.trim();
    if (dto.projectId !== undefined) {
      data.project = { connect: { id: dto.projectId } };
    }
    if (dto.hourlyRate !== undefined) {
      data.hourlyRate = new Prisma.Decimal(dto.hourlyRate);
    }
    if (dto.status !== undefined) data.status = dto.status;

    try {
      const after = await this.prisma.employee.update({
        where: { id },
        data,
        include: INCLUDE_PROJECT,
      });
      await this.audit.recordUpdate('Employee', id, before, after);
      return after;
    } catch (err) {
      return rethrowConflict(err, (target) =>
        target.includes('email')
          ? 'Another employee already uses this email address.'
          : 'Employee conflicts with an existing record.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    const before = await this.findOne(id);
    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit.recordDelete('Employee', id, before);
  }

  async projectSummary(query: SummaryQuery): Promise<ProjectSummary> {
    const project = await this.prisma.project.findFirst({
      where: { id: query.projectId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!project) {
      throw new NotFoundException(`Project ${query.projectId} not found`);
    }
    return {
      projectId: project.id,
      projectName: project.name,
      from: query.from ?? null,
      to: query.to ?? null,
      employeeCount: 0,
      totalHours: 0,
      totalCost: 0,
    };
  }

  private async assertProjectExists(projectId: string) {
    const exists = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(`Project ${projectId} not found.`);
    }
  }
}
