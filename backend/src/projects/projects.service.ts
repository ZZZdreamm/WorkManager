import { Injectable, NotFoundException } from '@nestjs/common';
import { Project, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import {
  PaginatedResult,
  buildOrderBy,
  paginate,
} from '../common/pagination/pagination.dto';
import { rethrowConflict } from '../common/errors/prisma-error';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ListProjectsQuery } from './dto/list-projects.query';

const SORTABLE = ['name', 'createdAt', 'status'] as const;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListProjectsQuery): Promise<PaginatedResult<Project>> {
    const where: Prisma.ProjectWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;

    const orderBy = buildOrderBy(query.sort, SORTABLE, [{ name: 'asc' }]);
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.project.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    try {
      const project = await this.prisma.project.create({
        data: {
          name: dto.name.trim(),
          client: dto.client?.trim() ?? null,
          budget: dto.budget != null ? new Prisma.Decimal(dto.budget) : null,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          status: dto.status,
        },
      });
      await this.audit.recordCreate('Project', project.id, project);
      return project;
    } catch (err) {
      return rethrowConflict(
        err,
        (target) =>
          target.includes('name')
            ? 'Project with this name already exists.'
            : 'Project conflicts with an existing record.',
      );
    }
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const before = await this.findOne(id);
    const data: Prisma.ProjectUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.client !== undefined) data.client = dto.client.trim();
    if (dto.budget !== undefined) {
      data.budget = new Prisma.Decimal(dto.budget);
    }
    if (dto.startDate !== undefined) {
      data.startDate = new Date(dto.startDate);
    }
    if (dto.endDate !== undefined) {
      data.endDate = new Date(dto.endDate);
    }
    if (dto.status !== undefined) data.status = dto.status;

    try {
      const after = await this.prisma.project.update({ where: { id }, data });
      await this.audit.recordUpdate('Project', id, before, after);
      return after;
    } catch (err) {
      return rethrowConflict(
        err,
        (target) =>
          target.includes('name')
            ? 'Project with this name already exists.'
            : 'Project conflicts with an existing record.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    const before = await this.findOne(id);
    await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit.recordDelete('Project', id, before);
  }
}
