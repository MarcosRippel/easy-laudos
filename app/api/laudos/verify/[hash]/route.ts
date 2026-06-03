import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';
import { format } from 'date-fns';

const LAUDO_TYPE_LABELS: Record<string, string> = {
    LIT: 'LIT - Laudo de Inspeção Técnica',
    CHECKLIST: 'Checklist Preventivo',
    RUIDO: 'Laudo de Ruído',
    PINO_REI: 'Laudo de Pino Rei',
    QUINTA_RODA: 'Laudo de Quinta Roda',
    ruido: 'Laudo de Ruído',
    checklist: 'Checklist Preventivo',
    lit: 'LIT - Laudo de Inspeção Técnica',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ hash: string }> }
) {
    try {
        const { hash } = await params;

        if (!hash || hash.length < 32) {
            return NextResponse.json({ error: 'Hash inválido' }, { status: 400 });
        }

        // Buscar laudo pelo hash com todos os relacionamentos — usando any para evitar problema de tipo de cache
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const laudo = await (prisma.laudo as any).findUnique({
            where: { documentHash: hash },
            include: {
                client: true,
                vehicle: true,
                laudoRuido: { select: { resultado: true } },
                laudoPinoRei: { select: { resultadoGeral: true } },
                laudoQuintaRoda: { select: { resultadoFinal: true } },
            },
        });

        if (!laudo) {
            return NextResponse.json({ error: 'Laudo não encontrado' }, { status: 404 });
        }

        // Buscar configurações da empresa emissora (igual aos outros routes)
        const adminSettings = await prisma.adminSetting.findFirst({
            orderBy: { updatedAt: 'desc' },
        });

        // Converter logo para base64 se houver
        let logoBase64: string | null = null;
        if (adminSettings?.companyLogoUrl) {
            try {
                if (!adminSettings.companyLogoUrl.startsWith('http')) {
                    const logoPath = join(process.cwd(), 'public', adminSettings.companyLogoUrl);
                    try {
                        const logoBytes = readFileSync(logoPath);
                        const ext = adminSettings.companyLogoUrl.toLowerCase();
                        const mimeType = ext.endsWith('.png') ? 'image/png' :
                            ext.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
                        logoBase64 = `data:${mimeType};base64,${logoBytes.toString('base64')}`;
                    } catch {
                        // Fallback HTTP
                    }
                }

                if (!logoBase64) {
                    const logoUrl = adminSettings.companyLogoUrl.startsWith('http')
                        ? adminSettings.companyLogoUrl
                        : `${process.env.NEXTAUTH_URL || 'http://localhost:3006'}${adminSettings.companyLogoUrl}`;
                    const logoResp = await fetch(logoUrl);
                    if (logoResp.ok) {
                        const buf = Buffer.from(await logoResp.arrayBuffer());
                        const mimeType = logoResp.headers.get('content-type') || 'image/jpeg';
                        logoBase64 = `data:${mimeType};base64,${buf.toString('base64')}`;
                    }
                }
            } catch (e) {
                console.error('Erro ao carregar logo:', e);
            }
        }

        // Determinar resultado (se houver)
        let resultado: string | null = null;
        if (laudo.laudoRuido) resultado = laudo.laudoRuido.resultado;
        else if (laudo.laudoPinoRei) resultado = laudo.laudoPinoRei.resultadoGeral;
        else if (laudo.laudoQuintaRoda) resultado = laudo.laudoQuintaRoda.resultadoFinal;

        const tipoLabel = LAUDO_TYPE_LABELS[laudo.laudoType] || laudo.laudoType;

        return NextResponse.json({
            valid: true,
            hash,
            companyName: adminSettings?.companyName || 'Empresa Emissora',
            logoBase64,
            vehiclePlate: laudo.vehicle.placa,
            vehicleBrand: laudo.vehicle.marcaModelo || '',
            clientName: laudo.client.name,
            dataEmissao: format(new Date(laudo.dataEmissao), 'dd/MM/yyyy HH:mm:ss'),
            laudoType: tipoLabel,
            laudoTypeRaw: laudo.laudoType,
            ordemServico: laudo.ordemServico,
            codTemporal: laudo.codTemporal || '',
            resultado,
            dataVencimento: laudo.dataVencimento || null,
        });
    } catch (error) {
        console.error('Erro ao verificar laudo:', error);
        return NextResponse.json(
            { error: 'Erro interno ao verificar laudo' },
            { status: 500 }
        );
    }
}
