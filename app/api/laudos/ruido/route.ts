import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CreateRuidoData, RuidoCalculations } from '@/types/ruido';

// Função para calcular mediana
function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Função para calcular máximo
function calculateMax(values: number[]): number {
  return Math.max(...values);
}

// Função para calcular estatísticas automáticas
function calculateRuidoStatistics(data: CreateRuidoData): RuidoCalculations {
  const aceleracaoValues = [
    data.aceleracao1, data.aceleracao2, data.aceleracao3,
    data.aceleracao4, data.aceleracao5, data.aceleracao6
  ];
  
  const marchaLentaValues = [
    data.marchaLenta1, data.marchaLenta2, data.marchaLenta3,
    data.marchaLenta4, data.marchaLenta5, data.marchaLenta6
  ];

  return {
    medianaAceleracao: calculateMedian(aceleracaoValues),
    maxAceleracao: calculateMax(aceleracaoValues),
    medianaMarchaLenta: calculateMedian(marchaLentaValues),
    maxMarchaLenta: calculateMax(marchaLentaValues)
  };
}

export async function POST(request: Request) {
  try {
    const body: CreateRuidoData = await request.json();

    // Validações básicas
    if (!body.clientId || !body.vehicleId || !body.equipmentId) {
      return new NextResponse(
        JSON.stringify({ message: 'Campos obrigatórios: clientId, vehicleId, equipmentId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar valores de ruído (0-120 dB)
    const ruidoValues = [
      body.aceleracao1, body.aceleracao2, body.aceleracao3, body.aceleracao4, body.aceleracao5, body.aceleracao6,
      body.marchaLenta1, body.marchaLenta2, body.marchaLenta3, body.marchaLenta4, body.marchaLenta5, body.marchaLenta6
    ];

    const invalidValues = ruidoValues.filter(value => value < 0 || value > 120);
    if (invalidValues.length > 0) {
      return new NextResponse(
        JSON.stringify({ message: 'Valores de ruído devem estar entre 0 e 120 dB' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se equipamento existe e está ativo
    const equipment = await prisma.equipment.findUnique({
      where: { id: body.equipmentId }
    });

    if (!equipment) {
      return new NextResponse(
        JSON.stringify({ message: 'Equipamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!equipment.isActive) {
      return new NextResponse(
        JSON.stringify({ message: 'Equipamento não está ativo' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calcular estatísticas automáticas
    const calculations = calculateRuidoStatistics(body);

    // Usar transação para criar laudo e dados de ruído
    const result = await prisma.$transaction(async (tx) => {
      // Criar laudo principal
      const newLaudo = await tx.laudo.create({
        data: {
          clientId: body.clientId,
          vehicleId: body.vehicleId,
          ordemServico: body.ordemServico,
          dataEmissao: new Date(body.dataEmissao),
          laudoType: 'RUIDO',
          dataVencimento: body.dataVencimento,
          codTemporal: body.codTemporal,
          observacoes: body.observacoes || 'Laudo de ruído conforme especificações técnicas.',
        },
      });

      // Criar dados específicos do ruído
      const newLaudoRuido = await tx.laudoRuido.create({
        data: {
          laudoId: newLaudo.id,
          equipmentId: body.equipmentId,
          aceleracao1: body.aceleracao1,
          aceleracao2: body.aceleracao2,
          aceleracao3: body.aceleracao3,
          aceleracao4: body.aceleracao4,
          aceleracao5: body.aceleracao5,
          aceleracao6: body.aceleracao6,
          marchaLenta1: body.marchaLenta1,
          marchaLenta2: body.marchaLenta2,
          marchaLenta3: body.marchaLenta3,
          marchaLenta4: body.marchaLenta4,
          marchaLenta5: body.marchaLenta5,
          marchaLenta6: body.marchaLenta6,
          medianaAceleracao: calculations.medianaAceleracao,
          maxAceleracao: calculations.maxAceleracao,
          medianaMarchaLenta: calculations.medianaMarchaLenta,
          maxMarchaLenta: calculations.maxMarchaLenta,
          resultado: body.resultado,
          inspetorResponsavel: body.inspetorResponsavel,
        },
      });

      return { laudo: newLaudo, laudoRuido: newLaudoRuido };
    });

    return new NextResponse(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao criar laudo de ruído:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return new NextResponse(
        JSON.stringify({ message: 'Já existe um laudo com esta Ordem de Serviço' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Erro ao criar laudo de ruído' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}