import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { readFileSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';
import type { AdminSetting } from '@prisma/client';
import { getOrCreateLaudoHash } from '@/lib/laudoHash';

function formatEquipmentType(type?: string | null): string {
  if (!type) return '';
  const map: Record<string, string> = {
    PAQUIMETRO: 'PAQUÍMETRO',
    DECIBELIMETRO: 'DECIBELÍMETRO',
    RUIDO: 'MEDIDOR DE RUÍDO',
    CALIBRADOR: 'CALIBRADOR',
    OUTROS: 'OUTROS',
  };
  return map[type] ?? type;
}

// Função para gerar PDF de laudo Pino Rei
async function generatePinoReiPDF(laudoId: string, adminSettings: AdminSetting, qrCodeSvg: string = '', documentHash: string = '') {
  console.log('🔧 Gerando PDF de laudo Pino Rei...');

  // Buscar dados do laudo Pino Rei com relacionamentos
  const pinoReiData = await prisma.laudoPinoRei.findUnique({
    where: { id: laudoId },
    include: {
      laudo: {
        include: {
          client: true,
          vehicle: true
        }
      },
      equipment: true
    }
  });

  if (!pinoReiData) {
    throw new Error('Laudo Pino Rei não encontrado');
  }

  console.log('🔍 DEBUG - Dados do Pino Rei:', JSON.stringify(pinoReiData, null, 2));

  // Ler template HTML
  const templatePath = join(process.cwd(), 'templates', 'laudo-pino-rei-template.html');
  let htmlTemplate = readFileSync(templatePath, 'utf-8');

  // Converter logo para base64
  let logoBase64 = '';
  if (adminSettings.companyLogoUrl) {
    try {
      // Tentar ler do filesystem primeiro (para URLs relativas como /uploads/logo.png)
      if (!adminSettings.companyLogoUrl.startsWith('http')) {
        const logoPath = join(process.cwd(), 'public', adminSettings.companyLogoUrl);
        try {
          const logoBytes = readFileSync(logoPath);
          const logoType = adminSettings.companyLogoUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          logoBase64 = `data:${logoType};base64,${logoBytes.toString('base64')}`;
          console.log('✅ Logo carregado do filesystem:', logoPath);
        } catch {
          console.log('⚠️ Falha ao ler logo do filesystem, tentando HTTP...');
        }
      }

      // Fallback HTTP (para URLs absolutas)
      if (!logoBase64) {
        const logoUrl = adminSettings.companyLogoUrl.startsWith('http')
          ? adminSettings.companyLogoUrl
          : `http://localhost:3006${adminSettings.companyLogoUrl}`;

        const logoResponse = await fetch(logoUrl);
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          const logoArrayBuffer = await logoBlob.arrayBuffer();
          const logoBytes = new Uint8Array(logoArrayBuffer);
          const logoType = adminSettings.companyLogoUrl.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
          const logoBase64String = Buffer.from(logoBytes).toString('base64');
          logoBase64 = `data:${logoType};base64,${logoBase64String}`;
        }
      }
    } catch (e) {
      console.error('Erro ao converter logo para base64:', e);
    }
  }

  // Funções helper para conversões
  const booleanToSimNao = (value: boolean): string => {
    return value ? 'SIM' : 'NÃO';
  };

  const getCheckboxState = (value: boolean, targetValue: boolean) => {
    const isChecked = value === targetValue;
    return {
      class: isChecked ? 'checkbox-sim' : '',
      checked: isChecked ? 'checked' : ''
    };
  };

  const getEnumCheckboxState = (value: string, targetValue: string) => {
    const isChecked = value === targetValue;
    return {
      class: isChecked ? 'checkbox-sim' : '',
      checked: isChecked ? 'checked' : ''
    };
  };

  const getResultClass = (resultado: string): string => {
    return resultado === 'APROVADO' ? 'aprovado' : 'reprovado';
  };

  // Converter decimal para number
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    // Prisma Decimal objects têm método .toNumber()
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    if (value && typeof value.toString === 'function') return parseFloat(value.toString()) || 0;
    return 0;
  };

  // Preparar dados das checkboxes para Posição Vertical
  const posicaoVerticalSim = getCheckboxState(pinoReiData.posicaoVertical, true);
  const posicaoVerticalNao = getCheckboxState(pinoReiData.posicaoVertical, false);

  // Preparar dados das checkboxes para Presença de Trincas
  const presencaTrincasSim = getCheckboxState(pinoReiData.presencaTrincas, true);
  const presencaTrincasNao = getCheckboxState(pinoReiData.presencaTrincas, false);

  // Preparar dados das checkboxes para Integridade Fixação
  const integridadeFixacaoSim = getCheckboxState(pinoReiData.integridadeFixacao, true);
  const integridadeFixacaoNao = getCheckboxState(pinoReiData.integridadeFixacao, false);

  // Preparar dados das checkboxes para Selo Identificação
  const seloIdentificacaoSim = getCheckboxState(pinoReiData.seloIdentificacao, true);
  const seloIdentificacaoNao = getCheckboxState(pinoReiData.seloIdentificacao, false);

  // Preparar dados das checkboxes para Tipo Fixação Pino
  const tipoFixacaoSolda = getEnumCheckboxState(pinoReiData.tipoFixacaoPino, 'SOLDA');
  const tipoFixacaoFlangeado = getEnumCheckboxState(pinoReiData.tipoFixacaoPino, 'FLANGEADO');

  // Preparar dados das checkboxes para Estado Conservação
  const estadoConservacaoSim = getCheckboxState(pinoReiData.estadoConservacao, true);
  const estadoConservacaoNao = getCheckboxState(pinoReiData.estadoConservacao, false);

  // Preparar dados das checkboxes para Mesa - Tipo Fixação
  const tipoFixacaoMesaSolda = getEnumCheckboxState(pinoReiData.tipoFixacaoMesa, 'SOLDA');
  const tipoFixacaoMesaAparafusada = getEnumCheckboxState(pinoReiData.tipoFixacaoMesa, 'APARAFUSADA');

  // Preparar dados das checkboxes para Mesa Bem Fixada
  const mesaBemFixadaSim = getCheckboxState(pinoReiData.mesaBemFixada, true);
  const mesaBemFixadaNao = getCheckboxState(pinoReiData.mesaBemFixada, false);

  // Preparar dados das checkboxes para Mesa Reparo Solda
  const mesaReparoSoldaSim = getCheckboxState(pinoReiData.mesaReparoSolda, true);
  const mesaReparoSoldaNao = getCheckboxState(pinoReiData.mesaReparoSolda, false);

  // Preparar dados das checkboxes para Ensaio Complementar
  const ensaioComplementarSim = getCheckboxState(pinoReiData.ensaioComplementar, true);
  const ensaioComplementarNao = getCheckboxState(pinoReiData.ensaioComplementar, false);

  // Preparar URLs das fotos - converter para base64 se necessário
  const processImageUrl = async (url: string | null): Promise<string> => {
    if (!url) return '';

    try {
      if (url.startsWith('data:')) {
        return url; // Já é base64
      }

      // Tentar ler do filesystem primeiro (para URLs relativas como /uploads/foto.jpg)
      if (!url.startsWith('http')) {
        try {
          const imgPath = join(process.cwd(), 'public', url);
          const imgBytes = readFileSync(imgPath);
          const ext = url.toLowerCase().split('.').pop() || 'jpeg';
          const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
          const mimeType = mimeMap[ext] || 'image/jpeg';
          console.log('✅ Imagem Pino Rei carregada do filesystem:', imgPath);
          return `data:${mimeType};base64,${imgBytes.toString('base64')}`;
        } catch {
          console.log('⚠️ Falha ao ler imagem do filesystem, tentando HTTP...');
        }
      }

      // Fallback HTTP
      const fullUrl = url.startsWith('http') ? url : `http://localhost:3006${url}`;
      const response = await fetch(fullUrl);

      if (response.ok) {
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const base64String = Buffer.from(bytes).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return `data:${mimeType};base64,${base64String}`;
      }
    } catch (e) {
      console.error('Erro ao processar imagem:', e);
    }

    return '';
  };

  const fotoChassiBase64 = await processImageUrl(pinoReiData.fotoChassiUrl);
  const fotoPinoReiBase64 = await processImageUrl(pinoReiData.fotoPinoReiUrl);
  const fotoMesaBase64 = await processImageUrl(pinoReiData.fotoMesaUrl);

  // Substituir placeholders no template
  const replacements = {
    // Dados Básicos
    '{{cliente}}': pinoReiData.laudo.client.name || '',
    '{{placaVeiculo}}': pinoReiData.laudo.vehicle.placa || '',
    '{{ordemServico}}': pinoReiData.laudo.ordemServico || '',
    '{{dataEmissao}}': format(new Date(), 'dd/MM/yyyy'),
    '{{codTemporal}}': pinoReiData.laudo.codTemporal || '',
    '{{equipamento}}': pinoReiData.equipment?.name || 'N/A',
    '{{equipamentoTipo}}': formatEquipmentType(pinoReiData.equipment?.equipmentType) || 'PAQUÍMETRO',
    '{{equipamentoModelo}}': pinoReiData.equipment?.model || 'N/A',
    '{{equipamentoCertificado}}': pinoReiData.equipment?.certificateNumber || 'N/A',
    '{{equipamentoCalibracao}}': pinoReiData.equipment?.calibrationDate ? format(new Date(pinoReiData.equipment.calibrationDate), 'dd/MM/yyyy') : 'N/A',
    '{{equipamentoValidade}}': pinoReiData.equipment?.expirationDate ? format(new Date(pinoReiData.equipment.expirationDate), 'dd/MM/yyyy') : 'N/A',
    '{{dataValidade}}': pinoReiData.dataValidadeInspecao || '',

    // Logo
    '/logo.png': logoBase64,

    // Exame Visual do Pino Rei - Placeholders e Classes das Checkboxes
    '{{posicaoVerticalSim}}': posicaoVerticalSim.class,
    '{{posicaoVerticalCheckedSim}}': posicaoVerticalSim.checked,
    '{{posicaoVerticalNao}}': posicaoVerticalNao.class,
    '{{posicaoVerticalCheckedNao}}': posicaoVerticalNao.checked,

    '{{presencaTrincasSim}}': presencaTrincasSim.class,
    '{{presencaTrincasCheckedSim}}': presencaTrincasSim.checked,
    '{{presencaTrincasNao}}': presencaTrincasNao.class,
    '{{presencaTrincasCheckedNao}}': presencaTrincasNao.checked,

    '{{integridadeFixacaoSim}}': integridadeFixacaoSim.class,
    '{{integridadeFixacaoCheckedSim}}': integridadeFixacaoSim.checked,
    '{{integridadeFixacaoNao}}': integridadeFixacaoNao.class,
    '{{integridadeFixacaoCheckedNao}}': integridadeFixacaoNao.checked,

    '{{seloIdentificacaoSim}}': seloIdentificacaoSim.class,
    '{{seloIdentificacaoCheckedSim}}': seloIdentificacaoSim.checked,
    '{{seloIdentificacaoNao}}': seloIdentificacaoNao.class,
    '{{seloIdentificacaoCheckedNao}}': seloIdentificacaoNao.checked,

    '{{tipoFixacaoSolda}}': tipoFixacaoSolda.class,
    '{{tipoFixacaoCheckedSolda}}': tipoFixacaoSolda.checked,
    '{{tipoFixacaoFlangeado}}': tipoFixacaoFlangeado.class,
    '{{tipoFixacaoCheckedFlangeado}}': tipoFixacaoFlangeado.checked,

    '{{estadoConservacaoSim}}': estadoConservacaoSim.class,
    '{{estadoConservacaoCheckedSim}}': estadoConservacaoSim.checked,
    '{{estadoConservacaoNao}}': estadoConservacaoNao.class,
    '{{estadoConservacaoCheckedNao}}': estadoConservacaoNao.checked,

    '{{diametroRegistrado}}': toNumber(pinoReiData.diametroRegistrado).toFixed(1),
    '{{resultadoPinoRei}}': pinoReiData.resultadoPinoRei || 'APROVADO',
    '{{resultadoPinoReiClass}}': getResultClass(pinoReiData.resultadoPinoRei || 'APROVADO'),

    // Inspeção Mesa
    '{{tipoFixacaoMesaSolda}}': tipoFixacaoMesaSolda.class,
    '{{tipoFixacaoMesaCheckedSolda}}': tipoFixacaoMesaSolda.checked,
    '{{tipoFixacaoMesaAparafusada}}': tipoFixacaoMesaAparafusada.class,
    '{{tipoFixacaoMesaCheckedAparafusada}}': tipoFixacaoMesaAparafusada.checked,

    '{{mesaBemFixadaSim}}': mesaBemFixadaSim.class,
    '{{mesaBemFixadaCheckedSim}}': mesaBemFixadaSim.checked,
    '{{mesaBemFixadaNao}}': mesaBemFixadaNao.class,
    '{{mesaBemFixadaCheckedNao}}': mesaBemFixadaNao.checked,

    '{{mesaReparoSoldaSim}}': mesaReparoSoldaSim.class,
    '{{mesaReparoSoldaCheckedSim}}': mesaReparoSoldaSim.checked,
    '{{mesaReparoSoldaNao}}': mesaReparoSoldaNao.class,
    '{{mesaReparoSoldaCheckedNao}}': mesaReparoSoldaNao.checked,

    '{{resultadoMesa}}': pinoReiData.resultadoMesa || 'APROVADO',
    '{{resultadoMesaClass}}': getResultClass(pinoReiData.resultadoMesa || 'APROVADO'),

    // Ensaios e Resultado
    '{{ensaioComplementarSim}}': ensaioComplementarSim.class,
    '{{ensaioComplementarCheckedSim}}': ensaioComplementarSim.checked,
    '{{ensaioComplementarNao}}': ensaioComplementarNao.class,
    '{{ensaioComplementarCheckedNao}}': ensaioComplementarNao.checked,
    '{{qualEnsaio}}': pinoReiData.qualEnsaio || '',
    '{{resultadoGeral}}': pinoReiData.resultadoGeral || 'APROVADO',
    '{{resultadoGeralClass}}': getResultClass(pinoReiData.resultadoGeral || 'APROVADO'),
    '{{observacoes}}': pinoReiData.observacoes || '',
    '{{normasAplicaveis}}': pinoReiData.normasAplicaveis || 'Portaria nº 457/08, Portaria nº 70/2008',
    '{{inspetorResponsavel}}': pinoReiData.inspetorResponsavel || '',
    '{{inspetor}}': pinoReiData.inspetorResponsavel || '',

    // Fotos
    '{{fotoChassiUrl}}': fotoChassiBase64,
    '{{fotoPinoReiUrl}}': fotoPinoReiBase64,
    '{{fotoMesaUrl}}': fotoMesaBase64,

    // Data de geração
    '{{dataGeracao}}': format(new Date(), 'dd/MM/yyyy HH:mm:ss'),

    // QR Code e Hash
    '{{qrCodeSvg}}': qrCodeSvg ? `<div style="width: 60px; height: 60px; flex-shrink: 0;">${qrCodeSvg}</div>` : '',
    '{{documentHash}}': documentHash ? `SHA-256: ${documentHash.substring(0, 40)}...` : '',
    '{{qrHashValue}}': documentHash,
  };

  // Aplicar todas as substituições
  Object.entries(replacements).forEach(([placeholder, value]) => {
    htmlTemplate = htmlTemplate.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  // Substituições condicionais para seções com handlebars
  // Substituir {{#if ensaioComplementarSim}} e {{/if}}
  if (pinoReiData.ensaioComplementar === true) {
    htmlTemplate = htmlTemplate.replace(/\{\{#if ensaioComplementarSim\}\}/g, '');
    htmlTemplate = htmlTemplate.replace(/\{\{\/if\}\}/g, '');
  } else {
    // Remove a seção entre {{#if ensaioComplementarSim}} e {{/if}}
    htmlTemplate = htmlTemplate.replace(/\{\{#if ensaioComplementarSim\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  // Substituições condicionais para fotos
  htmlTemplate = htmlTemplate.replace(/\{\{#if fotoChassiUrl\}\}/g, fotoChassiBase64 ? '' : '<!--');
  htmlTemplate = htmlTemplate.replace(/\{\{#if fotoPinoReiUrl\}\}/g, fotoPinoReiBase64 ? '' : '<!--');
  htmlTemplate = htmlTemplate.replace(/\{\{#if fotoMesaUrl\}\}/g, fotoMesaBase64 ? '' : '<!--');
  htmlTemplate = htmlTemplate.replace(/\{\{else\}\}/g, fotoChassiBase64 || fotoPinoReiBase64 || fotoMesaBase64 ? '<!--' : '');
  htmlTemplate = htmlTemplate.replace(/\{\{\/if\}\}/g, '-->');

  return htmlTemplate;
}

// Endpoint GET para geração de PDF
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const laudoId = searchParams.get('id');
    const format = searchParams.get('format') || 'pdf';

    if (!laudoId) {
      return NextResponse.json({ error: 'ID do laudo é obrigatório' }, { status: 400 });
    }

    // Multi-tenancy: buscar adminSettings pelo userId do inspetor logado
    const session = getSessionFromRequest(request);
    const userIdFilter = session && session.role !== 'admin' ? session.id : null;
    let adminSettings: AdminSetting | null = await prisma.adminSetting.findFirst({
      where: { userId: userIdFilter },
    });
    if (!adminSettings) {
      adminSettings = await prisma.adminSetting.create({
        data: { companyName: 'Your Company Name', reportTitle: 'LAUDO DE INSPEÇÃO TÉCNICA', userId: userIdFilter }
      });
    }

    // Buscar dados para gerar hash
    const laudoParam = await prisma.laudoPinoRei.findUnique({
      where: { id: laudoId },
      include: { laudo: { include: { vehicle: true } } },
    });
    const { hash: docHash, qrCodeSvg } = laudoParam
      ? await getOrCreateLaudoHash(
        laudoParam.laudoId, laudoParam.laudo.vehicle.placa,
        laudoParam.laudo.dataEmissao, 'PINO_REI'
      )
      : { hash: '', qrCodeSvg: '' };

    // Gerar HTML do Pino Rei
    const htmlContent = await generatePinoReiPDF(laudoId, adminSettings, qrCodeSvg, docHash);
    const filename = `laudo-pino-rei-${laudoParam?.laudo.ordemServico || laudoId}.pdf`;

    // Se o formato solicitado for HTML, retornar HTML diretamente
    if (format === 'html') {
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        }
      });
    }

    // Usar Puppeteer para converter HTML para PDF
    console.log('🚀 Iniciando browser Puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      timeout: 30000
    });

    console.log('📄 Criando nova página...');
    const page = await browser.newPage();

    // Adicionar tratamento de erro para página
    page.on('error', (error) => {
      console.error('❌ Erro na página:', error);
    });

    page.on('pageerror', (error) => {
      console.error('❌ Erro de JavaScript na página:', error);
    });

    console.log('🔧 Configurando viewport...');
    await page.setViewport({ width: 794, height: 1123 }); // A4 em pixels

    console.log('📄 Carregando HTML content...');
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('⏳ Aguardando estabilização da página...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📑 Gerando PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '8mm',     // ESPAÇO ADEQUADO no topo
        right: '15mm',  // MARGENS MAIORES para centralizar
        bottom: '8mm',  // ESPAÇO para expansão vertical
        left: '15mm'    // MARGENS SIMÉTRICAS para centralização
      },
      preferCSSPageSize: false, // Forçar formato A4
      displayHeaderFooter: false,
      scale: 0.85, // Escala mais compacta para forçar 1 página
      width: '210mm',
      height: '297mm'
    });

    console.log('✅ PDF gerado com sucesso, fechando browser...');
    await browser.close();

    // Retornar PDF como resposta
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    console.error('❌ Detalhes do erro:', error instanceof Error ? error.message : 'Erro desconhecido');

    return NextResponse.json({
      error: 'Falha ao gerar PDF',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}