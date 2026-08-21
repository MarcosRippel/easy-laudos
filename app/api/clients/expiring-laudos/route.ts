import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';

// Tipos de laudo — label amigável para a mensagem WhatsApp
const LAUDO_TYPE_LABELS: Record<string, string> = {
    CHECKLIST: 'Checklist',
    LIT: 'LIT',
    RUIDO: 'Ruído',
    PINO_REI: 'Pino Rei',
    QUINTA_RODA: 'Quinta Roda',
};

function parseDateBR(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;

    // Suporta DD/MM/AAAA e YYYY-MM-DD
    const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brMatch) {
        const [, day, month, year] = brMatch;
        return new Date(`${year}-${month}-${day}T00:00:00`);
    }

    const isoMatch = dateStr.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return new Date(dateStr);

    return null;
}

export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const limitDate = new Date(now);
        limitDate.setDate(limitDate.getDate() + 15);

        // Buscar todos os laudos com vehicle e client
        const laudos = await prisma.laudo.findMany({
            select: {
                id: true,
                laudoType: true,
                dataVencimento: true,
                clientId: true,
                vehicle: {
                    select: { placa: true },
                },
            },
        });

        // Agrupar por cliente
        const alertsByClient: Record<string, {
            total: number;
            hasExpired: boolean;
            laudos: { placa: string; tipo: string; vencimento: string; status: 'vencido' | 'vencendo' }[];
        }> = {};

        for (const laudo of laudos) {
            const vencDate = parseDateBR(laudo.dataVencimento);
            if (!vencDate) continue; // Sem data de vencimento → ignora

            const isExpired = vencDate < now;
            const isExpiring = !isExpired && vencDate <= limitDate;

            if (!isExpired && !isExpiring) continue;

            if (!alertsByClient[laudo.clientId]) {
                alertsByClient[laudo.clientId] = { total: 0, hasExpired: false, laudos: [] };
            }

            alertsByClient[laudo.clientId].total++;
            if (isExpired) alertsByClient[laudo.clientId].hasExpired = true;

            alertsByClient[laudo.clientId].laudos.push({
                placa: laudo.vehicle.placa,
                tipo: LAUDO_TYPE_LABELS[laudo.laudoType] ?? laudo.laudoType,
                vencimento: laudo.dataVencimento ?? '',
                status: isExpired ? 'vencido' : 'vencendo',
            });
        }

        return NextResponse.json(alertsByClient);
    } catch (error) {
        console.error('[expiring-laudos] Erro:', error);
        return NextResponse.json({ error: 'Erro ao buscar laudos próximos ao vencimento' }, { status: 500 });
    }
}
