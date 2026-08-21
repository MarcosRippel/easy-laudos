// app/api/laudos/next-os/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Buscar todos os laudos e encontrar o maior número de OS
    // Ordenamos por createdAt desc e pegamos o mais recente, mas verificamos
    // TODOS os laudos para garantir que não haja colisão
    const allLaudos = await prisma.laudo.findMany({
      select: { ordemServico: true },
    });

    let maxNumber = 0;
    for (const laudo of allLaudos) {
      const num = parseInt(laudo.ordemServico, 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }

    const nextNumber = maxNumber + 1;

    // Formatar com zeros à esquerda (6 dígitos)
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