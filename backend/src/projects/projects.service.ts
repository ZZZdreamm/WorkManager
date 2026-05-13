import { Injectable, NotFoundException } from '@nestjs/common';
import { Project, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaginatedResult,
  buildOrderBy,
  paginate,
} from '../common/pagination/pagination.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ListProjectsQuery } from './dto/list-projects.query';

const SORTABLE = ['name', 'createdAt', 'status'] as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        client: dto.client?.trim() ?? null,
        budget: dto.budget != null ? new Prisma.Decimal(dto.budget) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status,
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    await this.findOne(id);
    const data: Prisma.ProjectUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.client !== undefined) data.client = dto.client.trim();
    if (dto.budget !== undefined) data.budget = new Prisma.Decimal(dto.budget);
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.project.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
