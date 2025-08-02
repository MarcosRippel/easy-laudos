import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Interface para dados de criação do laudo pino rei
interface CreatePinoReiData {
  // Dados do laudo principal
  clientId: string;
  vehicleId: string;
  ordemServico: string;
  dataEmissao: string;
  dataVencimento?: string;
  codTemporal?: string;
  codigoTemporal?: string; // ADICIONAR: Compatibilidade com frontend
  observacoes?: string;

  // Dados específicos do pino rei
  equipmentId: string;
  dataValidadeInspecao: string;
  posicaoVertical: boolean;
  presencaTrincas: boolean;
  integridadeFixacao: boolean;
  seloIdentificacao: boolean;
  tipoFixacaoPino: 'SOLDA' | 'FLANGEADO' | 'APARAFUSADA';
  diametroRegistrado: number;
  estadoConservacao: boolean;
  resultadoPinoRei: 'APROVADO' | 'REPROVADO';
  tipoFixacaoMesa: 'SOLDA' | 'APARAFUSADA';
  mesaBemFixada: boolean;
  mesaReparoSolda: boolean;
  resultadoMesa: 'APROVADO' | 'REPROVADO';
  ensaioComplementar: boolean;
  qualEnsaio?: string;
  resultadoGeral: 'APROVADO' | 'REPROVADO';
  fotoChassiUrl?: string;
  fotoPinoReiUrl?: string;
  fotoMesaUrl?: string;
  normasAplicaveis: string;
  inspetorResponsavel: string;
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Buscar laudos de pino rei com paginação
    const [laudosPinoRei, total] = await Promise.all([
      prisma.laudoPinoRei.findMany({
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
      prisma.laudoPinoRei.count(),
    ]);

    return NextResponse.json({
      data: laudosPinoRei,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Erro ao buscar laudos de pino rei:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreatePinoReiData = await request.json();

    // Validações obrigatórias
    const requiredFields = [
      'clientId', 'vehicleId', 'ordemServico', 'dataEmissao', 'equipmentId',
      'dataValidadeInspecao', 'posicaoVertical', 'presencaTrincas', 
      'integridadeFixacao', 'seloIdentificacao', 'tipoFixacaoPino',
      'diametroRegistrado', 'estadoConservacao', 'resultadoPinoRei',
      'tipoFixacaoMesa', 'mesaBemFixada', 'mesaReparoSolda', 'resultadoMesa',
      'ensaioComplementar', 'resultadoGeral', 'normasAplicaveis', 'inspetorResponsavel'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = body[field as keyof CreatePinoReiData];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validação condicional: qualEnsaio obrigatório se ensaioComplementar = true
    if (body.ensaioComplementar && (!body.qualEnsaio || body.qualEnsaio.trim() === '')) {
      return NextResponse.json(
        { error: 'Campo qualEnsaio é obrigatório quando ensaioComplementar é verdadeiro' },
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

    // Validar enums
    const tipoFixacaoPinoValues = ['SOLDA', 'FLANGEADO', 'APARAFUSADA'];
    if (!validateEnum(body.tipoFixacaoPino, tipoFixacaoPinoValues)) {
      return NextResponse.json(
        { error: `tipoFixacaoPino deve ser um dos valores: ${tipoFixacaoPinoValues.join(', ')}` },
        { status: 400 }
      );
    }

    const tipoFixacaoMesaValues = ['SOLDA', 'APARAFUSADA'];
    if (!validateEnum(body.tipoFixacaoMesa, tipoFixacaoMesaValues)) {
      return NextResponse.json(
        { error: `tipoFixacaoMesa deve ser um dos valores: ${tipoFixacaoMesaValues.join(', ')}` },
        { status: 400 }
      );
    }

    const resultadoValues = ['APROVADO', 'REPROVADO'];
    if (!validateEnum(body.resultadoPinoRei, resultadoValues) ||
        !validateEnum(body.resultadoMesa, resultadoValues) ||
        !validateEnum(body.resultadoGeral, resultadoValues)) {
      return NextResponse.json(
        { error: `Resultados devem ser: ${resultadoValues.join(' ou ')}` },
        { status: 400 }
      );
    }

    // Validar diâmetro
    if (typeof body.diametroRegistrado !== 'number' || body.diametroRegistrado <= 0) {
      return NextResponse.json(
        { error: 'diametroRegistrado deve ser um número positivo' },
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

    // Usar transação para criar laudo e dados de pino rei
    const result = await prisma.$transaction(async (tx) => {
      // Criar laudo principal
      const newLaudo = await tx.laudo.create({
        data: {
          clientId: body.clientId,
          vehicleId: body.vehicleId,
          ordemServico: body.ordemServico,
          dataEmissao: new Date(body.dataEmissao),
          laudoType: 'PINO_REI',
          dataVencimento: body.dataVencimento,
          codTemporal: body.codTemporal || body.codigoTemporal,
          observacoes: body.observacoes || 'Laudo de pino rei conforme especificações técnicas.',
        },
      });

      // Criar dados específicos do pino rei
      const newLaudoPinoRei = await tx.laudoPinoRei.create({
        data: {
          laudoId: newLaudo.id,
          equipmentId: body.equipmentId,
          dataValidadeInspecao: body.dataValidadeInspecao,
          posicaoVertical: body.posicaoVertical,
          presencaTrincas: body.presencaTrincas,
          integridadeFixacao: body.integridadeFixacao,
          seloIdentificacao: body.seloIdentificacao,
          tipoFixacaoPino: body.tipoFixacaoPino,
          diametroRegistrado: body.diametroRegistrado,
          estadoConservacao: body.estadoConservacao,
          resultadoPinoRei: body.resultadoPinoRei,
          tipoFixacaoMesa: body.tipoFixacaoMesa,
          mesaBemFixada: body.mesaBemFixada,
          mesaReparoSolda: body.mesaReparoSolda,
          resultadoMesa: body.resultadoMesa,
          ensaioComplementar: body.ensaioComplementar,
          qualEnsaio: body.qualEnsaio,
          resultadoGeral: body.resultadoGeral,
          fotoChassiUrl: body.fotoChassiUrl,
          fotoPinoReiUrl: body.fotoPinoReiUrl,
          fotoMesaUrl: body.fotoMesaUrl,
          normasAplicaveis: body.normasAplicaveis,
          inspetorResponsavel: body.inspetorResponsavel,
        },
      });

      return { laudo: newLaudo, laudoPinoRei: newLaudoPinoRei };
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar laudo de pino rei:', error);

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