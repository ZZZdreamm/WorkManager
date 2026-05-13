import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import {
  PaginatedResult,
  buildOrderBy,
  paginate,
} from '../common/pagination/pagination.dto';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { ListTimeEntriesQuery } from './dto/list-time-entries.query';

const INCLUDE = {
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      hourlyRate: true,
    },
  },
  project: { select: { id: true, name: true } },
} as const;

type TimeEntryView = Prisma.TimeEntryGetPayload<{ include: typeof INCLUDE }>;

const SORTABLE = ['date', 'hours', 'createdAt'] as const;

@Injectable()
export class TimeEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(
    query: ListTimeEntriesQuery,
  ): Promise<PaginatedResult<TimeEntryView>> {
    const where: Prisma.TimeEntryWhereInput = {};
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.projectId) where.projectId = query.projectId;
    if (query.from || query.to) {
      const date: Prisma.DateTimeFilter = {};
      if (query.from) date.gte = new Date(query.from);
      if (query.to) date.lte = new Date(query.to);
      where.date = date;
    }

    const orderBy = buildOrderBy(query.sort, SORTABLE, [{ date: 'desc' }]);
    const [data, total] = await Promise.all([
      this.prisma.timeEntry.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: INCLUDE,
      }),
      this.prisma.timeEntry.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async create(dto: CreateTimeEntryDto): Promise<TimeEntryView> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, deletedAt: null },
      select: { id: true, projectId: true },
    });
    if (!employee) {
      throw new BadRequestException(`Employee ${dto.employeeId} not found.`);
    }

    const entry = await this.prisma.timeEntry.create({
      data: {
        employeeId: dto.employeeId,
        projectId: employee.projectId,
        date: new Date(dto.date),
        hours: new Prisma.Decimal(dto.hours),
        description: dto.description?.trim() || null,
      },
      include: INCLUDE,
    });
    await this.audit.recordCreate('TimeEntry', entry.id, entry);
    return entry;
  }

  async remove(id: string): Promise<void> {
    const before = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!before) {
      throw new NotFoundException(`Time entry ${id} not found`);
    }
    await this.prisma.timeEntry.delete({ where: { id } });
    await this.audit.recordDelete('TimeEntry', id, before);
  }
}
