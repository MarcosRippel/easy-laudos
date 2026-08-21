import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';
import type { CreateEquipmentData } from '@/types/equipment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const equipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      return new NextResponse(
        JSON.stringify({ error: 'Equipamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Erro ao buscar equipamento:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Erro ao buscar equipamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: CreateEquipmentData = await request.json();

    // Validações básicas
    if (!body.name || !body.model || !body.certificateNumber) {
      return new NextResponse(
        JSON.stringify({ error: 'Campos obrigatórios: name, model, certificateNumber' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o equipamento existe
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      return new NextResponse(
        JSON.stringify({ error: 'Equipamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o certificado já existe em outro equipamento
    const duplicateEquipment = await prisma.equipment.findFirst({
      where: {
        certificateNumber: body.certificateNumber,
        id: { not: id }
      }
    });

    if (duplicateEquipment) {
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

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
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

    return NextResponse.json(updatedEquipment);

  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return new NextResponse(
        JSON.stringify({ error: 'Certificate number already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: 'Erro ao atualizar equipamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Verificar se o equipamento existe
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      return new NextResponse(
        JSON.stringify({ error: 'Equipamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o equipamento está sendo usado em laudos
    const laudosCount = await prisma.laudoRuido.count({
      where: { equipmentId: id },
    });

    if (laudosCount > 0) {
      return new NextResponse(
        JSON.stringify({ 
          error: `Não é possível excluir este equipamento pois ele está sendo usado em ${laudosCount} laudo(s)` 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await prisma.equipment.delete({
      where: { id },
    });

    return new NextResponse(
      JSON.stringify({ message: 'Equipamento excluído com sucesso' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao excluir equipamento:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Erro ao excluir equipamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}