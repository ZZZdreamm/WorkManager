import { PrismaClient, EmployeeStatus, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.timeEntry.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.project.deleteMany();

  const portal = await prisma.project.create({
    data: {
      name: 'WorkFlex Portal',
      client: 'Internal',
      budget: '250000.00',
      startDate: new Date('2026-01-15'),
      status: ProjectStatus.ACTIVE,
    },
  });

  const internal = await prisma.project.create({
    data: {
      name: 'Internal Tools',
      client: 'Internal',
      budget: '80000.00',
      startDate: new Date('2025-09-01'),
      status: ProjectStatus.ACTIVE,
    },
  });

  const onboarding = await prisma.project.create({
    data: {
      name: 'Client Onboarding',
      client: 'Acme Corp',
      budget: '120000.00',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-09-30'),
      status: ProjectStatus.ACTIVE,
    },
  });

  const anna = await prisma.employee.create({
    data: {
      firstName: 'Anna',
      lastName: 'Kowalska',
      email: 'anna.kowalska@workflex.pl',
      position: 'Senior Frontend Developer',
      projectId: portal.id,
      hourlyRate: '180.00',
      status: EmployeeStatus.ACTIVE,
    },
  });

  const jan = await prisma.employee.create({
    data: {
      firstName: 'Jan',
      lastName: 'Nowak',
      email: 'jan.nowak@workflex.pl',
      position: 'Backend Developer',
      projectId: portal.id,
      hourlyRate: '160.00',
      status: EmployeeStatus.ACTIVE,
    },
  });

  const magda = await prisma.employee.create({
    data: {
      firstName: 'Magdalena',
      lastName: 'Wójcik',
      email: 'magdalena.wojcik@workflex.pl',
      position: 'UX Designer',
      projectId: portal.id,
      hourlyRate: '140.00',
      status: EmployeeStatus.ON_LEAVE,
    },
  });

  const piotr = await prisma.employee.create({
    data: {
      firstName: 'Piotr',
      lastName: 'Lewandowski',
      email: 'piotr.lewandowski@workflex.pl',
      position: 'DevOps Engineer',
      projectId: internal.id,
      hourlyRate: '200.00',
      status: EmployeeStatus.ACTIVE,
    },
  });

  const karolina = await prisma.employee.create({
    data: {
      firstName: 'Karolina',
      lastName: 'Zielińska',
      email: 'karolina.zielinska@workflex.pl',
      position: 'QA Engineer',
      projectId: internal.id,
      hourlyRate: '120.00',
      status: EmployeeStatus.INACTIVE,
    },
  });

  const tomasz = await prisma.employee.create({
    data: {
      firstName: 'Tomasz',
      lastName: 'Wiśniewski',
      email: 'tomasz.wisniewski@workflex.pl',
      position: 'Project Manager',
      projectId: onboarding.id,
      hourlyRate: '220.00',
      status: EmployeeStatus.ACTIVE,
    },
  });

  const entries: Array<{
    employeeId: string;
    projectId: string;
    date: Date;
    hours: string;
    description?: string;
  }> = [];

  function addEntries(
    employeeId: string,
    projectId: string,
    totalHours: number,
  ) {
    let remaining = totalHours;
    const days = [
      new Date('2026-04-06'),
      new Date('2026-04-13'),
      new Date('2026-04-20'),
      new Date('2026-04-27'),
    ];
    for (let i = 0; i < days.length && remaining > 0; i++) {
      const chunk = i === days.length - 1 ? remaining : Math.min(remaining, 40);
      entries.push({
        employeeId,
        projectId,
        date: days[i],
        hours: chunk.toFixed(2),
        description: `Week of ${days[i].toISOString().slice(0, 10)}`,
      });
      remaining -= chunk;
    }
  }

  addEntries(anna.id, portal.id, 120);
  addEntries(jan.id, portal.id, 140);
  addEntries(magda.id, portal.id, 60);
  addEntries(piotr.id, internal.id, 80);
  addEntries(karolina.id, internal.id, 100);
  addEntries(tomasz.id, onboarding.id, 95);

  await prisma.timeEntry.createMany({ data: entries });

  const [projectCount, employeeCount, entryCount] = await Promise.all([
    prisma.project.count(),
    prisma.employee.count(),
    prisma.timeEntry.count(),
  ]);

  console.log(
    `Seeded ${projectCount} projects, ${employeeCount} employees, ${entryCount} time entries.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
