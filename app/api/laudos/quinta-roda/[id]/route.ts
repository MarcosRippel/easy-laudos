import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';
import { validateDateFormat, SimNao, AprovaReprovado } from '@/types/quinta-roda';

// Interface para dados de atualização do laudo quinta roda
interface UpdateQuintaRodaData {
  // Dados do laudo principal
  codTemporal?: string;
  observacoes?: string;

  // Dados específicos da quinta roda
  equipmentId?: string;
  dataValidadeInspecao?: string;
  fabricanteMarca?: string;
  modelo?: string;
  numeroIdentificacao?: string;
  
  // 12 Itens de Exame Visual (SimNao)
  seloIdentificacao?: SimNao;
  presencaTrincas?: SimNao;
  integraFixada?: SimNao;
  pinosIntegros?: SimNao;
  mancaisOvalados?: SimNao;
  mecanismoTravamento?: SimNao;
  pinosPressos?: SimNao;
  desgastesCanais?: SimNao;
  apoiosSapatas?: SimNao;
  cantoneirasFixadas?: SimNao;
  aterramentoFixado?: SimNao;
  ensaioComplementar?: SimNao;
  
  // Resultado Final
  resultadoFinal?: AprovaReprovado;
  
  // Registro Fotográfico
  fotoQuintaRodaUrl?: string;
  
  // Observações e Normas
  normasAplicaveis?: string;
  inspetorResponsavel?: string;
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

