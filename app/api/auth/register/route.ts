import { NextRequest, NextResponse } from 'next/server';

// Configuração do Telegram Bot (mesmo do sistema)
const TELEGRAM_BOT_TOKEN = "***REMOVED-TELEGRAM-BOT-TOKEN***";
const TELEGRAM_CHAT_ID = "-1002594596544"; // Grupo convertido para formato de bot
const TELEGRAM_TOPIC_ID = "1534";

async function sendTelegramMessage(message: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        ...(TELEGRAM_TOPIC_ID ? { message_thread_id: parseInt(TELEGRAM_TOPIC_ID) } : {}),
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao enviar mensagem Telegram:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem Telegram:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      nomeEmpresa, 
      cnpj, 
      nomeResponsavel, 
      email, 
      telefone, 
      cidade, 
      estado,
      certificacoes,
      observacoes 
    } = await request.json();

    // Validações básicas
    if (!nomeEmpresa || !cnpj || !nomeResponsavel || !email || !telefone) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: Nome da Empresa, CNPJ, Nome do Responsável, Email e Telefone' },
        { status: 400 }
      );
    }

    // Formatar mensagem para Telegram
    const timestamp = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });

    const message = `
<b>📋 NOVO CADASTRO - EMISSOR DE LAUDOS</b>

🏢 <b>Empresa:</b> ${nomeEmpresa}
📄 <b>CNPJ:</b> ${cnpj}

👤 <b>Responsável:</b> ${nomeResponsavel}
📧 <b>Email:</b> ${email}
📱 <b>Telefone:</b> ${telefone}

📍 <b>Localização:</b> ${cidade || 'Não informado'}, ${estado || 'Não informado'}

${certificacoes ? `✅ <b>Certificações:</b> ${certificacoes}` : ''}

${observacoes ? `📝 <b>Observações:</b> ${observacoes}` : ''}

⏰ <b>Data/Hora:</b> ${timestamp}
🌐 <b>Sistema:</b> General Emissor de Laudos - Inspetor
    `.trim();

    // Enviar para Telegram
    const telegramSent = await sendTelegramMessage(message);

    return NextResponse.json({
      success: true,
      message: 'Solicitação de cadastro enviada com sucesso! Nossa equipe entrará em contato em breve.',
      telegramSent,
    }, { status: 200 });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

