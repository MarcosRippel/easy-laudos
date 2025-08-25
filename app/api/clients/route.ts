import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        name: 'asc',
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

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

    return new NextResponse(JSON.stringify(newClient), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Failed to create client:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return new NextResponse(
        JSON.stringify({ message: 'A client with this CNPJ already exists.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Failed to create client' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Client ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    return NextResponse.json(updatedClient);

  } catch (error) {
    console.error('Failed to update client:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return new NextResponse(
        JSON.stringify({ message: 'A client with this CNPJ already exists.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Failed to update client' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Client ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Primeiro deletar todos os veículos vinculados ao cliente
    await prisma.vehicle.deleteMany({
      where: { clientId: id },
    });

    // Depois deletar o cliente
    await prisma.client.delete({
      where: { id },
    });

    return new NextResponse(
      JSON.stringify({ message: 'Client deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Failed to delete client:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to delete client' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}