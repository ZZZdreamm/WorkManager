import { PrismaClient, EmployeeStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.employee.deleteMany();

  await prisma.employee.createMany({
    data: [
      {
        firstName: 'Anna',
        lastName: 'Kowalska',
        position: 'Senior Frontend Developer',
        project: 'WorkFlex Portal',
        hourlyRate: '180.00',
        hoursWorked: 120,
        status: EmployeeStatus.ACTIVE,
      },
      {
        firstName: 'Jan',
        lastName: 'Nowak',
        position: 'Backend Developer',
        project: 'WorkFlex Portal',
        hourlyRate: '160.00',
        hoursWorked: 140,
        status: EmployeeStatus.ACTIVE,
      },
      {
        firstName: 'Magdalena',
        lastName: 'Wójcik',
        position: 'UX Designer',
        project: 'WorkFlex Portal',
        hourlyRate: '140.00',
        hoursWorked: 60,
        status: EmployeeStatus.ON_LEAVE,
      },
      {
        firstName: 'Piotr',
        lastName: 'Lewandowski',
        position: 'DevOps Engineer',
        project: 'Internal Tools',
        hourlyRate: '200.00',
        hoursWorked: 80,
        status: EmployeeStatus.ACTIVE,
      },
      {
        firstName: 'Karolina',
        lastName: 'Zielińska',
        position: 'QA Engineer',
        project: 'Internal Tools',
        hourlyRate: '120.00',
        hoursWorked: 100,
        status: EmployeeStatus.INACTIVE,
      },
      {
        firstName: 'Tomasz',
        lastName: 'Wiśniewski',
        position: 'Project Manager',
        project: 'Client Onboarding',
        hourlyRate: '220.00',
        hoursWorked: 95,
        status: EmployeeStatus.ACTIVE,
      },
    ],
  });

  const count = await prisma.employee.count();
  console.log(`Seeded ${count} employees.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
