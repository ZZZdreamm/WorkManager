import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeStatus, Prisma } from '@prisma/client';
import { EmployeesService } from './employees.service';

type PrismaMock = {
  employee: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  project: {
    findFirst: jest.Mock;
  };
  timeEntry: {
    findMany: jest.Mock;
  };
};

function makePrismaMock(): PrismaMock {
  return {
    employee: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    project: { findFirst: jest.fn() },
    timeEntry: { findMany: jest.fn() },
  };
}

function makeAuditMock() {
  return {
    recordCreate: jest.fn().mockResolvedValue(undefined),
    recordUpdate: jest.fn().mockResolvedValue(undefined),
    recordDelete: jest.fn().mockResolvedValue(undefined),
  };
}

describe('EmployeesService', () => {
  describe('calculateSummary (pure)', () => {
    it('returns zeros when there are no entries', () => {
      const result = EmployeesService.calculateSummary(
        { id: 'p1', name: 'Phantom' },
        [],
      );
      expect(result).toEqual({
        projectId: 'p1',
        projectName: 'Phantom',
        from: null,
        to: null,
        employeeCount: 0,
        totalHours: 0,
        totalCost: 0,
      });
    });

    it('sums hours and multiplies by employee rate, deduplicating employees', () => {
      const result = EmployeesService.calculateSummary(
        { id: 'p1', name: 'WorkFlex Portal' },
        [
          {
            hours: new Prisma.Decimal('40'),
            employee: { id: 'e1', hourlyRate: new Prisma.Decimal('180.00') },
          },
          {
            hours: new Prisma.Decimal('80'),
            employee: { id: 'e1', hourlyRate: new Prisma.Decimal('180.00') },
          },
          {
            hours: new Prisma.Decimal('140'),
            employee: { id: 'e2', hourlyRate: new Prisma.Decimal('160.00') },
          },
        ],
      );

      expect(result.employeeCount).toBe(2);
      expect(result.totalHours).toBe(40 + 80 + 140);
      expect(result.totalCost).toBe(180 * (40 + 80) + 160 * 140);
    });

    it('keeps precision on fractional values', () => {
      const result = EmployeesService.calculateSummary(
        { id: 'p1', name: 'Edge' },
        [
          {
            hours: '0.10',
            employee: { id: 'e1', hourlyRate: '50.00' },
          },
          {
            hours: '0.20',
            employee: { id: 'e1', hourlyRate: '50.00' },
          },
        ],
      );
      expect(result.totalCost).toBe(0.3 * 50);
    });

    it('forwards the supplied date range into the response', () => {
      const result = EmployeesService.calculateSummary(
        { id: 'p1', name: 'Ranged' },
        [],
        { from: '2026-04-01', to: '2026-04-30' },
      );
      expect(result.from).toBe('2026-04-01');
      expect(result.to).toBe('2026-04-30');
    });
  });

  describe('list', () => {
    it('always excludes soft-deleted rows and paginates', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);
      const service = new EmployeesService(prisma as never, makeAuditMock() as never);

      const result = await service.list({
        projectId: undefined,
        status: undefined,
        page: 2,
        limit: 5,
      } as never);

      const call = prisma.employee.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ deletedAt: null });
      expect(call.skip).toBe(5);
      expect(call.take).toBe(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('applies project and status filters when given', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);
      const service = new EmployeesService(prisma as never, makeAuditMock() as never);

      await service.list({
        projectId: '11111111-1111-1111-1111-111111111111',
        status: EmployeeStatus.ACTIVE,
        page: 1,
        limit: 20,
      } as never);

      const call = prisma.employee.findMany.mock.calls[0][0];
      expect(call.where).toEqual({
        deletedAt: null,
        projectId: '11111111-1111-1111-1111-111111111111',
        status: EmployeeStatus.ACTIVE,
      });
    });

    it('falls back to default ordering when sort is missing', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);
      const service = new EmployeesService(prisma as never, makeAuditMock() as never);

      await service.list({ page: 1, limit: 20 } as never);

      const call = prisma.employee.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual([
        { lastName: 'asc' },
        { firstName: 'asc' },
      ]);
    });

    it('honours a whitelisted sort param', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);
      const service = new EmployeesService(prisma as never, makeAuditMock() as never);

      await service.list({ page: 1, limit: 20, sort: 'hourlyRate:desc' } as never);

      const call = prisma.employee.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual([{ hourlyRate: 'desc' }]);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when missing or soft-deleted', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findFirst.mockResolvedValue(null);
      const service = new EmployeesService(prisma as never, makeAuditMock() as never);

      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'missing-id', deletedAt: null },
        include: expect.any(Object),
      });
    });
  });

  describe('create', () => {
    it('rejects when the referenced project does not exist', async () => {
      const prisma = makePrismaMock();
      prisma.project.findFirst.mockResolvedValue(null);
      const service = new EmployeesService(prisma as never, makeAuditMock() as never);

      await expect(
        service.create({
          firstName: 'Jan',
          lastName: 'Nowak',
          email: 'jan@workflex.pl',
          position: 'Dev',
          projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          hourlyRate: 150,
          status: EmployeeStatus.ACTIVE,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.employee.create).not.toHaveBeenCalled();
    });

    it('lowercases the email, trims strings, writes an audit entry', async () => {
      const prisma = makePrismaMock();
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.employee.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'e1', ...data }),
      );
      const audit = makeAuditMock();
      const service = new EmployeesService(prisma as never, audit as never);

      await service.create({
        firstName: '  Jan ',
        lastName: ' Nowak',
        email: 'Jan.Nowak@WorkFlex.PL',
        position: ' Developer ',
        projectId: 'p1',
        hourlyRate: 150,
        status: EmployeeStatus.ACTIVE,
      });

      const data = prisma.employee.create.mock.calls[0][0].data;
      expect(data.firstName).toBe('Jan');
      expect(data.lastName).toBe('Nowak');
      expect(data.email).toBe('jan.nowak@workflex.pl');
      expect(data.position).toBe('Developer');
      expect(data.projectId).toBe('p1');
      expect((data.hourlyRate as Prisma.Decimal).toString()).toBe('150');
      expect(audit.recordCreate).toHaveBeenCalledWith(
        'Employee',
        'e1',
        expect.any(Object),
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes by setting deletedAt and writes an audit entry', async () => {
      const prisma = makePrismaMock();
      const employee = { id: 'e1', firstName: 'X', lastName: 'Y' };
      prisma.employee.findFirst.mockResolvedValue(employee);
      prisma.employee.update.mockResolvedValue({ ...employee, deletedAt: new Date() });
      const audit = makeAuditMock();
      const service = new EmployeesService(prisma as never, audit as never);

      await service.remove('e1');

      const updateCall = prisma.employee.update.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 'e1' });
      expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
      expect(audit.recordDelete).toHaveBeenCalledWith(
        'Employee',
        'e1',
        employee,
      );
    });
  });

  describe('projectSummary', () => {
    it('rejects unknown projects with NotFoundException', async () => {
      const prisma = makePrismaMock();
      prisma.project.findFirst.mockResolvedValue(null);
      const service = new EmployeesService(prisma as never, makeAuditMock() as never);

      await expect(
        service.projectSummary({
          projectId: '00000000-0000-0000-0000-000000000000',
        } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when from is after to', async () => {
      const prisma = makePrismaMock();
      prisma.project.findFirst.mockResolvedValue({ id: 'p1', name: 'X' });
      const service = new EmployeesService(prisma as never, makeAuditMock() as never);

      await expect(
        service.projectSummary({
          projectId: 'p1',
          from: '2026-05-01',
          to: '2026-04-01',
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('aggregates hours and cost from time entries within the date range', async () => {
      const prisma = makePrismaMock();
      prisma.project.findFirst.mockResolvedValue({
        id: 'p1',
        name: 'WorkFlex Portal',
      });
      prisma.timeEntry.findMany.mockResolvedValue([
        {
          hours: new Prisma.Decimal('40'),
          employee: { id: 'e1', hourlyRate: new Prisma.Decimal('180') },
        },
        {
          hours: new Prisma.Decimal('40'),
          employee: { id: 'e1', hourlyRate: new Prisma.Decimal('180') },
        },
        {
          hours: new Prisma.Decimal('80'),
          employee: { id: 'e2', hourlyRate: new Prisma.Decimal('160') },
        },
      ]);
      const service = new EmployeesService(prisma as never, makeAuditMock() as never);

      const result = await service.projectSummary({
        projectId: 'p1',
        from: '2026-04-01',
        to: '2026-04-30',
      } as never);

      const call = prisma.timeEntry.findMany.mock.calls[0][0];
      expect(call.where.projectId).toBe('p1');
      expect(call.where.employee).toEqual({ deletedAt: null });
      expect(call.where.date.gte).toBeInstanceOf(Date);
      expect(call.where.date.lte).toBeInstanceOf(Date);

      expect(result.employeeCount).toBe(2);
      expect(result.totalHours).toBe(160);
      expect(result.totalCost).toBe(180 * 80 + 160 * 80);
      expect(result.from).toBe('2026-04-01');
      expect(result.to).toBe('2026-04-30');
    });

    it('skips the date filter when neither bound is supplied', async () => {
      const prisma = makePrismaMock();
      prisma.project.findFirst.mockResolvedValue({ id: 'p1', name: 'P' });
      prisma.timeEntry.findMany.mockResolvedValue([]);
      const service = new EmployeesService(prisma as never, makeAuditMock() as never);

      await service.projectSummary({ projectId: 'p1' } as never);

      const where = prisma.timeEntry.findMany.mock.calls[0][0].where;
      expect(where.date).toBeUndefined();
    });
  });
});
