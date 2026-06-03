/**
 * Código Temporal — Utilitário Centralizado
 *
 * O código temporal é gerado a partir das dezenas do último sorteio da
 * Loteria Federal (Caixa Econômica Federal). Cada dezena contribui com
 * seu último dígito, e eles são concatenados para formar o código.
 *
 * Exemplo: dezenas ["03", "17", "24", "38", "45", "62"]
 *          → código "374852"
 *
 * A renovação é automática: o Next.js revalida o cache a cada 3600s (1h),
 * e o código muda naturalmente a cada novo sorteio da Loteria Federal
 * (realizados às quartas-feiras e sábados).
 *
 * Uso em Server Components:
 *   import { getTemporalCode } from '@/lib/temporal-code';
 *   const code = await getTemporalCode();
 *
 * Uso em API Routes (client-side via fetch):
 *   GET /api/temporal-code → { code: string }
 */

const LOTTERY_API_URL = 'https://loteriascaixa-api.herokuapp.com/api/federal/latest';
const CACHE_REVALIDATE_SECONDS = 3600; // 1 hora — alinhado com a frequência dos sorteios

export async function getTemporalCode(): Promise<string> {
    try {
        const response = await fetch(LOTTERY_API_URL, {
            next: { revalidate: CACHE_REVALIDATE_SECONDS },
        });

        if (!response.ok) {
            throw new Error(`Lottery API responded with status ${response.status}`);
        }

        const data = await response.json();
        const dezenas: string[] = data.dezenas;

        if (!dezenas || dezenas.length === 0) {
            throw new Error('Dezenas not found in lottery response');
        }

        // Pega o último dígito de cada dezena e concatena
        return dezenas.map((d: string) => d.slice(-1)).join('');

    } catch (error) {
        console.error('[temporal-code] Falha ao gerar código temporal:', error);
        return '';
    }
}
