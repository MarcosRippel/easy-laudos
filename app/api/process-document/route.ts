import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/middleware-auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) console.error('⚠️  [process-document] GEMINI_API_KEY não configurada no .env');
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY ?? '');

// Modelos em ordem de preferência — se um falhar (503/429/404), tenta o próximo
const FALLBACK_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
];

const SYSTEM_PROMPT = `Você é um assistente especialista em documentos veiculares brasileiros (CRLV, CRV, DUT etc). Sua função é extrair com precisão os dados principais dos documentos enviados em PDF e retornar um JSON no seguinte formato:

A chave principal do JSON será a placa do veículo.

Os valores extraídos devem conter:
- especie_tipo
- marca_modelo
- nro_chassi
- placa
- ano_fabricacao
- ano_modelo

Você deve ignorar dados irrelevantes como QRCode, mensagens publicitárias e textos duplicados.

Se algum dado estiver ausente, retorne "valor_indisponivel" no campo correspondente.

Retorne APENAS o JSON puro, sem markdown, sem blocos de código, sem explicações. Só o JSON.

EXEMPLO DE SAÍDA:
{
  "ABC1234": {
    "especie_tipo": "TRACAO CAMINHAO TRATOR",
    "marca_modelo": "VOLVO/FH 460 6X2T",
    "nro_chassi": "9BVRTY0C6SE614552",
    "placa": "ABC1234",
    "ano_fabricacao": "2024",
    "ano_modelo": "2025"
  }
}`;

async function tryExtract(base64: string, mimeType: string): Promise<string> {
  let lastError: unknown;

  for (const modelName of FALLBACK_MODELS) {
    console.log(`🤖 Tentando modelo: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        { inlineData: { mimeType, data: base64 } },
        { text: SYSTEM_PROMPT },
      ]);

      const text = result.response.text().trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      console.log(`✅ ${modelName} respondeu!`);
      return text;
    } catch (err: unknown) {
      const msg = String(err);
      const isRetryable = msg.includes('503') || msg.includes('429') || msg.includes('500') || msg.includes('overloaded');
      console.warn(`⚠️  ${modelName} falhou: ${msg.slice(0, 120)}`);
      lastError = err;

      if (!isRetryable) {
        // Erro definitivo (ex: 404) — pula direto pro próximo modelo
        continue;
      }

      // Erro transitório — aguarda 1s e tenta o próximo
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  throw lastError ?? new Error('Todos os modelos falharam');
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  console.log('🔥 API /process-document CHAMADA RECEBIDA! (Gemini)');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📁 Arquivo: ${file.name} (${file.type}, ${file.size} bytes)`);

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    let mimeType = file.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
      if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (file.name.endsWith('.png')) mimeType = 'image/png';
      else if (file.name.match(/\.jpe?g$/i)) mimeType = 'image/jpeg';
    }

    const responseText = await tryExtract(base64, mimeType);

    // Validar JSON antes de retornar
    try {
      const parsed = JSON.parse(responseText);
      console.log('🎉 JSON extraído:', JSON.stringify(parsed));
      return NextResponse.json({ resposta: responseText });
    } catch {
      console.error('❌ Resposta não é JSON válido:', responseText.slice(0, 200));
      return NextResponse.json(
        { error: 'Resposta inválida da IA', resposta: responseText },
        { status: 422 }
      );
    }
  } catch (err) {
    console.error('Erro durante o processamento:', err);
    return NextResponse.json(
      { error: 'Todos os modelos de IA falharam. Tente novamente em instantes.', message: String(err) },
      { status: 503 }
    );
  }
}
