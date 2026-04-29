import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const employees = [
    { employeeCode: 'EMP001', name: 'Aarav Sharma', email: 'aarav@company.com', passwordHash },
    { employeeCode: 'EMP002', name: 'Riya Patel', email: 'riya@company.com', passwordHash },
    { employeeCode: 'EMP003', name: 'Vikram Singh', email: 'vikram@company.com', passwordHash }
  ];

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { employeeCode: employee.employeeCode },
      update: employee,
      create: employee
    });
  }

  console.log('Seed complete');
}

main().finally(() => prisma.$disconnect());
