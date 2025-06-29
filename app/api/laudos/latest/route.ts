import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const latestLaudos = await prisma.laudo.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: true,
        vehicle: true,
      },
    });
    return NextResponse.json(latestLaudos);
  } catch (error) {
    console.error('Failed to retrieve latest laudos:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Could not retrieve latest laudos' }),
      { status: 500 }
    );
  }
}