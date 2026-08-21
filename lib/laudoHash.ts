import { createHash } from 'crypto';
import QRCode from 'qrcode';

// URL publica onde esta instalacao responde — usada no QR Code e no rodape do
// laudo. Configure NEXT_PUBLIC_BASE_URL no ambiente; sem ela, cai para o host
// local (o QR aponta para a propria maquina, nao para o dominio de ninguem).
export function getPublicBaseUrl(): string {
    return (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3006').replace(/\/+$/, '');
}

/** Mesma URL sem o esquema, para exibir em texto impresso. */
export function getPublicBaseHost(): string {
    return getPublicBaseUrl().replace(/^https?:\/\//, '');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prismaInstance: any;
async function getPrisma() {
    if (!prismaInstance) {
        const { prisma } = await import('@/lib/prisma');
        prismaInstance = prisma;
    }
    return prismaInstance;
}

/**
 * Gera um hash SHA-256 único baseado nos dados do laudo
 */
export function generateLaudoHash(laudoId: string, placa: string, dataEmissao: Date | string, tipo: string): string {
    const data = `${laudoId}|${placa}|${new Date(dataEmissao).toISOString()}|${tipo}`;
    return createHash('sha256').update(data).digest('hex');
}

/**
 * Gera o SVG do QR Code apontando para a página pública de verificação
 */
export async function generateQRCodeSVG(hash: string): Promise<string> {
    const url = `${getPublicBaseUrl()}/verificar/${hash}`;
    try {
        const svgString = await QRCode.toString(url, {
            type: 'svg',
            width: 80,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        });
        return svgString;
    } catch (e) {
        console.error('Erro ao gerar QR Code:', e);
        return '';
    }
}

/**
 * Verifica se o laudo já tem hash. Se não tiver, gera e salva.
 * Retorna o hash (existente ou novo) e o SVG do QR Code.
 */
export async function getOrCreateLaudoHash(
    laudoId: string,
    placa: string,
    dataEmissao: Date | string,
    tipo: string
): Promise<{ hash: string; qrCodeSvg: string }> {
    const db = await getPrisma();

    // Verificar se já existe hash no banco — usando cast any por incompatibilidade de tipo de cache
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (db.laudo as any).findUnique({
        where: { id: laudoId },
        select: { documentHash: true },
    });

    let hash: string;

    if (existing?.documentHash) {
        hash = existing.documentHash;
        console.log(`✅ Hash existente reutilizado: ${hash.substring(0, 16)}...`);
    } else {
        // Gerar novo hash
        hash = generateLaudoHash(laudoId, placa, dataEmissao, tipo);

        // Salvar no banco
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db.laudo as any).update({
            where: { id: laudoId },
            data: { documentHash: hash },
        });
        console.log(`🔐 Novo hash gerado e salvo: ${hash.substring(0, 16)}...`);
    }

    const qrCodeSvg = await generateQRCodeSVG(hash);

    return { hash, qrCodeSvg };
}

/**
 * Retorna a URL pública de verificação a partir do hash
 */
export function getVerifyUrl(hash: string): string {
    return `${getPublicBaseUrl()}/verificar/${hash}`;
}
