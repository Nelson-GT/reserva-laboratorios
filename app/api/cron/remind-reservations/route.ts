import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReservationReminderEmail } from '@/lib/email';

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Build target windows for 24h and 1h ahead (±30 min each)
  function targetWindow(offsetMs: number) {
    const target = new Date(now.getTime() + offsetMs);
    const minus30 = new Date(target.getTime() - 30 * 60_000);
    const plus30 = new Date(target.getTime() + 30 * 60_000);

    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
    const toTimeStr = (d: Date) =>
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    return {
      date: toDateStr(target),
      timeFrom: toTimeStr(minus30),
      timeTo: toTimeStr(plus30),
    };
  }

  const w24 = targetWindow(24 * 60 * 60_000);
  const w1 = targetWindow(60 * 60_000);

  const [due24, due1] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: 'approved',
        remindedAt24h: null,
        date: w24.date,
        startTime: { gte: w24.timeFrom, lte: w24.timeTo },
      },
      include: {
        user: { select: { email: true } },
        laboratory: { select: { name: true } },
        computerReservations: { include: { computer: { select: { number: true } } } },
      },
    }),
    prisma.reservation.findMany({
      where: {
        status: 'approved',
        remindedAt1h: null,
        date: w1.date,
        startTime: { gte: w1.timeFrom, lte: w1.timeTo },
      },
      include: {
        user: { select: { email: true } },
        laboratory: { select: { name: true } },
        computerReservations: { include: { computer: { select: { number: true } } } },
      },
    }),
  ]);

  let sent24 = 0;
  let sent1 = 0;

  for (const r of due24) {
    try {
      await sendReservationReminderEmail(r.user.email, '24h', {
        labName: r.laboratory.name,
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        type: r.type,
        purpose: r.purpose,
        computerNumber: r.computerReservations[0]?.computer.number,
      });
      await prisma.reservation.update({ where: { id: r.id }, data: { remindedAt24h: now } });
      sent24++;
    } catch {}
  }

  for (const r of due1) {
    try {
      await sendReservationReminderEmail(r.user.email, '1h', {
        labName: r.laboratory.name,
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        type: r.type,
        purpose: r.purpose,
        computerNumber: r.computerReservations[0]?.computer.number,
      });
      await prisma.reservation.update({ where: { id: r.id }, data: { remindedAt1h: now } });
      sent1++;
    } catch {}
  }

  return NextResponse.json({ reminded24h: sent24, reminded1h: sent1 });
}
