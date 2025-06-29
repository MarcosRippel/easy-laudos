// app/api/laudos/next-os/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Find the laudo with the highest 'ordemServico' number
    const lastLaudo = await prisma.laudo.findFirst({
      orderBy: {
        createdAt: 'desc', // Assuming the last created has the highest number
      },
    });

    let nextNumber = 1;
    if (lastLaudo && lastLaudo.ordemServico) {
      const lastNumber = parseInt(lastLaudo.ordemServico, 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Format the number to have leading zeros (e.g., 6 digits long)
    const nextOrdemServico = String(nextNumber).padStart(6, '0');

    return NextResponse.json({ nextOrdemServico });

  } catch (error) {
    console.error('Failed to get next Ordem de Serviço:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Could not calculate next service order number' }),
      { status: 500 }
    );
  }
}