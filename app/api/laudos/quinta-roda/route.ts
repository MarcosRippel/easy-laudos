import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateQuintaRodaData, validateRequiredFields, validateDateFormat, SimNao, AprovaReprovado } from '@/types/quinta-roda';

// Função para validar enums
function validateEnum<T>(value: any, allowedValues: T[]): value is T {
  return allowedValues.includes(value);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Buscar laudos de quinta roda com paginação
    const [laudosQuintaRoda, total] = await Promise.all([
      prisma.laudoQuintaRoda.findMany({
        skip,
        take: limit,
        include: {
          laudo: {
            include: {
              client: true,
              vehicle: true,
            },
          },
          equipment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.laudoQuintaRoda.count(),
    ]);

    return NextResponse.json({
      data: laudosQuintaRoda,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Erro ao buscar laudos de quinta roda:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateQuintaRodaData = await request.json();
    
    // LOG DETALHADO DOS CAMPOS DE IMAGEM RECEBIDOS
    console.log('📨 DEBUG API - Dados recebidos na API:', {
      clientId: body.clientId,
      vehicleId: body.vehicleId,
      ordemServico: body.ordemServico,
      imageFields: {
        fotoQuintaRoda1Url: body.fotoQuintaRoda1Url,
        fotoQuintaRoda2Url: body.fotoQuintaRoda2Url,
        fotoChassiUrl: body.fotoChassiUrl
      },
      hasAnyImage: !!(body.fotoQuintaRoda1Url || body.fotoQuintaRoda2Url || body.fotoChassiUrl),
      imageFieldsLength: {
        fotoQuintaRoda1Url: body.fotoQuintaRoda1Url?.length || 0,
        fotoQuintaRoda2Url: body.fotoQuintaRoda2Url?.length || 0,
        fotoChassiUrl: body.fotoChassiUrl?.length || 0
      }
    });

    // Usar validação do types/quinta-roda.ts
    const validationErrors = validateRequiredFields(body);
    if (validationErrors.length > 0) {
      console.log('❌ DEBUG API - Campos obrigatórios faltando:', validationErrors);
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar formato de data
    if (!validateDateFormat(body.dataValidadeInspecao)) {
      return NextResponse.json(
        { error: 'dataValidadeInspecao deve estar no formato DD/MM/AAAA' },
        { status: 400 }
      );
    }

    // Validar enums SimNao
    const simNaoValues: SimNao[] = ['SIM', 'NÃO'];
    const camposSimNao = [
      'seloIdentificacao', 'presencaTrincas', 'integraFixada', 'pinosIntegros',
      'mancaisOvalados', 'mecanismoTravamento', 'pinosPressos', 'desgastesCanais',
      'apoiosSapatas', 'cantoneirasFixadas', 'aterramentoFixado', 'ensaioComplementar'
    ];

    for (const campo of camposSimNao) {
      const valor = body[campo as keyof CreateQuintaRodaData];
      if (!validateEnum(valor, simNaoValues)) {
        return NextResponse.json(
          { error: `${campo} deve ser: ${simNaoValues.join(' ou ')}` },
          { status: 400 }
        );
      }
    }

    // Validar enum resultadoFinal
    const resultadoValues: AprovaReprovado[] = ['APROVADO', 'REPROVADO'];
    if (!validateEnum(body.resultadoFinal, resultadoValues)) {
      return NextResponse.json(
        { error: `resultadoFinal deve ser: ${resultadoValues.join(' ou ')}` },
        { status: 400 }
      );
    }

    // Verificar se equipamento existe e está ativo
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

    // Verificar se equipamento é PAQUIMETRO
    if (equipment.equipmentType !== 'PAQUIMETRO') {
      return NextResponse.json(
        { error: 'Equipamento deve ser do tipo PAQUIMETRO para laudos de quinta roda' },
        { status: 400 }
      );
    }

    // Verificar se cliente existe
    const client = await prisma.client.findUnique({
      where: { id: body.clientId }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se veículo existe
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: body.vehicleId }
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Veículo não encontrado' },  
        { status: 404 }
      );
    }

    // Usar transação para criar laudo e dados de quinta roda
    const result = await prisma.$transaction(async (tx) => {
      // Criar laudo principal
      const newLaudo = await tx.laudo.create({
        data: {
          clientId: body.clientId,
          vehicleId: body.vehicleId,
          ordemServico: body.ordemServico,
          dataEmissao: new Date(body.dataEmissao),
          laudoType: 'QUINTA_RODA',
          codTemporal: body.codigoTemporal,
          observacoes: body.observacoes || 'Laudo de quinta roda conforme especificações técnicas.',
        },
      });

      // LOG DETALHADO ANTES DE SALVAR NO BANCO
      console.log('💾 DEBUG API - Dados das imagens que serão salvos no banco:', {
        fotoQuintaRoda1Url: body.fotoQuintaRoda1Url,
        fotoQuintaRoda2Url: body.fotoQuintaRoda2Url,
        fotoChassiUrl: body.fotoChassiUrl,
        willSaveNonEmptyImages: {
          foto1: !!body.fotoQuintaRoda1Url && body.fotoQuintaRoda1Url.trim() !== '',
          foto2: !!body.fotoQuintaRoda2Url && body.fotoQuintaRoda2Url.trim() !== '',
          fotoChassi: !!body.fotoChassiUrl && body.fotoChassiUrl.trim() !== ''
        }
      });

      // Criar dados específicos da quinta roda
      const newLaudoQuintaRoda = await tx.laudoQuintaRoda.create({
        data: {
          laudoId: newLaudo.id,
          equipmentId: body.equipmentId,
          dataValidadeInspecao: body.dataValidadeInspecao,
          fabricanteMarca: body.fabricanteMarca,
          modelo: body.modelo,
          numeroIdentificacao: body.numeroIdentificacao,
          // Converter SimNao para Boolean - SIM = true, NÃO = false
          seloIdentificacao: body.seloIdentificacao === 'SIM',
          presencaTrincas: body.presencaTrincas === 'SIM',
          integraFixada: body.integraFixada === 'SIM',
          pinosIntegros: body.pinosIntegros === 'SIM',
          mancaisOvalados: body.mancaisOvalados === 'SIM',
          mecanismoTravamento: body.mecanismoTravamento === 'SIM',
          pinosPressos: body.pinosPressos === 'SIM',
          desgastesCanais: body.desgastesCanais === 'SIM',
          apoiosSapatas: body.apoiosSapatas === 'SIM',
          cantoneirasFixadas: body.cantoneirasFixadas === 'SIM',
          aterramentoFixado: body.aterramentoFixado === 'SIM',
          ensaioComplementar: body.ensaioComplementar === 'SIM',
          // Usar enum do Prisma
          resultadoFinal: body.resultadoFinal as 'APROVADO' | 'REPROVADO',
          fotoQuintaRoda1Url: body.fotoQuintaRoda1Url,
          fotoQuintaRoda2Url: body.fotoQuintaRoda2Url,
          fotoChassiUrl: body.fotoChassiUrl,
          observacoes: body.observacoes,
          normasAplicaveis: body.normasAplicaveis,
          inspetorResponsavel: body.inspetorResponsavel,
        },
      });
      
      // LOG DO RESULTADO CRIADO
      console.log('✅ DEBUG API - Laudo criado no banco:', {
        laudoId: newLaudo.id,
        quintaRodaId: newLaudoQuintaRoda.id,
        imageFieldsSaved: {
          fotoQuintaRoda1Url: newLaudoQuintaRoda.fotoQuintaRoda1Url,
          fotoQuintaRoda2Url: newLaudoQuintaRoda.fotoQuintaRoda2Url,
          fotoChassiUrl: newLaudoQuintaRoda.fotoChassiUrl
        }
      });

      return { laudo: newLaudo, laudoQuintaRoda: newLaudoQuintaRoda };
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar laudo de quinta roda:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe um laudo com esta Ordem de Serviço' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}