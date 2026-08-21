import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');

    let vehicles;

    if (clientId) {
      vehicles = await prisma.vehicle.findMany({
        where: {
          clientId: clientId,
        },
        orderBy: {
          placa: 'asc',
        },
      });
    } else {
      vehicles = await prisma.vehicle.findMany({
        orderBy: {
          placa: 'asc',
        },
      });
    }

    return NextResponse.json(vehicles);

  } catch (error) {
    console.error('Failed to retrieve vehicles:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to retrieve vehicles' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    console.log('🔍 DADOS RECEBIDOS PARA CRIAR VEÍCULO:');
    console.log(JSON.stringify(body, null, 2));

    const newVehicle = await prisma.vehicle.create({
      data: {
        placa: body.placa,
        especieTipo: body.especieTipo,
        marcaModelo: body.marcaModelo,
        numeroChassi: body.numeroChassi,
        anoFabricacaoModelo: body.anoFabricacaoModelo,
        clientId: body.clientId,
      },
    });

    console.log('✅ VEÍCULO CRIADO:');
    console.log(JSON.stringify(newVehicle, null, 2));

    return new NextResponse(JSON.stringify(newVehicle), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Failed to create vehicle:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return new NextResponse(
        JSON.stringify({ message: 'A vehicle with this license plate (placa) or chassis number (chassi) already exists.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Failed to create vehicle' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get('id');

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }

    console.log('🗑️ DELETANDO VEÍCULO:', vehicleId);

    // Buscar laudos vinculados ao veículo
    const laudos = await prisma.laudo.findMany({
      where: { vehicleId },
      select: { id: true },
    });
    const laudoIds = laudos.map(l => l.id);

    if (laudoIds.length > 0) {
      // Deletar sub-records dos laudos (FK constraints)
      await prisma.laudoRuido.deleteMany({ where: { laudoId: { in: laudoIds } } });
      await prisma.laudoPinoRei.deleteMany({ where: { laudoId: { in: laudoIds } } });
      await prisma.laudoQuintaRoda.deleteMany({ where: { laudoId: { in: laudoIds } } });
      // Deletar laudos
      await prisma.laudo.deleteMany({ where: { vehicleId } });
    }

    const deletedVehicle = await prisma.vehicle.delete({
      where: {
        id: vehicleId,
      },
    });

    console.log('✅ VEÍCULO DELETADO:', deletedVehicle.placa);

    return NextResponse.json({
      message: 'Veículo deletado com sucesso',
      vehicle: deletedVehicle
    });

  } catch (error) {
    console.error('❌ Erro ao deletar veículo:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Veículo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Falha ao deletar veículo' },
      { status: 500 }
    );
  }
}