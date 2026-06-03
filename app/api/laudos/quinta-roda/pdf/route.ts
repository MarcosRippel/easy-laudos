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

// Função para gerar PDF de laudo Quinta Roda
async function generateQuintaRodaPDF(laudoId: string, adminSettings: AdminSetting, qrCodeSvg: string = '', documentHash: string = '') {
  console.log('🔧 Gerando PDF de laudo Quinta Roda...');

  // Buscar dados do laudo Quinta Roda com relacionamentos
  const quintaRodaData = await prisma.laudoQuintaRoda.findUnique({
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

  if (!quintaRodaData) {
    throw new Error('Laudo Quinta Roda não encontrado');
  }

  console.log('🔍 DEBUG - Dados da Quinta Roda:', JSON.stringify(quintaRodaData, null, 2));

  // Ler template HTML
  const templatePath = join(process.cwd(), 'templates', 'laudo-quinta-roda-template.html');
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

  const getResultClass = (resultado: string): string => {
    return resultado === 'APROVADO' ? 'aprovado' : 'reprovado';
  };

  // Preparar dados das checkboxes para os 12 itens de exame visual
  const seloIdentificacaoSim = getCheckboxState(quintaRodaData.seloIdentificacao, true);
  const seloIdentificacaoNao = getCheckboxState(quintaRodaData.seloIdentificacao, false);

  const presencaTrincasSim = getCheckboxState(quintaRodaData.presencaTrincas, true);
  const presencaTrincasNao = getCheckboxState(quintaRodaData.presencaTrincas, false);

  const integraFixadaSim = getCheckboxState(quintaRodaData.integraFixada, true);
  const integraFixadaNao = getCheckboxState(quintaRodaData.integraFixada, false);

  const pinosIntegrosimm = getCheckboxState(quintaRodaData.pinosIntegros, true);
  const pinosIntegrosNao = getCheckboxState(quintaRodaData.pinosIntegros, false);

  const mancaisOvaladosSim = getCheckboxState(quintaRodaData.mancaisOvalados, true);
  const mancaisOvaladosNao = getCheckboxState(quintaRodaData.mancaisOvalados, false);

  const mecanismoTravamentoSim = getCheckboxState(quintaRodaData.mecanismoTravamento, true);
  const mecanismoTravamentoNao = getCheckboxState(quintaRodaData.mecanismoTravamento, false);

  const pinosPressosSim = getCheckboxState(quintaRodaData.pinosPressos, true);
  const pinosPressosNao = getCheckboxState(quintaRodaData.pinosPressos, false);

  const desgastesCanaisSim = getCheckboxState(quintaRodaData.desgastesCanais, true);
  const desgastesCanaisNao = getCheckboxState(quintaRodaData.desgastesCanais, false);

  const apoiosSapatasSim = getCheckboxState(quintaRodaData.apoiosSapatas, true);
  const apoiosSapatasNao = getCheckboxState(quintaRodaData.apoiosSapatas, false);

  const cantoneirasFixadasSim = getCheckboxState(quintaRodaData.cantoneirasFixadas, true);
  const cantoneirasFixadasNao = getCheckboxState(quintaRodaData.cantoneirasFixadas, false);

  const aterramentoFixadoSim = getCheckboxState(quintaRodaData.aterramentoFixado, true);
  const aterramentoFixadoNao = getCheckboxState(quintaRodaData.aterramentoFixado, false);

  const ensaioComplementarSim = getCheckboxState(quintaRodaData.ensaioComplementar, true);
  const ensaioComplementarNao = getCheckboxState(quintaRodaData.ensaioComplementar, false);

  // Preparar URL da foto - converter para base64 se necessário
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
          console.log('✅ Imagem carregada do filesystem:', imgPath);
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

  // Processar as 3 fotos para base64
  const fotoQuintaRoda1Base64 = await processImageUrl(quintaRodaData.fotoQuintaRoda1Url);
  const fotoQuintaRoda2Base64 = await processImageUrl(quintaRodaData.fotoQuintaRoda2Url);
  const fotoChassiBase64 = await processImageUrl(quintaRodaData.fotoChassiUrl);

  // Substituir placeholders no template
  const replacements = {
    // Dados Básicos
    '{{cliente}}': quintaRodaData.laudo.client.name || '',
    '{{placaVeiculo}}': quintaRodaData.laudo.vehicle.placa || '',
    '{{ordemServico}}': quintaRodaData.laudo.ordemServico || '',
    '{{dataEmissao}}': format(new Date(), 'dd/MM/yyyy'),
    '{{codTemporal}}': quintaRodaData.laudo.codTemporal || '',
    '{{equipamento}}': quintaRodaData.equipment?.name || 'N/A',
    '{{equipamentoTipo}}': formatEquipmentType(quintaRodaData.equipment?.equipmentType) || 'PAQUÍMETRO',
    '{{equipamentoModelo}}': quintaRodaData.equipment?.model || 'N/A',
    '{{equipamentoCertificado}}': quintaRodaData.equipment?.certificateNumber || 'N/A',
    '{{equipamentoCalibracao}}': quintaRodaData.equipment?.calibrationDate ? format(new Date(quintaRodaData.equipment.calibrationDate), 'dd/MM/yyyy') : 'N/A',
    '{{equipamentoValidade}}': quintaRodaData.equipment?.expirationDate ? format(new Date(quintaRodaData.equipment.expirationDate), 'dd/MM/yyyy') : 'N/A',
    '{{dataValidade}}': quintaRodaData.dataValidadeInspecao || '',

    // Dados da Quinta Roda
    '{{fabricanteMarca}}': quintaRodaData.fabricanteMarca || '',
    '{{modelo}}': quintaRodaData.modelo || '',
    '{{numeroIdentificacao}}': quintaRodaData.numeroIdentificacao || '',

    // Logo
    '/logo.png': logoBase64,

    // 12 Itens de Exame Visual - Placeholders e Classes das Checkboxes
    '{{seloIdentificacaoSim}}': seloIdentificacaoSim.class,
    '{{seloIdentificacaoCheckedSim}}': seloIdentificacaoSim.checked,
    '{{seloIdentificacaoNao}}': seloIdentificacaoNao.class,
    '{{seloIdentificacaoCheckedNao}}': seloIdentificacaoNao.checked,

    '{{presencaTrincasSim}}': presencaTrincasSim.class,
    '{{presencaTrincasCheckedSim}}': presencaTrincasSim.checked,
    '{{presencaTrincasNao}}': presencaTrincasNao.class,
    '{{presencaTrincasCheckedNao}}': presencaTrincasNao.checked,

    '{{integraFixadaSim}}': integraFixadaSim.class,
    '{{integraFixadaCheckedSim}}': integraFixadaSim.checked,
    '{{integraFixadaNao}}': integraFixadaNao.class,
    '{{integraFixadaCheckedNao}}': integraFixadaNao.checked,

    '{{pinosIntegrosSim}}': pinosIntegrosimm.class,
    '{{pinosIntegrosCheckedSim}}': pinosIntegrosimm.checked,
    '{{pinosIntegrosNao}}': pinosIntegrosNao.class,
    '{{pinosIntegrosCheckedNao}}': pinosIntegrosNao.checked,

    '{{mancaisOvaladosSim}}': mancaisOvaladosSim.class,
    '{{mancaisOvaladosCheckedSim}}': mancaisOvaladosSim.checked,
    '{{mancaisOvaladosNao}}': mancaisOvaladosNao.class,
    '{{mancaisOvaladosCheckedNao}}': mancaisOvaladosNao.checked,

    '{{mecanismoTravamentoSim}}': mecanismoTravamentoSim.class,
    '{{mecanismoTravamentoCheckedSim}}': mecanismoTravamentoSim.checked,
    '{{mecanismoTravamentoNao}}': mecanismoTravamentoNao.class,
    '{{mecanismoTravamentoCheckedNao}}': mecanismoTravamentoNao.checked,

    '{{pinosPressosSim}}': pinosPressosSim.class,
    '{{pinosPressosCheckedSim}}': pinosPressosSim.checked,
    '{{pinosPressosNao}}': pinosPressosNao.class,
    '{{pinosPressosCheckedNao}}': pinosPressosNao.checked,

    '{{desgastesCanaisSim}}': desgastesCanaisSim.class,
    '{{desgastesCanaisCheckedSim}}': desgastesCanaisSim.checked,
    '{{desgastesCanaisNao}}': desgastesCanaisNao.class,
    '{{desgastesCanaisCheckedNao}}': desgastesCanaisNao.checked,

    '{{apoiosSapatasSim}}': apoiosSapatasSim.class,
    '{{apoiosSapatasCheckedSim}}': apoiosSapatasSim.checked,
    '{{apoiosSapatasNao}}': apoiosSapatasNao.class,
    '{{apoiosSapatasCheckedNao}}': apoiosSapatasNao.checked,

    '{{cantoneirasFixadasSim}}': cantoneirasFixadasSim.class,
    '{{cantoneirasFixadasCheckedSim}}': cantoneirasFixadasSim.checked,
    '{{cantoneirasFixadasNao}}': cantoneirasFixadasNao.class,
    '{{cantoneirasFixadasCheckedNao}}': cantoneirasFixadasNao.checked,

    '{{aterramentoFixadoSim}}': aterramentoFixadoSim.class,
    '{{aterramentoFixadoCheckedSim}}': aterramentoFixadoSim.checked,
    '{{aterramentoFixadoNao}}': aterramentoFixadoNao.class,
    '{{aterramentoFixadoCheckedNao}}': aterramentoFixadoNao.checked,

    '{{ensaioComplementarSim}}': ensaioComplementarSim.class,
    '{{ensaioComplementarCheckedSim}}': ensaioComplementarSim.checked,
    '{{ensaioComplementarNao}}': ensaioComplementarNao.class,
    '{{ensaioComplementarCheckedNao}}': ensaioComplementarNao.checked,

    // Resultado Final
    '{{resultadoFinal}}': quintaRodaData.resultadoFinal || 'APROVADO',
    '{{resultadoFinalClass}}': getResultClass(quintaRodaData.resultadoFinal || 'APROVADO'),

    // Observações e Normas
    '{{observacoes}}': quintaRodaData.observacoes || '',
    '{{normasAplicaveis}}': quintaRodaData.normasAplicaveis || 'Portaria nº457/08, Portaria nº70/2008, NBR 8160',
    '{{inspetorResponsavel}}': quintaRodaData.inspetorResponsavel || '',
    '{{inspetor}}': quintaRodaData.inspetorResponsavel || '',

    // Fotos (3 campos)
    '{{fotoQuintaRoda1Url}}': fotoQuintaRoda1Base64,
    '{{fotoQuintaRoda2Url}}': fotoQuintaRoda2Base64,
    '{{fotoChassiUrl}}': fotoChassiBase64,

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

  // Substituições condicionais para as 3 fotos
  htmlTemplate = htmlTemplate.replace(/\{\{#if fotoQuintaRoda1Url\}\}/g, fotoQuintaRoda1Base64 ? '' : '<!--');
  htmlTemplate = htmlTemplate.replace(/\{\{#if fotoQuintaRoda2Url\}\}/g, fotoQuintaRoda2Base64 ? '' : '<!--');
  htmlTemplate = htmlTemplate.replace(/\{\{#if fotoChassiUrl\}\}/g, fotoChassiBase64 ? '' : '<!--');
  htmlTemplate = htmlTemplate.replace(/\{\{else\}\}/g, '<!--');
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

    // Buscar placa para gerar hash
    const laudoParam = await prisma.laudoQuintaRoda.findUnique({
      where: { id: laudoId },
      include: { laudo: { include: { vehicle: true } } },
    });
    const { hash: docHash, qrCodeSvg } = laudoParam
      ? await getOrCreateLaudoHash(
        laudoParam.laudoId, laudoParam.laudo.vehicle.placa,
        laudoParam.laudo.dataEmissao, 'QUINTA_RODA'
      )
      : { hash: '', qrCodeSvg: '' };

    // Gerar HTML da Quinta Roda
    const htmlContent = await generateQuintaRodaPDF(laudoId, adminSettings, qrCodeSvg, docHash);
    const filename = `laudo-quinta-roda-${laudoParam?.laudo.ordemServico || laudoId}.pdf`;

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