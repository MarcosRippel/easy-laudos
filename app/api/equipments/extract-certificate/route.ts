import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) console.error('⚠️  [extract-certificate] GEMINI_API_KEY não configurada no .env');
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY ?? '');

// Modelos em ordem de preferência (mesmo padrão do /process-document)
const FALLBACK_MODELS = [
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-1.5-flash',
];

const EQUIPMENT_TYPES = ['DECIBELIMETRO', 'RUIDO', 'CALIBRADOR', 'PAQUIMETRO', 'OUTROS'] as const;

const SYSTEM_PROMPT = `Você é um especialista em documentos técnicos brasileiros de metrologia e calibração de equipamentos de medição.

Analise o documento enviado (certificado de calibração, certificado de verificação ou laudo técnico de equipamento) e extraia as informações abaixo.

Retorne APENAS um JSON puro, sem markdown, sem blocos de código, sem explicações adicionais.

Campos a extrair:
- name: nome completo do equipamento (ex: "Decibelímetro Digital", "Paquímetro Digital", "Calibrador Acústico")
- model: modelo/número do instrumento (ex: "DEC-490", "AK824", "SC941")
- certificateNumber: número do certificado/RBC/IMETRO (ex: "CERT-2024-001", "RBC 107423/24", "DEC-CERT-1751902544218")
- equipmentType: um dos seguintes valores exatos: DECIBELIMETRO, RUIDO, CALIBRADOR, PAQUIMETRO, OUTROS
  - Use DECIBELIMETRO para decibelímetros / sonômetros / medidores de nível de pressão sonora
  - Use RUIDO para equipamentos de medição de ruído que não sejam decibelímetros
  - Use CALIBRADOR para calibradores acústicos / pistofones
  - Use PAQUIMETRO para paquímetros
  - Use OUTROS para qualquer outro tipo de equipamento
- calibrationDate: data de calibração no formato YYYY-MM-DD (ex: "2024-07-16")
- expirationDate: data de vencimento/validade no formato YYYY-MM-DD (ex: "2025-07-16")

REGRAS:
- Se um campo não for encontrado, retorne null
- As datas devem estar sempre no formato ISO YYYY-MM-DD
- Para o equipmentType, analise o tipo do instrumento descrito no documento
- O número do certificado pode aparecer como "Certificado Nº", "RBC", "IMETRO", "N.º do Certificado", "Nº Laudo" etc.
- A data de vencimento pode aparecer como "Válido até", "Próxima calibração", "Data de validade", "Vencimento"

EXEMPLO DE SAÍDA:
{
  "name": "Decibelímetro Digital",
  "model": "DEC-2024",
  "certificateNumber": "RBC 107423/24",
  "equipmentType": "DECIBELIMETRO",
  "calibrationDate": "2024-07-16",
  "expirationDate": "2025-07-16"
}`;

interface ExtractedEquipment {
    name: string | null;
    model: string | null;
    certificateNumber: string | null;
    equipmentType: typeof EQUIPMENT_TYPES[number] | null;
    calibrationDate: string | null;
    expirationDate: string | null;
}

async function tryExtract(base64: string, mimeType: string): Promise<ExtractedEquipment> {
    let lastError: unknown;

    for (const modelName of FALLBACK_MODELS) {
        console.log(`🤖 [extract-certificate] Tentando modelo: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([
                { inlineData: { mimeType, data: base64 } },
                { text: SYSTEM_PROMPT },
            ]);

            let text = result.response.text().trim()
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim();

            console.log(`✅ [extract-certificate] ${modelName} respondeu. Raw:`, text.slice(0, 300));

            const parsed = JSON.parse(text) as ExtractedEquipment;

            // Garantir que equipmentType seja um valor válido
            if (parsed.equipmentType && !EQUIPMENT_TYPES.includes(parsed.equipmentType)) {
                parsed.equipmentType = 'OUTROS';
            }

            return parsed;
        } catch (err: unknown) {
            const msg = String(err);
            const isRetryable =
                msg.includes('503') ||
                msg.includes('429') ||
                msg.includes('500') ||
                msg.includes('overloaded');

            console.warn(`⚠️  [extract-certificate] ${modelName} falhou: ${msg.slice(0, 120)}`);
            lastError = err;

            if (!isRetryable) continue;
            await new Promise((r) => setTimeout(r, 1000));
        }
    }

    throw lastError ?? new Error('Todos os modelos falharam');
}

export async function POST(request: NextRequest) {
    console.log('🔥 [extract-certificate] Requisição recebida');

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
        }

        console.log(`📁 Arquivo: ${file.name} (${file.type}, ${file.size} bytes)`);

        // Tipos aceitos
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        let mimeType = file.type;

        if (!mimeType || mimeType === 'application/octet-stream') {
            if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
            else if (file.name.endsWith('.png')) mimeType = 'image/png';
            else if (file.name.match(/\.jpe?g$/i)) mimeType = 'image/jpeg';
            else if (file.name.endsWith('.webp')) mimeType = 'image/webp';
        }

        if (!allowedTypes.includes(mimeType)) {
            return NextResponse.json(
                { error: `Tipo de arquivo não suportado: ${mimeType}. Use PDF, JPG ou PNG.` },
                { status: 400 }
            );
        }

        // Limite de 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'Arquivo muito grande. Máximo: 10MB' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const extracted = await tryExtract(base64, mimeType);
        console.log('🎉 Dados extraídos:', JSON.stringify(extracted));

        return NextResponse.json({ data: extracted });
    } catch (err) {
        console.error('[extract-certificate] Erro:', err);
        return NextResponse.json(
            {
                error: 'Não foi possível extrair os dados do certificado. Preencha manualmente.',
                message: String(err),
            },
            { status: 503 }
        );
    }
}
