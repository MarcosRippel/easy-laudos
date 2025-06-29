import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [clientCount, vehicleCount, laudoCount] = await Promise.all([
      prisma.client.count(),
      prisma.vehicle.count(),
      prisma.laudo.count(),
    ]);

    return NextResponse.json({
      clients: clientCount,
      vehicles: vehicleCount,
      laudos: laudoCount,
    });
  } catch (error) {
    console.error('Failed to retrieve stats:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Could not retrieve stats' }),
      { status: 500 }
    );
  }
}