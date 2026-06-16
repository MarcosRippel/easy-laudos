import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';

// Interface para dados de atualização do laudo pino rei
interface UpdatePinoReiData {
  // Dados do laudo principal
  dataVencimento?: string;
  codTemporal?: string;
  observacoes?: string;

  // Dados específicos do pino rei
  equipmentId?: string;
  dataValidadeInspecao?: string;
  posicaoVertical?: boolean;
  presencaTrincas?: boolean;
  integridadeFixacao?: boolean;
  seloIdentificacao?: boolean;
  tipoFixacaoPino?: 'SOLDA' | 'FLANGEADO' | 'APARAFUSADA';
  diametroRegistrado?: number;
  estadoConservacao?: boolean;
  resultadoPinoRei?: 'APROVADO' | 'REPROVADO';
  tipoFixacaoMesa?: 'SOLDA' | 'APARAFUSADA';
  mesaBemFixada?: boolean;
  mesaReparoSolda?: boolean;
  resultadoMesa?: 'APROVADO' | 'REPROVADO';
  ensaioComplementar?: boolean;
  qualEnsaio?: string;
  resultadoGeral?: 'APROVADO' | 'REPROVADO';
  fotoChassiUrl?: string;
  fotoPinoReiUrl?: string;
  fotoMesaUrl?: string;
  normasAplicaveis?: string;
  inspetorResponsavel?: string;
}

// Função para validar formato de data DD/MM/AAAA
function validateDateFormat(dateString: string): boolean {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dateString)) return false;
  
  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getDate() === day && 
         date.getMonth() === month - 1 && 
         date.getFullYear() === year;
}

