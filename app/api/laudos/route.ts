import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // Configurar filtro baseado no tipo
    const where = type ? { laudoType: type } : {};
    
    const laudos = await prisma.laudo.findMany({
      where,
      include: {
        client: true,
        vehicle: true,
      },
      orderBy: {
        dataEmissao: 'desc',
      },
    });

    return NextResponse.json(laudos);
  } catch (error) {
    console.error('Erro ao buscar laudos:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Erro ao buscar laudos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newLaudo = await prisma.laudo.create({
      data: {
        clientId: body.clientId,
        vehicleId: body.vehicleId,
        ordemServico: body.ordemServico,
        dataEmissao: new Date(body.dataEmissao),
        laudoType: body.laudoType,
        dataVencimento: body.dataVencimento,
        codTemporal: body.codTemporal,
        observacoes: body.observacoes,
        fabricanteEquipamento: body.fabricanteEquipamento,
        mesAnoFabricEquip: body.mesAnoFabricEquip,
        diametroPinoRei: body.diametroPinoRei,
        dataVerifPinoRei: body.dataVerifPinoRei,
        fotoDianteiraUrl: body.fotoDianteiraUrl,
        fotoTraseiraUrl: body.fotoTraseiraUrl,
        fotoChassiUrl: body.fotoChassiUrl,
      },
    });

    return new NextResponse(JSON.stringify(newLaudo), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Failed to create laudo:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return new NextResponse(
        JSON.stringify({ message: 'A laudo with this Ordem de Serviço already exists.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Failed to create laudo' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}