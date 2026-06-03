import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Multi-tenancy: admin vê userId=null, inspetores vêem seu próprio userId
    const userIdFilter = session.role === 'admin' ? null : session.id;

    let settings = await prisma.adminSetting.findFirst({
      where: { userId: userIdFilter },
    });

    if (!settings) {
      settings = await prisma.adminSetting.create({
        data: {
          companyName: 'Your Company Name',
          reportTitle: 'LAUDO DE INSPEÇÃO TÉCNICA',
          userId: userIdFilter,
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

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Multi-tenancy: admin usa userId=null, inspetores usam seu userId
    const userIdFilter = session.role === 'admin' ? null : session.id;

    let currentSettings = await prisma.adminSetting.findFirst({
      where: { userId: userIdFilter },
    });

    if (!currentSettings) {
      // Criar registro para este usuário se não existir
      currentSettings = await prisma.adminSetting.create({
        data: {
          companyName: body.companyName || 'Your Company Name',
          reportTitle: body.reportTitle || 'LAUDO DE INSPEÇÃO TÉCNICA',
          userId: userIdFilter,
        },
      });
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
        nomeResponsavel: body.nomeResponsavel,
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