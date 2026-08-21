import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/middleware-auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ cnpj: string }> }
) {
    const session = await getSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { cnpj } = await params;
    const cleanedCnpj = cnpj.replace(/\D/g, '');

    if (cleanedCnpj.length !== 14) {
        return NextResponse.json(
            { error: 'CNPJ inválido. Deve conter 14 dígitos.' },
            { status: 400 }
        );
    }

    // Tentar API principal (open.cnpja.com)
    try {
        const response = await fetch(`https://open.cnpja.com/office/${cleanedCnpj}`, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
                source: 'cnpja',
                name: data.company?.name || '',
                cnpj: data.taxId || cleanedCnpj,
                addressStreet: data.address?.street || '',
                addressNumber: data.address?.number || '',
                addressCity: data.address?.city || '',
                addressState: data.address?.state || '',
                addressZip: data.address?.zip || '',
                addressDistrict: data.address?.district || '',
                phone: data.phones?.length > 0
                    ? data.phones.map((p: any) => `(${p.area}) ${p.number}`).join(' / ')
                    : '',
            });
        }

        // Se não ok, tentar fallback
        console.warn(`CNPJA retornou ${response.status}, usando fallback...`);
    } catch (error) {
        console.warn('Erro na API primária CNPJA:', error);
    }

    // Fallback: ReceitaWS
    try {
        const fallbackResponse = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanedCnpj}`, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
        });

        if (!fallbackResponse.ok) {
            if (fallbackResponse.status === 429) {
                return NextResponse.json(
                    { error: 'Limite de consultas atingido. Aguarde alguns segundos e tente novamente.' },
                    { status: 429 }
                );
            }
            return NextResponse.json(
                { error: `Falha ao consultar CNPJ. Código: ${fallbackResponse.status}` },
                { status: fallbackResponse.status }
            );
        }

        const fallbackData = await fallbackResponse.json();

        if (fallbackData.status === 'ERROR') {
            return NextResponse.json(
                { error: 'CNPJ não encontrado ou inválido.' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            source: 'receitaws',
            name: fallbackData.nome || '',
            cnpj: fallbackData.cnpj?.replace(/\D/g, '') || cleanedCnpj,
            addressStreet: fallbackData.logradouro || '',
            addressNumber: fallbackData.numero || '',
            addressCity: fallbackData.municipio || '',
            addressState: fallbackData.uf || '',
            addressZip: fallbackData.cep?.replace(/\D/g, '') || '',
            addressDistrict: fallbackData.bairro || '',
            phone: fallbackData.telefone || '',
        });
    } catch (error) {
        console.error('Erro no fallback ReceitaWS:', error);
        return NextResponse.json(
            { error: 'Não foi possível consultar o CNPJ. Tente novamente mais tarde.' },
            { status: 503 }
        );
    }
}
