import { NotFoundException } from '@nestjs/common';
import { EmployeeStatus, Prisma } from '@prisma/client';
import { EmployeesService } from './employees.service';

type PrismaMock = {
  employee: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

function makePrismaMock(): PrismaMock {
  return {
    employee: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('EmployeesService', () => {
  describe('calculateSummary (pure)', () => {
    it('returns zeros for empty project', () => {
      const result = EmployeesService.calculateSummary('Phantom', []);
      expect(result).toEqual({
        project: 'Phantom',
        employeeCount: 0,
        totalHours: 0,
        totalCost: 0,
      });
    });

    it('sums hours and multiplies by hourly rate with two decimals', () => {
      const result = EmployeesService.calculateSummary('WorkFlex Portal', [
        { hourlyRate: new Prisma.Decimal('180.00'), hoursWorked: 120 },
        { hourlyRate: new Prisma.Decimal('160.00'), hoursWorked: 140 },
        { hourlyRate: new Prisma.Decimal('140.00'), hoursWorked: 60 },
      ]);

      expect(result.employeeCount).toBe(3);
      expect(result.totalHours).toBe(120 + 140 + 60);
      expect(result.totalCost).toBe(180 * 120 + 160 * 140 + 140 * 60);
    });

    it('keeps precision on fractional rates that would break with floats', () => {
      const result = EmployeesService.calculateSummary('Edge', [
        { hourlyRate: new Prisma.Decimal('0.10'), hoursWorked: 3 },
        { hourlyRate: new Prisma.Decimal('0.20'), hoursWorked: 1 },
      ]);

      expect(result.totalCost).toBe(0.5);
    });

    it('accepts hourlyRate provided as string or number', () => {
      const result = EmployeesService.calculateSummary('Mixed', [
        { hourlyRate: '50.50', hoursWorked: 2 },
        { hourlyRate: 25 as unknown as Prisma.Decimal, hoursWorked: 4 },
      ]);

      expect(result.totalCost).toBe(50.5 * 2 + 25 * 4);
    });
  });

  describe('list', () => {
    it('builds a case-insensitive project filter and orders by name', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findMany.mockResolvedValue([]);
      const service = new EmployeesService(prisma as never);

      await service.list({ project: 'WorkFlex Portal' });

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: {
          project: { equals: 'WorkFlex Portal', mode: 'insensitive' },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
    });

    it('passes status filter through when provided', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findMany.mockResolvedValue([]);
      const service = new EmployeesService(prisma as never);

      await service.list({ status: EmployeeStatus.ACTIVE });

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { status: EmployeeStatus.ACTIVE },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
    });

    it('uses an empty where clause when no filters are given', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findMany.mockResolvedValue([]);
      const service = new EmployeesService(prisma as never);

      await service.list({});

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when no employee matches', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findUnique.mockResolvedValue(null);
      const service = new EmployeesService(prisma as never);

      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the matched employee', async () => {
      const prisma = makePrismaMock();
      const employee = { id: 'e1', firstName: 'Anna' };
      prisma.employee.findUnique.mockResolvedValue(employee);
      const service = new EmployeesService(prisma as never);

      await expect(service.findOne('e1')).resolves.toBe(employee);
      expect(prisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'e1' },
      });
    });
  });

  describe('create', () => {
    it('trims string fields and passes a Decimal hourly rate', async () => {
      const prisma = makePrismaMock();
      prisma.employee.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'new', ...data }),
      );
      const service = new EmployeesService(prisma as never);

      await service.create({
        firstName: '  Jan ',
        lastName: ' Nowak',
        position: ' Developer ',
        project: ' WorkFlex ',
        hourlyRate: 150,
        hoursWorked: 40,
        status: EmployeeStatus.ACTIVE,
      });

      const call = prisma.employee.create.mock.calls[0][0];
      expect(call.data.firstName).toBe('Jan');
      expect(call.data.lastName).toBe('Nowak');
      expect(call.data.position).toBe('Developer');
      expect(call.data.project).toBe('WorkFlex');
      expect(call.data.hourlyRate).toBeInstanceOf(Prisma.Decimal);
      expect((call.data.hourlyRate as Prisma.Decimal).toString()).toBe('150');
      expect(call.data.hoursWorked).toBe(40);
      expect(call.data.status).toBe(EmployeeStatus.ACTIVE);
    });
  });

  describe('update', () => {
    it('rejects updates for non-existing employees before touching Prisma update', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findUnique.mockResolvedValue(null);
      const service = new EmployeesService(prisma as never);

      await expect(
        service.update('nope', { firstName: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.employee.update).not.toHaveBeenCalled();
    });

    it('only sends provided fields and skips undefined ones', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.employee.update.mockResolvedValue({ id: 'e1' });
      const service = new EmployeesService(prisma as never);

      await service.update('e1', { hourlyRate: 200, status: EmployeeStatus.ON_LEAVE });

      const call = prisma.employee.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'e1' });
      expect(Object.keys(call.data).sort()).toEqual(['hourlyRate', 'status']);
      expect((call.data.hourlyRate as Prisma.Decimal).toString()).toBe('200');
      expect(call.data.status).toBe(EmployeeStatus.ON_LEAVE);
    });
  });

  describe('remove', () => {
    it('throws when employee does not exist', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findUnique.mockResolvedValue(null);
      const service = new EmployeesService(prisma as never);

      await expect(service.remove('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.employee.delete).not.toHaveBeenCalled();
    });

    it('deletes when employee exists', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.employee.delete.mockResolvedValue({ id: 'e1' });
      const service = new EmployeesService(prisma as never);

      await service.remove('e1');
      expect(prisma.employee.delete).toHaveBeenCalledWith({
        where: { id: 'e1' },
      });
    });
  });

  describe('projectSummary', () => {
    it('queries Prisma case-insensitively and projects the right shape', async () => {
      const prisma = makePrismaMock();
      prisma.employee.findMany.mockResolvedValue([
        { hourlyRate: new Prisma.Decimal('100'), hoursWorked: 10 },
        { hourlyRate: new Prisma.Decimal('200'), hoursWorked: 5 },
      ]);
      const service = new EmployeesService(prisma as never);

      const result = await service.projectSummary('WorkFlex Portal');

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: {
          project: { equals: 'WorkFlex Portal', mode: 'insensitive' },
        },
        select: { hourlyRate: true, hoursWorked: true },
      });
      expect(result).toEqual({
        project: 'WorkFlex Portal',
        employeeCount: 2,
        totalHours: 15,
        totalCost: 100 * 10 + 200 * 5,
      });
    });
  });
});
