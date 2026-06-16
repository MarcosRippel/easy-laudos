import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSessionFromRequest } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: { vehicles: true, laudos: true },
        },
      },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Failed to retrieve clients:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to retrieve clients' }),
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

    const body = await request.json();

    // Criar client SEM contactWhatsapp (Prisma client pode não conhecer o campo ainda)
    const newClient = await prisma.client.create({
      data: {
        cnpj: body.cnpj,
        name: body.name,
        addressStreet: body.addressStreet,
        addressNumber: body.addressNumber,
        addressCity: body.addressCity,
        addressState: body.addressState,
        addressZip: body.addressZip,
        addressDistrict: body.addressDistrict,
        phone: body.phone,
      },
    });

    // Atualizar contactWhatsapp via raw SQL (bypass Prisma runtime validation)
    if (body.contactWhatsapp) {
      await prisma.$executeRaw`UPDATE Client SET contactWhatsapp = ${body.contactWhatsapp} WHERE id = ${newClient.id}`;
    }

    return new NextResponse(JSON.stringify({ ...newClient, contactWhatsapp: body.contactWhatsapp || null }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Failed to create client:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return new NextResponse(
        JSON.stringify({ message: 'Um cliente com este CNPJ já existe.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Falha ao criar cliente' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, contactWhatsapp, ...updateData } = body;

    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'ID do cliente é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar campos conhecidos pelo Prisma
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        cnpj: updateData.cnpj,
        name: updateData.name,
        addressStreet: updateData.addressStreet,
        addressNumber: updateData.addressNumber,
        addressCity: updateData.addressCity,
        addressState: updateData.addressState,
        addressZip: updateData.addressZip,
        addressDistrict: updateData.addressDistrict,
        phone: updateData.phone,
      },
    });

    // Atualizar contactWhatsapp via raw SQL (bypass Prisma runtime validation)
    const whatsappValue = contactWhatsapp || null;
    await prisma.$executeRaw`UPDATE Client SET contactWhatsapp = ${whatsappValue} WHERE id = ${id}`;

    return NextResponse.json({ ...updatedClient, contactWhatsapp: contactWhatsapp || null });

  } catch (error) {
    console.error('Failed to update client:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return new NextResponse(
        JSON.stringify({ message: 'Um cliente com este CNPJ já existe.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Falha ao atualizar cliente' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Client ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar todos os laudos do cliente para deletar sub-records
    const laudos = await prisma.laudo.findMany({
      where: { clientId: id },
      select: { id: true },
    });
    const laudoIds = laudos.map(l => l.id);

    if (laudoIds.length > 0) {
      // Deletar sub-records dos laudos (FK constraints)
      await prisma.laudoRuido.deleteMany({ where: { laudoId: { in: laudoIds } } });
      await prisma.laudoPinoRei.deleteMany({ where: { laudoId: { in: laudoIds } } });
      await prisma.laudoQuintaRoda.deleteMany({ where: { laudoId: { in: laudoIds } } });
      // Deletar laudos
      await prisma.laudo.deleteMany({ where: { clientId: id } });
    }

    // Deletar veículos
    await prisma.vehicle.deleteMany({ where: { clientId: id } });

    // Deletar o cliente
    await prisma.client.delete({ where: { id } });

    return new NextResponse(
      JSON.stringify({ message: 'Cliente deletado com sucesso' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Failed to delete client:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Falha ao deletar cliente' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}