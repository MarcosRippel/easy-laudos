import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { getSessionFromRequest } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const [clientCount, vehicleCount, laudoCount, byTypeRaw, allLaudos] = await Promise.all([
      prisma.client.count(),
      prisma.vehicle.count(),
      prisma.laudo.count(),
      prisma.laudo.groupBy({ by: ['laudoType'], _count: { id: true } }),
      prisma.laudo.findMany({ select: { dataEmissao: true } }),
    ]);

    const byType = Object.fromEntries(
      byTypeRaw.map(({ laudoType, _count }) => [laudoType, _count.id])
    );

    const now = new Date();
    const byMonth = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const count = allLaudos.filter(l => l.dataEmissao >= start && l.dataEmissao <= end).length;
      return { month: format(d, 'MMM/yy'), count };
    });

    return NextResponse.json({ clients: clientCount, vehicles: vehicleCount, laudos: laudoCount, byType, byMonth });
  } catch (error) {
    console.error('Failed to retrieve stats:', error);
    return new NextResponse(JSON.stringify({ message: 'Could not retrieve stats' }), { status: 500 });
  }
}