// Função para validar enums
function validateEnum<T>(value: any, allowedValues: T[]): value is T {
  return allowedValues.includes(value);
}

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

    // Buscar laudo de pino rei com todas as relações necessárias
    const laudoPinoRei = await prisma.laudoPinoRei.findUnique({
      where: { id },
      include: {
        laudo: {
          include: {
            client: true,
            vehicle: true,
          },
        },
        equipment: true,
      },
    });

    if (!laudoPinoRei) {
      return NextResponse.json({ error: 'Laudo de pino rei não encontrado' }, { status: 404 });
    }

    return NextResponse.json(laudoPinoRei);

  } catch (error) {
    console.error('Erro ao buscar laudo de pino rei:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdatePinoReiData = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID do laudo é obrigatório' }, { status: 400 });
    }

    // Verificar se o laudo existe
    const existingLaudo = await prisma.laudoPinoRei.findUnique({
      where: { id },
      include: { laudo: true }
    });

    if (!existingLaudo) {
      return NextResponse.json({ error: 'Laudo de pino rei não encontrado' }, { status: 404 });
    }

    // Validações apenas para campos que estão sendo atualizados
    if (body.dataValidadeInspecao && !validateDateFormat(body.dataValidadeInspecao)) {
      return NextResponse.json(
        { error: 'dataValidadeInspecao deve estar no formato DD/MM/AAAA' },
        { status: 400 }
      );
    }

    // Validar diâmetro se fornecido
    if (body.diametroRegistrado !== undefined) {
      if (typeof body.diametroRegistrado !== 'number' || body.diametroRegistrado <= 0) {
        return NextResponse.json(
          { error: 'diametroRegistrado deve ser um número positivo' },
          { status: 400 }
        );
      }
    }

    // Validar enums se fornecidos
    if (body.tipoFixacaoPino) {
      const tipoFixacaoPinoValues = ['SOLDA', 'FLANGEADO', 'APARAFUSADA'];
      if (!validateEnum(body.tipoFixacaoPino, tipoFixacaoPinoValues)) {
        return NextResponse.json(
          { error: `tipoFixacaoPino deve ser um dos valores: ${tipoFixacaoPinoValues.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (body.tipoFixacaoMesa) {
      const tipoFixacaoMesaValues = ['SOLDA', 'APARAFUSADA'];
      if (!validateEnum(body.tipoFixacaoMesa, tipoFixacaoMesaValues)) {
        return NextResponse.json(
          { error: `tipoFixacaoMesa deve ser um dos valores: ${tipoFixacaoMesaValues.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const resultadoValues = ['APROVADO', 'REPROVADO'];
    if (body.resultadoPinoRei && !validateEnum(body.resultadoPinoRei, resultadoValues)) {
      return NextResponse.json(
        { error: `resultadoPinoRei deve ser: ${resultadoValues.join(' ou ')}` },
        { status: 400 }
      );
    }

    if (body.resultadoMesa && !validateEnum(body.resultadoMesa, resultadoValues)) {
      return NextResponse.json(
        { error: `resultadoMesa deve ser: ${resultadoValues.join(' ou ')}` },
        { status: 400 }
      );
    }

    if (body.resultadoGeral && !validateEnum(body.resultadoGeral, resultadoValues)) {
      return NextResponse.json(
        { error: `resultadoGeral deve ser: ${resultadoValues.join(' ou ')}` },
        { status: 400 }
      );
    }

    // Validação condicional: qualEnsaio obrigatório se ensaioComplementar = true
    if (body.ensaioComplementar === true && (!body.qualEnsaio || body.qualEnsaio.trim() === '')) {
      return NextResponse.json(
        { error: 'Campo qualEnsaio é obrigatório quando ensaioComplementar é verdadeiro' },
        { status: 400 }
      );
    }

    // Verificar se equipamento existe e está ativo (se fornecido)
    if (body.equipmentId) {
      const equipment = await prisma.equipment.findUnique({
        where: { id: body.equipmentId }
      });

      if (!equipment) {
        return NextResponse.json(
          { error: 'Equipamento não encontrado' },
          { status: 404 }
        );
      }

      if (!equipment.isActive) {
        return NextResponse.json(
          { error: 'Equipamento não está ativo' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização do laudo principal
    const laudoUpdateData: any = {};
    if (body.dataVencimento !== undefined) laudoUpdateData.dataVencimento = body.dataVencimento;
    if (body.codTemporal !== undefined) laudoUpdateData.codTemporal = body.codTemporal;
    if (body.observacoes !== undefined) laudoUpdateData.observacoes = body.observacoes;

    // Preparar dados para atualização do laudo pino rei
    const pinoReiUpdateData: any = {};
    if (body.equipmentId !== undefined) pinoReiUpdateData.equipmentId = body.equipmentId;
    if (body.dataValidadeInspecao !== undefined) pinoReiUpdateData.dataValidadeInspecao = body.dataValidadeInspecao;
    if (body.posicaoVertical !== undefined) pinoReiUpdateData.posicaoVertical = body.posicaoVertical;
    if (body.presencaTrincas !== undefined) pinoReiUpdateData.presencaTrincas = body.presencaTrincas;
    if (body.integridadeFixacao !== undefined) pinoReiUpdateData.integridadeFixacao = body.integridadeFixacao;
    if (body.seloIdentificacao !== undefined) pinoReiUpdateData.seloIdentificacao = body.seloIdentificacao;
    if (body.tipoFixacaoPino !== undefined) pinoReiUpdateData.tipoFixacaoPino = body.tipoFixacaoPino;
    if (body.diametroRegistrado !== undefined) pinoReiUpdateData.diametroRegistrado = body.diametroRegistrado;
    if (body.estadoConservacao !== undefined) pinoReiUpdateData.estadoConservacao = body.estadoConservacao;
    if (body.resultadoPinoRei !== undefined) pinoReiUpdateData.resultadoPinoRei = body.resultadoPinoRei;
    if (body.tipoFixacaoMesa !== undefined) pinoReiUpdateData.tipoFixacaoMesa = body.tipoFixacaoMesa;
    if (body.mesaBemFixada !== undefined) pinoReiUpdateData.mesaBemFixada = body.mesaBemFixada;
    if (body.mesaReparoSolda !== undefined) pinoReiUpdateData.mesaReparoSolda = body.mesaReparoSolda;
    if (body.resultadoMesa !== undefined) pinoReiUpdateData.resultadoMesa = body.resultadoMesa;
    if (body.ensaioComplementar !== undefined) pinoReiUpdateData.ensaioComplementar = body.ensaioComplementar;
    if (body.qualEnsaio !== undefined) pinoReiUpdateData.qualEnsaio = body.qualEnsaio;
    if (body.resultadoGeral !== undefined) pinoReiUpdateData.resultadoGeral = body.resultadoGeral;
    if (body.fotoChassiUrl !== undefined) pinoReiUpdateData.fotoChassiUrl = body.fotoChassiUrl;
    if (body.fotoPinoReiUrl !== undefined) pinoReiUpdateData.fotoPinoReiUrl = body.fotoPinoReiUrl;
    if (body.fotoMesaUrl !== undefined) pinoReiUpdateData.fotoMesaUrl = body.fotoMesaUrl;
    if (body.normasAplicaveis !== undefined) pinoReiUpdateData.normasAplicaveis = body.normasAplicaveis;
    if (body.inspetorResponsavel !== undefined) pinoReiUpdateData.inspetorResponsavel = body.inspetorResponsavel;

    // Usar transação para atualizar ambos os registros
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar laudo principal se há dados para atualizar
      if (Object.keys(laudoUpdateData).length > 0) {
        await tx.laudo.update({
          where: { id: existingLaudo.laudoId },
          data: laudoUpdateData,
        });
      }

      // Atualizar dados específicos do pino rei se há dados para atualizar
      if (Object.keys(pinoReiUpdateData).length > 0) {
        await tx.laudoPinoRei.update({
          where: { id },
          data: pinoReiUpdateData,
        });
      }

      // Buscar o registro atualizado com todas as relações
      return await tx.laudoPinoRei.findUnique({
        where: { id },
        include: {
          laudo: {
            include: {
              client: true,
              vehicle: true,
            },
          },
          equipment: true,
        },
      });
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro ao atualizar laudo de pino rei:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verificar se o laudo existe
    const existingLaudo = await prisma.laudoPinoRei.findUnique({
      where: { id },
      include: { laudo: true }
    });

    if (!existingLaudo) {
      return NextResponse.json({ error: 'Laudo de pino rei não encontrado' }, { status: 404 });
    }

    // Usar transação para deletar ambos os registros
    await prisma.$transaction(async (tx) => {
      // Deletar primeiro o laudo específico de pino rei
      await tx.laudoPinoRei.delete({
        where: { id },
      });

      // Deletar o laudo principal
      await tx.laudo.delete({
        where: { id: existingLaudo.laudoId },
      });
    });

    return NextResponse.json({ message: 'Laudo de pino rei deletado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar laudo de pino rei:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}