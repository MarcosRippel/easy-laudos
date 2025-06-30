import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: '***REMOVED-OPENAI-API-KEY***'
});

const assistantId = 'asst_kga7L8PQxvBb1PvA01OOkCkH';

export async function POST(request: NextRequest) {
  console.log('🔥 API /process-document CHAMADA RECEBIDA!');
  
  try {
    console.log('📋 Processando formData...');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('📁 Arquivo recebido:', {
      nome: file?.name,
      tipo: file?.type,
      tamanho: file?.size
    });

    if (!file) {
      console.log('❌ ERRO: Nenhum arquivo fornecido');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('📤 Fazendo upload para OpenAI...');
    // Upload do arquivo
    const uploadedFile = await openai.files.create({
      file,
      purpose: 'assistants'
    });
    console.log('✅ Upload concluído:', uploadedFile.id);

    console.log('🧵 Criando thread...');
    // Criar thread
    const thread = await openai.beta.threads.create();
    console.log('✅ Thread criada:', thread.id);

    console.log('📝 Enviando mensagem com attachment...');
    // Enviar mensagem com o prompt + arquivo
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Extraia Placa Nro. Chassi Espécie/Tipo Marca/Modelo Ano Fabric./Modelo e retorne em JSON'
        }
      ],
      attachments: [
        {
          file_id: uploadedFile.id,
          tools: [{ type: 'file_search' }]
        }
      ]
    });
    console.log('✅ Mensagem enviada:', message.id);

    console.log('🚀 Executando assistant...');
    // Executar assistant com modelo gpt-4.1-mini
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      model: 'gpt-4.1-mini'
    });
    console.log('✅ Run criada:', run.id);

    console.log('⏳ Aguardando execução...');
    // Aguardar execução
    let status = 'queued';
    let attempts = 0;
    const maxAttempts = 60;

    while (status !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
      status = runStatus.status;
      attempts++;
      
      console.log(`⏱️ Status: ${status} (tentativa ${attempts}/${maxAttempts})`);

      if (status === 'failed') {
        console.log('❌ Execução falhou:', runStatus.last_error);
        throw new Error(`Execução falhou: ${runStatus.last_error?.message || 'erro desconhecido'}`);
      }
    }

    if (status !== 'completed') {
      console.log('⚠️ Execução não completada, status final:', status);
      throw new Error(`Execução não completada: status final = ${status}`);
    }

    console.log('✅ Execução completada! Obtendo resposta...');
    // Obter a resposta final
    const messages = await openai.beta.threads.messages.list(thread.id, {
      order: 'desc',
      limit: 1
    });

    const messageContent = messages.data[0]?.content.find(c => c.type === 'text');

    if (!messageContent) {
      console.log('❌ Nenhuma resposta textual encontrada');
      throw new Error('Nenhuma resposta textual recebida do assistente.');
    }

    console.log('🎉 RESPOSTA FINAL:', messageContent.text.value);
    console.log('📤 Retornando resposta para frontend...');

    return NextResponse.json({
      resposta: messageContent.text.value
    });

  } catch (err) {
    console.error('Erro durante o processamento:', err);
    return NextResponse.json({ error: 'Erro interno', message: String(err) }, { status: 500 });
  }
}
