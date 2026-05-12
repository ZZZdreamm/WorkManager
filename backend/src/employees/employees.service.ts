import { Injectable, NotFoundException } from '@nestjs/common';
import { Employee, EmployeeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeesQuery } from './dto/list-employees.query';

export interface ProjectSummary {
  project: string;
  employeeCount: number;
  totalHours: number;
  totalCost: number;
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListEmployeesQuery): Promise<Employee[]> {
    const where: Prisma.EmployeeWhereInput = {};
    if (query.project) {
      where.project = { equals: query.project, mode: 'insensitive' };
    }
    if (query.status) {
      where.status = query.status;
    }
    return this.prisma.employee.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  create(dto: CreateEmployeeDto): Promise<Employee> {
    return this.prisma.employee.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        position: dto.position.trim(),
        project: dto.project.trim(),
        hourlyRate: new Prisma.Decimal(dto.hourlyRate),
        hoursWorked: dto.hoursWorked,
        status: dto.status,
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    await this.findOne(id);
    const data: Prisma.EmployeeUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.position !== undefined) data.position = dto.position.trim();
    if (dto.project !== undefined) data.project = dto.project.trim();
    if (dto.hourlyRate !== undefined) {
      data.hourlyRate = new Prisma.Decimal(dto.hourlyRate);
    }
    if (dto.hoursWorked !== undefined) data.hoursWorked = dto.hoursWorked;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.employee.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.employee.delete({ where: { id } });
  }

  async projectSummary(project: string): Promise<ProjectSummary> {
    const employees = await this.prisma.employee.findMany({
      where: { project: { equals: project, mode: 'insensitive' } },
      select: { hourlyRate: true, hoursWorked: true },
    });

    return EmployeesService.calculateSummary(project, employees);
  }

  static calculateSummary(
    project: string,
    employees: Array<{ hourlyRate: Prisma.Decimal | string | number; hoursWorked: number }>,
  ): ProjectSummary {
    let totalCost = new Prisma.Decimal(0);
    let totalHours = 0;

    for (const e of employees) {
      const rate = new Prisma.Decimal(e.hourlyRate as Prisma.Decimal);
      totalHours += e.hoursWorked;
      totalCost = totalCost.plus(rate.mul(e.hoursWorked));
    }

    return {
      project,
      employeeCount: employees.length,
      totalHours,
      totalCost: Number(totalCost.toFixed(2)),
    };
  }

  static readonly _types = EmployeeStatus;
}
