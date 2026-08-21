import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const laudo = await prisma.laudo.findUnique({
      where: { id },
      include: {
        client: true,
        vehicle: true,
      },
    });

    if (!laudo) {
      return new NextResponse(JSON.stringify({ message: 'Laudo not found' }), { status: 404 });
    }
    
    return NextResponse.json(laudo);

  } catch (error) {
    console.error('Failed to retrieve laudo:', error);
    return new NextResponse(JSON.stringify({ message: 'Failed to retrieve laudo' }), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Verificar se o laudo existe
    const existingLaudo = await prisma.laudo.findUnique({
      where: { id }
    });

    if (!existingLaudo) {
      return new NextResponse(JSON.stringify({ message: 'Laudo não encontrado' }), { status: 404 });
    }

    // Deletar o laudo usando transação para garantir consistência
    await prisma.$transaction(async (tx) => {
      // Deletar registros relacionados baseado no tipo de laudo
      switch (existingLaudo.laudoType) {
        case 'PINO_REI':
          await tx.laudoPinoRei.deleteMany({
            where: { laudoId: id }
          });
          break;
        case 'QUINTA_RODA':
          await tx.laudoQuintaRoda.deleteMany({
            where: { laudoId: id }
          });
          break;
        case 'RUIDO':
          await tx.laudoRuido.deleteMany({
            where: { laudoId: id }
          });
          break;
      }
      
      // Deletar o laudo principal
      await tx.laudo.delete({
        where: { id }
      });
    });

    return new NextResponse(JSON.stringify({ message: 'Laudo excluído com sucesso' }), { status: 200 });

  } catch (error) {
    console.error('Erro ao excluir laudo:', error);
    return new NextResponse(JSON.stringify({ message: 'Erro ao excluir laudo' }), { status: 500 });
  }
}