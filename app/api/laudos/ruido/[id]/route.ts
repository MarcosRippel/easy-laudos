import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID do laudo é obrigatório' }, { status: 400 });
    }

    // Buscar laudo de ruído com todas as relações necessárias
    const laudoRuido = await prisma.laudoRuido.findUnique({
      where: { laudoId: id },
      include: {
        laudo: {
          include: {
            client: true,
            vehicle: true,
          }
        },
        equipment: true,
      }
    });

    if (!laudoRuido || !laudoRuido.laudo) {
      return NextResponse.json({ error: 'Laudo de ruído não encontrado' }, { status: 404 });
    }

    // Estruturar os dados de resposta
    const responseData = {
      ...laudoRuido,
      // Incluir campos do laudo principal no nível raiz para compatibilidade
      dataVencimento: laudoRuido.laudo.dataVencimento,
      observacoes: laudoRuido.laudo.observacoes,
      laudo: laudoRuido.laudo,
      equipmentId: laudoRuido.equipmentId,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Erro ao buscar laudo de ruído:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}