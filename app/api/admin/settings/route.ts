import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    let settings = await prisma.adminSetting.findFirst();

    if (!settings) {
      settings = await prisma.adminSetting.create({
        data: {
          companyName: 'Your Company Name',
          reportTitle: 'LAUDO DE INSPEÇÃO TÉCNICA',
        },
      });
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Failed to retrieve admin settings:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to retrieve admin settings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const currentSettings = await prisma.adminSetting.findFirst();

    if (!currentSettings) {
      return new NextResponse(
        JSON.stringify({ message: "Settings not found to update." }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedSettings = await prisma.adminSetting.update({
      where: {
        id: currentSettings.id,
      },
      data: {
        companyName: body.companyName,
        companyTaxId: body.companyTaxId,
        companyAddress: body.companyAddress,
        companyPhone: body.companyPhone,
        companyLogoUrl: body.companyLogoUrl,
        reportTitle: body.reportTitle,
      },
    });

    return NextResponse.json(updatedSettings);

  } catch (error) {
    console.error('Failed to update admin settings:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to update admin settings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}