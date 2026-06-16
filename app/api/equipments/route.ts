import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';
import type { CreateEquipmentData } from '@/types/equipment';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const active = searchParams.get('active');
    const excludeExpired = searchParams.get('excludeExpired');
    
    // Configurar filtros
    const where: any = {};
    if (type) where.equipmentType = type;
    if (active !== null) where.isActive = active === 'true';
    
    // Filtrar apenas equipamentos vencidos (excluir da lista)
    if (excludeExpired === 'true') {
      where.expirationDate = {
        gt: new Date() // Apenas equipamentos com vencimento maior que hoje
      };
    }
    
    const equipments = await prisma.equipment.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(equipments);
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Erro ao buscar equipamentos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateEquipmentData = await request.json();

    // Validações básicas
    if (!body.name || !body.model || !body.certificateNumber) {
      return new NextResponse(
        JSON.stringify({ error: 'Campos obrigatórios: name, model, certificateNumber' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o certificado já existe (usando findFirst pois certificateNumber não é único sozinho)
    const existingEquipment = await prisma.equipment.findFirst({
      where: { certificateNumber: body.certificateNumber }
    });

    if (existingEquipment) {
      return new NextResponse(
        JSON.stringify({ error: 'Certificate number already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar datas
    const calibrationDate = new Date(body.calibrationDate);
    const expirationDate = new Date(body.expirationDate);

    if (calibrationDate >= expirationDate) {
      return new NextResponse(
        JSON.stringify({ error: 'Data de calibração deve ser anterior à data de vencimento' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newEquipment = await prisma.equipment.create({
      data: {
        name: body.name,
        model: body.model,
        certificateNumber: body.certificateNumber,
        calibrationDate,
        expirationDate,
        equipmentType: body.equipmentType,
        isActive: body.isActive ?? true,
      },
    });

    return new NextResponse(JSON.stringify(newEquipment), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao criar equipamento:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return new NextResponse(
        JSON.stringify({ error: 'Certificate number already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: 'Erro ao criar equipamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}