    // Buscar laudo de quinta roda com todas as relações necessárias
    const laudoQuintaRoda = await prisma.laudoQuintaRoda.findUnique({
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

    if (!laudoQuintaRoda) {
      return NextResponse.json({ error: 'Laudo de quinta roda não encontrado' }, { status: 404 });
    }

    return NextResponse.json(laudoQuintaRoda);

  } catch (error) {
    console.error('Erro ao buscar laudo de quinta roda:', error);
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
    const body: UpdateQuintaRodaData = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID do laudo é obrigatório' }, { status: 400 });
    }

    // Verificar se o laudo existe
    const existingLaudo = await prisma.laudoQuintaRoda.findUnique({
      where: { id },
      include: { laudo: true }
    });

    if (!existingLaudo) {
      return NextResponse.json({ error: 'Laudo de quinta roda não encontrado' }, { status: 404 });
    }

    // Validações apenas para campos que estão sendo atualizados
    if (body.dataValidadeInspecao && !validateDateFormat(body.dataValidadeInspecao)) {
      return NextResponse.json(
        { error: 'dataValidadeInspecao deve estar no formato DD/MM/AAAA' },
        { status: 400 }
      );
    }

    // Validar enums SimNao se fornecidos
    const simNaoValues: SimNao[] = ['SIM', 'NÃO'];
    const camposSimNao = [
      'seloIdentificacao', 'presencaTrincas', 'integraFixada', 'pinosIntegros',
      'mancaisOvalados', 'mecanismoTravamento', 'pinosPressos', 'desgastesCanais',
      'apoiosSapatas', 'cantoneirasFixadas', 'aterramentoFixado', 'ensaioComplementar'
    ];

    for (const campo of camposSimNao) {
      const valor = body[campo as keyof UpdateQuintaRodaData];
      if (valor !== undefined && !validateEnum(valor, simNaoValues)) {
        return NextResponse.json(
          { error: `${campo} deve ser: ${simNaoValues.join(' ou ')}` },
          { status: 400 }
        );
      }
    }

    // Validar enum resultadoFinal
    if (body.resultadoFinal) {
      const resultadoValues: AprovaReprovado[] = ['APROVADO', 'REPROVADO'];
      if (!validateEnum(body.resultadoFinal, resultadoValues)) {
        return NextResponse.json(
          { error: `resultadoFinal deve ser: ${resultadoValues.join(' ou ')}` },
          { status: 400 }
        );
      }
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

      if (equipment.equipmentType !== 'PAQUIMETRO') {
        return NextResponse.json(
          { error: 'Equipamento deve ser do tipo PAQUIMETRO para laudos de quinta roda' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização do laudo principal
    const laudoUpdateData: any = {};
    if (body.codTemporal !== undefined) laudoUpdateData.codTemporal = body.codTemporal;
    if (body.observacoes !== undefined) laudoUpdateData.observacoes = body.observacoes;

    // Preparar dados para atualização do laudo quinta roda
    const quintaRodaUpdateData: any = {};
    if (body.equipmentId !== undefined) quintaRodaUpdateData.equipmentId = body.equipmentId;
    if (body.dataValidadeInspecao !== undefined) quintaRodaUpdateData.dataValidadeInspecao = body.dataValidadeInspecao;
    if (body.fabricanteMarca !== undefined) quintaRodaUpdateData.fabricanteMarca = body.fabricanteMarca;
    if (body.modelo !== undefined) quintaRodaUpdateData.modelo = body.modelo;
    if (body.numeroIdentificacao !== undefined) quintaRodaUpdateData.numeroIdentificacao = body.numeroIdentificacao;
    
    // Converter SimNao para Boolean para os 12 campos de exame visual
    if (body.seloIdentificacao !== undefined) quintaRodaUpdateData.seloIdentificacao = body.seloIdentificacao === 'SIM';
    if (body.presencaTrincas !== undefined) quintaRodaUpdateData.presencaTrincas = body.presencaTrincas === 'SIM';
    if (body.integraFixada !== undefined) quintaRodaUpdateData.integraFixada = body.integraFixada === 'SIM';
    if (body.pinosIntegros !== undefined) quintaRodaUpdateData.pinosIntegros = body.pinosIntegros === 'SIM';
    if (body.mancaisOvalados !== undefined) quintaRodaUpdateData.mancaisOvalados = body.mancaisOvalados === 'SIM';
    if (body.mecanismoTravamento !== undefined) quintaRodaUpdateData.mecanismoTravamento = body.mecanismoTravamento === 'SIM';
    if (body.pinosPressos !== undefined) quintaRodaUpdateData.pinosPressos = body.pinosPressos === 'SIM';
    if (body.desgastesCanais !== undefined) quintaRodaUpdateData.desgastesCanais = body.desgastesCanais === 'SIM';
    if (body.apoiosSapatas !== undefined) quintaRodaUpdateData.apoiosSapatas = body.apoiosSapatas === 'SIM';
    if (body.cantoneirasFixadas !== undefined) quintaRodaUpdateData.cantoneirasFixadas = body.cantoneirasFixadas === 'SIM';
    if (body.aterramentoFixado !== undefined) quintaRodaUpdateData.aterramentoFixado = body.aterramentoFixado === 'SIM';
    if (body.ensaioComplementar !== undefined) quintaRodaUpdateData.ensaioComplementar = body.ensaioComplementar === 'SIM';
    
    if (body.resultadoFinal !== undefined) quintaRodaUpdateData.resultadoFinal = body.resultadoFinal;
    if (body.fotoQuintaRodaUrl !== undefined) quintaRodaUpdateData.fotoQuintaRodaUrl = body.fotoQuintaRodaUrl;
    if (body.normasAplicaveis !== undefined) quintaRodaUpdateData.normasAplicaveis = body.normasAplicaveis;
    if (body.inspetorResponsavel !== undefined) quintaRodaUpdateData.inspetorResponsavel = body.inspetorResponsavel;

    // Usar transação para atualizar ambos os registros
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar laudo principal se há dados para atualizar
      if (Object.keys(laudoUpdateData).length > 0) {
        await tx.laudo.update({
          where: { id: existingLaudo.laudoId },
          data: laudoUpdateData,
        });
      }

      // Atualizar dados específicos da quinta roda se há dados para atualizar
      if (Object.keys(quintaRodaUpdateData).length > 0) {
        await tx.laudoQuintaRoda.update({
          where: { id },
          data: quintaRodaUpdateData,
        });
      }

      // Buscar o registro atualizado com todas as relações
      return await tx.laudoQuintaRoda.findUnique({
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
    console.error('Erro ao atualizar laudo de quinta roda:', error);
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
    const existingLaudo = await prisma.laudoQuintaRoda.findUnique({
      where: { id },
      include: { laudo: true }
    });

    if (!existingLaudo) {
      return NextResponse.json({ error: 'Laudo de quinta roda não encontrado' }, { status: 404 });
    }

    // Usar transação para deletar ambos os registros
    await prisma.$transaction(async (tx) => {
      // Deletar primeiro o laudo específico de quinta roda
      await tx.laudoQuintaRoda.delete({
        where: { id },
      });

      // Deletar o laudo principal
      await tx.laudo.delete({
        where: { id: existingLaudo.laudoId },
      });
    });

    return NextResponse.json({ message: 'Laudo de quinta roda deletado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar laudo de quinta roda:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}