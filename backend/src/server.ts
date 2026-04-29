import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from './config';
import { prisma } from './db';
import { requireAuth } from './middleware/auth';
import { generateVisitorCard } from './services/digitalCard';
import { sendEmail } from './services/email';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/auth/login', async (req, res) => {
  const schema = z.object({ employeeCode: z.string(), password: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const employee = await prisma.employee.findUnique({ where: { employeeCode: parsed.data.employeeCode } });
  if (!employee) return res.status(401).json({ message: 'Invalid credentials' });

  const isValid = await bcrypt.compare(parsed.data.password, employee.passwordHash);
  if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ employeeId: employee.id }, config.jwtSecret, { expiresIn: '12h' });
  return res.json({ token, employee: { id: employee.id, name: employee.name, email: employee.email } });
});

app.get('/employees', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim();
  const employees = await prisma.employee.findMany({
    where: q
      ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { employeeCode: { contains: q } }] }
      : undefined,
    select: { id: true, name: true, email: true, employeeCode: true },
    take: 50
  });
  res.json(employees);
});

app.post('/visits/check-in', requireAuth, async (req, res) => {
  const schema = z.object({
    visitType: z.string(), visitorName: z.string(), phone: z.string(), company: z.string(),
    personToMeetId: z.string(), idProof: z.string(), email: z.string().email()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const active = await prisma.visit.findFirst({
    where: {
      status: 'CHECKED_IN',
      OR: [{ phone: parsed.data.phone }, { email: parsed.data.email }]
    }
  });
  if (active) return res.status(409).json({ message: 'Active visit already exists. Please check out first.' });

  const digitalCardId = `VID-${Date.now()}`;
  const visit = await prisma.visit.create({ data: { ...parsed.data, digitalCardId } , include: { host: true }});

  const card = await generateVisitorCard({ digitalCardId, visitorName: visit.visitorName, company: visit.company, hostName: visit.host.name, checkInTime: visit.checkInTime });

  await sendEmail(visit.email, 'Check-In Confirmation', `Hello ${visit.visitorName}, you are checked in.`, [
    { filename: `visitor-${digitalCardId}.pdf`, content: card }
  ]);

  await sendEmail(visit.host.email, 'Visitor Arrived', `${visit.visitorName} has arrived to meet you and is waiting at reception.`);

  return res.json({ message: 'Check-in done', visitId: visit.id, digitalCardId });
});

app.post('/visits/check-out', requireAuth, async (req, res) => {
  const schema = z.object({ visitId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const visit = await prisma.visit.findUnique({ where: { id: parsed.data.visitId } });
  if (!visit) return res.status(404).json({ message: 'Visit not found' });
  if (visit.status === 'CHECKED_OUT') return res.status(400).json({ message: 'Already checked out' });

  const updated = await prisma.visit.update({
    where: { id: visit.id },
    data: { status: 'CHECKED_OUT', checkOutTime: new Date() }
  });

  res.json({ message: 'Check-out complete', checkOutTime: updated.checkOutTime });
});

app.get('/dashboard/daily', requireAuth, async (_req, res) => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const [totalToday, checkedInNow, visits] = await Promise.all([
    prisma.visit.count({ where: { checkInTime: { gte: start, lte: end } } }),
    prisma.visit.count({ where: { status: 'CHECKED_IN' } }),
    prisma.visit.findMany({
      where: { checkInTime: { gte: start, lte: end } },
      include: { host: true },
      orderBy: { checkInTime: 'desc' }
    })
  ]);

  res.json({ totalToday, checkedInNow, visits });
});

app.listen(config.port, () => console.log(`Backend running on ${config.port}`));
