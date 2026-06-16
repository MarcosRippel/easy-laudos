import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';
import type { EquipmentNotification } from '@/types/equipment';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Buscar equipamentos ativos com vencimento próximo ou vencidos
    const equipments = await prisma.equipment.findMany({
      where: {
        isActive: true,
        expirationDate: {
          lte: oneMonthFromNow // Vence em até 1 mês
        }
      },
      orderBy: {
        expirationDate: 'asc'
      }
    });

    const notifications: EquipmentNotification[] = equipments.map(equipment => {
      const timeDiff = equipment.expirationDate.getTime() - today.getTime();
      const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let severity: 'warning' | 'critical' | 'expired';
      if (daysUntilExpiration < 0) {
        severity = 'expired';
      } else if (daysUntilExpiration <= 15) {
        severity = 'critical';
      } else {
        severity = 'warning';
      }

      return {
        id: equipment.id,
        name: equipment.name,
        model: equipment.model,
        certificateNumber: equipment.certificateNumber,
        expirationDate: equipment.expirationDate,
        daysUntilExpiration,
        severity
      };
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Erro ao buscar notificações de equipamentos:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Erro ao buscar notificações de equipamentos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}