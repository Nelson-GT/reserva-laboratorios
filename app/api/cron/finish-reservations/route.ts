import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const { count } = await prisma.reservation.updateMany({
    where: {
      status: 'approved',
      OR: [
        { date: { lt: today } },
        { date: today, endTime: { lte: currentTime } },
      ],
    },
    data: { status: 'finished' },
  });

  return NextResponse.json({ finished: count });
}
