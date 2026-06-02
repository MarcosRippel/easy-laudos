import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Client, Vehicle, Laudo, AdminSetting } from '@prisma/client';
import type { Equipment } from '@/types/equipment';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/middleware-auth';
import { getOrCreateLaudoHash } from '@/lib/laudoHash';

// Função para gerar PDF de laudo de ruído
async function generateRuidoPDF(laudoId: string, adminSettings: AdminSetting, qrCodeSvg: string = '', documentHash: string = '') {
  console.log('🔊 Gerando PDF de laudo de ruído...');
  console.log(`🔍 LaudoId: ${laudoId}`);

  // Buscar dados do laudo de ruído DIRETAMENTE do banco (sem fetch HTTP)
  const laudoRuidoDB = await prisma.laudoRuido.findUnique({
    where: { laudoId },
    include: {
      laudo: { include: { client: true, vehicle: true } },
      equipment: true,
    }
  });

  if (!laudoRuidoDB || !laudoRuidoDB.laudo) {
    throw new Error(`Laudo de ruído não encontrado para laudoId: ${laudoId}`);
  }

  // Estruturar dados no mesmo formato que o antigo fetch retornava
  const ruidoData = {
    ...laudoRuidoDB,
    dataVencimento: laudoRuidoDB.laudo.dataVencimento,
    observacoes: laudoRuidoDB.laudo.observacoes,
    laudo: laudoRuidoDB.laudo,
    equipmentId: laudoRuidoDB.equipmentId,
  };

  console.log('🔍 DEBUG - Dados recebidos do banco:');
  console.log('aceleracao1:', ruidoData.aceleracao1, 'tipo:', typeof ruidoData.aceleracao1);
  console.log('dataVencimento RAW:', ruidoData.dataVencimento);

  // 🔧 CONVERTER DECIMAL PARA NUMBER - Prisma retorna Decimal objects
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    // Prisma Decimal objects têm método .toNumber()
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    if (value && typeof value.toString === 'function') return parseFloat(value.toString()) || 0;
    return 0;
  };

  // Buscar dados do equipamento DIRETAMENTE do banco
  let equipmentData: Equipment | null = null;
  if (ruidoData.equipmentId) {
    try {
      equipmentData = await prisma.equipment.findUnique({
        where: { id: ruidoData.equipmentId }
      }) as Equipment | null;
    } catch (e) {
      console.error('Erro ao buscar equipamento:', e);
    }
  }

  // Calcular estatísticas - Converter Decimal para Number
  const aceleracaoValues = [
    toNumber(ruidoData.aceleracao1), toNumber(ruidoData.aceleracao2), toNumber(ruidoData.aceleracao3),
    toNumber(ruidoData.aceleracao4), toNumber(ruidoData.aceleracao5), toNumber(ruidoData.aceleracao6)
  ];

  const marchaLentaValues = [
    toNumber(ruidoData.marchaLenta1), toNumber(ruidoData.marchaLenta2), toNumber(ruidoData.marchaLenta3),
    toNumber(ruidoData.marchaLenta4), toNumber(ruidoData.marchaLenta5), toNumber(ruidoData.marchaLenta6)
  ];

  const calculateMedian = (values: number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const medianaAceleracao = calculateMedian(aceleracaoValues);
  const maxAceleracao = Math.max(...aceleracaoValues);
  const medianaMarchaLenta = calculateMedian(marchaLentaValues);
  const maxMarchaLenta = Math.max(...marchaLentaValues);

  // 📊 CALCULAR COORDENADAS DO GRÁFICO - ATUALIZADAS PARA SVG EXPANDIDO
  const calculateChartCoordinates = (value: number) => {
    const maxChartValue = 120; // Escala do gráfico: 0-120 dB (ampliada)
    const chartHeight = 130; // Altura total do gráfico (160 - 30) - SVG expandido
    const baseY = 160; // Y da base do gráfico - SVG expandido

    const barHeight = Math.max(2, (value / maxChartValue) * chartHeight); // Mínimo 2px para visibilidade
    const barY = baseY - barHeight;
    const textY = barY + (barHeight / 2) + 4; // +4 para centralizar texto

    return {
      height: Math.round(barHeight),
      y: Math.round(barY),
      textY: Math.round(textY)
    };
  };

  // Calcular coordenadas para cada medição
  const chartData = {
    aceleracao1: calculateChartCoordinates(toNumber(ruidoData.aceleracao1)),
    aceleracao2: calculateChartCoordinates(toNumber(ruidoData.aceleracao2)),
    aceleracao3: calculateChartCoordinates(toNumber(ruidoData.aceleracao3)),
    aceleracao4: calculateChartCoordinates(toNumber(ruidoData.aceleracao4)),
    aceleracao5: calculateChartCoordinates(toNumber(ruidoData.aceleracao5)),
    aceleracao6: calculateChartCoordinates(toNumber(ruidoData.aceleracao6)),
    marchaLenta1: calculateChartCoordinates(toNumber(ruidoData.marchaLenta1)),
    marchaLenta2: calculateChartCoordinates(toNumber(ruidoData.marchaLenta2)),
    marchaLenta3: calculateChartCoordinates(toNumber(ruidoData.marchaLenta3)),
    marchaLenta4: calculateChartCoordinates(toNumber(ruidoData.marchaLenta4)),
    marchaLenta5: calculateChartCoordinates(toNumber(ruidoData.marchaLenta5)),
    marchaLenta6: calculateChartCoordinates(toNumber(ruidoData.marchaLenta6)),
  };

  // Ler template HTML
  const templatePath = join(process.cwd(), 'templates', 'laudo-ruido-template.html');
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
          : `${process.env.NEXTAUTH_URL || 'http://localhost:3006'}${adminSettings.companyLogoUrl}`;

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

  // Substituir placeholders no template
  const replacements = {
    '{{osNumber}}': ruidoData.laudo.ordemServico || '',
    '{{temporalCode}}': ruidoData.laudo.codTemporal || '',
    '{{currentDate}}': format(new Date(), 'dd/MM/yyyy'),
    '{{companyName}}': adminSettings.companyName || 'EMPRESA EXEMPLO INSPEÇÕES LTDA',
    '{{companyAddress}}': `${adminSettings.companyAddress || 'Rua Exemplo 100 - Cidade Exemplo /RS'}`,
    '{{companyPhone}}': adminSettings.companyPhone || '(11) 90000-0000',
    '{{companyEmail}}': '', // Campo não existe no AdminSetting
    '{{logoPath}}': logoBase64,
    '{{clientName}}': ruidoData.laudo.client.name || '',
    '{{clientDocument}}': ruidoData.laudo.client.cnpj || '',
    '{{clientAddress}}': `${ruidoData.laudo.client.addressStreet || ''}, ${ruidoData.laudo.client.addressNumber || ''}`,
    '{{vehicleBrand}}': ruidoData.laudo.vehicle.marcaModelo || '',
    '{{vehicleChassis}}': ruidoData.laudo.vehicle.numeroChassi || '',
    '{{vehiclePlate}}': ruidoData.laudo.vehicle.placa || '',
    '{{vehicleYear}}': ruidoData.laudo.vehicle.anoFabricacaoModelo || '',
    '{{equipmentName}}': equipmentData?.name || 'N/A',
    '{{equipmentModel}}': equipmentData?.model || 'N/A',
    '{{equipmentCertificate}}': equipmentData?.certificateNumber || 'N/A',
    '{{equipmentCalibration}}': equipmentData?.calibrationDate ? format(new Date(equipmentData.calibrationDate), 'dd/MM/yyyy') : 'N/A',
    '{{equipmentExpiration}}': equipmentData?.expirationDate ? format(new Date(equipmentData.expirationDate), 'dd/MM/yyyy') : 'N/A',
    '{{aceleracao1}}': toNumber(ruidoData.aceleracao1).toFixed(1),
    '{{aceleracao2}}': toNumber(ruidoData.aceleracao2).toFixed(1),
    '{{aceleracao3}}': toNumber(ruidoData.aceleracao3).toFixed(1),
    '{{aceleracao4}}': toNumber(ruidoData.aceleracao4).toFixed(1),
    '{{aceleracao5}}': toNumber(ruidoData.aceleracao5).toFixed(1),
    '{{aceleracao6}}': toNumber(ruidoData.aceleracao6).toFixed(1),
    '{{marchaLenta1}}': toNumber(ruidoData.marchaLenta1).toFixed(1),
    '{{marchaLenta2}}': toNumber(ruidoData.marchaLenta2).toFixed(1),
    '{{marchaLenta3}}': toNumber(ruidoData.marchaLenta3).toFixed(1),
    '{{marchaLenta4}}': toNumber(ruidoData.marchaLenta4).toFixed(1),
    '{{marchaLenta5}}': toNumber(ruidoData.marchaLenta5).toFixed(1),
    '{{marchaLenta6}}': toNumber(ruidoData.marchaLenta6).toFixed(1),
    '{{medianaAceleracao}}': medianaAceleracao.toFixed(1),
    '{{maxAceleracao}}': maxAceleracao.toFixed(1),
    '{{medianaMarchaLenta}}': medianaMarchaLenta.toFixed(1),
    '{{maxMarchaLenta}}': maxMarchaLenta.toFixed(1),
    '{{ruidoMaximoMedido}}': ruidoData.ruidoMaximoMedido ? toNumber(ruidoData.ruidoMaximoMedido).toFixed(1) : 'N/A',
    '{{resultado}}': ruidoData.resultado || 'APROVADO',
    '{{resultClass}}': ruidoData.resultado === 'APROVADO' ? 'aprovado' : 'reprovado',
    '{{validityDate}}': ruidoData.dataVencimento || 'NÃO INFORMADO',
    '{{inspector}}': ruidoData.inspetorResponsavel || 'Espaço para assinatura digital',
    '{{observations}}': ruidoData.observacoes || 'Laudo de ruído conforme especificações técnicas. Medições realizadas em condições controladas.',
    '{{generationDate}}': format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
    '{{qrCodeSvg}}': qrCodeSvg,
    '{{documentHash}}': documentHash ? `SHA-256: ${documentHash.substring(0, 32)}...` : '',

    // 📊 COORDENADAS DO GRÁFICO - Aceleração
    '{{chart_aceleracao1_y}}': chartData.aceleracao1.y.toString(),
    '{{chart_aceleracao1_h}}': chartData.aceleracao1.height.toString(),
    '{{chart_aceleracao1_text_y}}': chartData.aceleracao1.textY.toString(),
    '{{chart_aceleracao2_y}}': chartData.aceleracao2.y.toString(),
    '{{chart_aceleracao2_h}}': chartData.aceleracao2.height.toString(),
    '{{chart_aceleracao2_text_y}}': chartData.aceleracao2.textY.toString(),
    '{{chart_aceleracao3_y}}': chartData.aceleracao3.y.toString(),
    '{{chart_aceleracao3_h}}': chartData.aceleracao3.height.toString(),
    '{{chart_aceleracao3_text_y}}': chartData.aceleracao3.textY.toString(),
    '{{chart_aceleracao4_y}}': chartData.aceleracao4.y.toString(),
    '{{chart_aceleracao4_h}}': chartData.aceleracao4.height.toString(),
    '{{chart_aceleracao4_text_y}}': chartData.aceleracao4.textY.toString(),
    '{{chart_aceleracao5_y}}': chartData.aceleracao5.y.toString(),
    '{{chart_aceleracao5_h}}': chartData.aceleracao5.height.toString(),
    '{{chart_aceleracao5_text_y}}': chartData.aceleracao5.textY.toString(),
    '{{chart_aceleracao6_y}}': chartData.aceleracao6.y.toString(),
    '{{chart_aceleracao6_h}}': chartData.aceleracao6.height.toString(),
    '{{chart_aceleracao6_text_y}}': chartData.aceleracao6.textY.toString(),

    // 📊 COORDENADAS DO GRÁFICO - Marcha Lenta
    '{{chart_marchalenta1_y}}': chartData.marchaLenta1.y.toString(),
    '{{chart_marchalenta1_h}}': chartData.marchaLenta1.height.toString(),
    '{{chart_marchalenta1_text_y}}': chartData.marchaLenta1.textY.toString(),
    '{{chart_marchalenta2_y}}': chartData.marchaLenta2.y.toString(),
    '{{chart_marchalenta2_h}}': chartData.marchaLenta2.height.toString(),
    '{{chart_marchalenta2_text_y}}': chartData.marchaLenta2.textY.toString(),
    '{{chart_marchalenta3_y}}': chartData.marchaLenta3.y.toString(),
    '{{chart_marchalenta3_h}}': chartData.marchaLenta3.height.toString(),
    '{{chart_marchalenta3_text_y}}': chartData.marchaLenta3.textY.toString(),
    '{{chart_marchalenta4_y}}': chartData.marchaLenta4.y.toString(),
    '{{chart_marchalenta4_h}}': chartData.marchaLenta4.height.toString(),
    '{{chart_marchalenta4_text_y}}': chartData.marchaLenta4.textY.toString(),
    '{{chart_marchalenta5_y}}': chartData.marchaLenta5.y.toString(),
    '{{chart_marchalenta5_h}}': chartData.marchaLenta5.height.toString(),
    '{{chart_marchalenta5_text_y}}': chartData.marchaLenta5.textY.toString(),
    '{{chart_marchalenta6_y}}': chartData.marchaLenta6.y.toString(),
    '{{chart_marchalenta6_h}}': chartData.marchaLenta6.height.toString(),
    '{{chart_marchalenta6_text_y}}': chartData.marchaLenta6.textY.toString()
  };

  // Aplicar todas as substituições
  Object.entries(replacements).forEach(([placeholder, value]) => {
    htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, 'g'), value);
  });

  return htmlTemplate;
}

// Função para gerar PDF de laudo LIT (server-side)
async function generateLitHTML(fullLaudo: Laudo & { client: Client; vehicle: Vehicle }, adminSettings: AdminSetting, qrCodeSvg: string = '', documentHash: string = '') {
  console.log('📝 Gerando HTML de laudo LIT...');

  // Converter logo para base64
  let logoBase64 = '';
  if (adminSettings.companyLogoUrl) {
    try {
      const logoUrl = adminSettings.companyLogoUrl.startsWith('http')
        ? adminSettings.companyLogoUrl
        : `${process.env.NEXTAUTH_URL || 'http://localhost:3006'}${adminSettings.companyLogoUrl}`;
      
      const isLocalLogo = adminSettings.companyLogoUrl.startsWith('/uploads/') || adminSettings.companyLogoUrl.startsWith('/api/uploads/');
      if (isLocalLogo) {
        const pathModule = require('path');
        const fs = require('fs');
        const filename = adminSettings.companyLogoUrl.replace(/^\/(api\/)?uploads\//, '');
        const filePath = pathModule.join(process.cwd(), 'public', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          const logoBytes = fs.readFileSync(filePath);
          const ext = pathModule.extname(filename).toLowerCase();
          const logoType = ext === '.png' ? 'image/png' : 'image/jpeg';
          logoBase64 = `data:${logoType};base64,${logoBytes.toString('base64')}`;
        }
      } else {
        const logoResponse = await fetch(logoUrl);
        if (logoResponse.ok) {
          const logoBytes = new Uint8Array(await logoResponse.arrayBuffer());
          const logoType = logoResponse.headers.get('content-type') || 'image/png';
          const logoBase64String = Buffer.from(logoBytes).toString('base64');
          logoBase64 = `data:${logoType};base64,${logoBase64String}`;
        }
      }
    } catch (e) {
      console.error('Erro ao converter logo para base64:', e);
    }
  }

  // Processar imagens do laudo - converter para base64
  const processImageUrl = async (url: string | null): Promise<string> => {
    if (!url || url.trim() === '') return '';
    try {
      if (url.startsWith('data:')) return url;
      const isLocalUpload = url.startsWith('/uploads/') || url.startsWith('/api/uploads/');
      if (isLocalUpload) {
        const fs = require('fs');
        const pathModule = require('path');
        const filename = url.replace(/^\/(api\/)?uploads\//, '');
        const filePath = pathModule.join(process.cwd(), 'public', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const ext = pathModule.extname(filename).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
          return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        }
      }
      const imageUrl = url.startsWith('http') ? url : `${process.env.NEXTAUTH_URL || 'http://localhost:3006'}${url}`;
      const response = await fetch(imageUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return `data:${mimeType};base64,${Buffer.from(new Uint8Array(arrayBuffer)).toString('base64')}`;
      }
    } catch (e) {
      console.error('Erro ao processar imagem LIT:', e);
    }
    return '';
  };

  const fotoDianteiraBase64 = await processImageUrl(fullLaudo.fotoDianteiraUrl);
  const fotoTraseiraBase64 = await processImageUrl(fullLaudo.fotoTraseiraUrl);
  const fotoChassiBase64 = await processImageUrl(fullLaudo.fotoChassiUrl);

  console.log('🖼️ LIT - Imagens processadas:', { 
    dianteira: !!fotoDianteiraBase64, 
    traseira: !!fotoTraseiraBase64, 
    chassi: !!fotoChassiBase64 
  });

  // Formatar datas com proteção
  let dataEmissaoFormatted = '';
  try {
    if (fullLaudo.dataEmissao) {
      const d = new Date(fullLaudo.dataEmissao);
      if (!isNaN(d.getTime())) dataEmissaoFormatted = format(d, 'dd/MM/yyyy');
    }
  } catch { dataEmissaoFormatted = 'Data Inválida'; }

  let dataVerifPinoReiFormatted = '';
  try {
    if (fullLaudo.dataVerifPinoRei) {
      let dateStr = fullLaudo.dataVerifPinoRei;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) dataVerifPinoReiFormatted = format(d, 'dd/MM/yyyy');
      else dataVerifPinoReiFormatted = fullLaudo.dataVerifPinoRei;
    }
  } catch { dataVerifPinoReiFormatted = fullLaudo.dataVerifPinoRei || ''; }

  // Processar observações - unificar parágrafos
  const obsText = (fullLaudo.observacoes || '')
    .replace(/--- DADOS CHECKLIST ---[\s\S]*$/, '') // Remover dados checklist se houver
    .trim();

  const companyName = adminSettings.companyName || 'EMPRESA EXEMPLO INSPEÇÕES LTDA';
  const companyAddress = adminSettings.companyAddress || 'Rua Exemplo 100 - Cidade Exemplo/RS';
  const companyPhone = adminSettings.companyPhone || '(11) 90000-0000';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: Arial, Helvetica, sans-serif; 
    font-size: 9pt; 
    color: #000;
    width: 210mm;
    min-height: 297mm;
    position: relative;
  }
  .page { 
    padding: 8mm 10mm;
    position: relative;
  }
  /* Marca d'agua */
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.06;
    z-index: 0;
    pointer-events: none;
  }
  .watermark img { width: 400px; height: auto; }
  .content { position: relative; z-index: 1; }
  
  /* Header */
  .header { text-align: center; margin-bottom: 3mm; }
  .header-logo { height: 40px; margin-bottom: 2mm; }
  .header-bar {
    background: #c0c0c0;
    padding: 2mm 3mm;
    font-size: 7pt;
    border: 0.5px solid #000;
  }
  .header-title { font-size: 11pt; font-weight: bold; margin-top: 1mm; }
  .header-date { float: right; font-size: 9pt; }
  
  /* Info boxes */
  .info-row { display: flex; gap: 0; margin-top: 2mm; }
  .info-box {
    border: 0.5px solid #000;
    padding: 1.5mm 2mm;
    flex: 1;
  }
  .info-label { font-size: 6pt; color: #444; }
  .info-value { font-size: 9pt; margin-top: 0.5mm; }
  
  /* Sections */
  .section { 
    border: 1.5px solid #000; 
    margin-top: 3mm;
  }
  .section-title {
    background: #c0c0c0;
    padding: 1.5mm 3mm;
    font-size: 9pt;
    font-weight: bold;
    border-bottom: 0.5px solid #000;
  }
  .section-body { padding: 2mm 3mm; }
  .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 3mm; }
  .section-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1mm 3mm; }
  
  /* Vehicle section */
  .vehicle-row { display: flex; border-bottom: 0.5px solid #ccc; }
  .vehicle-row:last-child { border-bottom: none; }
  .vehicle-cell { flex: 1; padding: 1mm 2mm; border-right: 0.5px solid #ccc; }
  .vehicle-cell:last-child { border-right: none; }
  
  /* Photo sections */
  .photos-row { display: flex; gap: 3mm; margin-top: 3mm; }
  .photo-section { flex: 1; border: 1.5px solid #000; }
  .photo-section.full { flex: none; width: 100%; }
  .photo-title {
    background: #c0c0c0;
    padding: 1.5mm 3mm;
    font-size: 9pt;
    font-weight: bold;
    border-bottom: 0.5px solid #000;
  }
  .photo-body { padding: 2mm; text-align: center; min-height: 85px; }
  .photo-body img { 
    max-width: 100%; 
    max-height: 130px; 
    object-fit: contain; 
  }
  .no-photo { 
    color: #999; 
    font-style: italic; 
    padding: 30px 0; 
  }
  
  /* Observations */
  .obs-text { font-size: 8pt; line-height: 1.4; text-align: justify; }
  
  /* Footer row */
  .footer-row { display: flex; gap: 3mm; margin-top: 3mm; }
  .footer-box { flex: 1; border: 1.5px solid #000; }
  .footer-title {
    background: #c0c0c0;
    padding: 1.5mm 3mm;
    font-size: 9pt;
    font-weight: bold;
    border-bottom: 0.5px solid #000;
  }
  .footer-body { padding: 3mm; min-height: 30px; }
  .expiry-date { font-size: 13pt; text-align: center; margin-top: 3mm; }

  /* QR Code */
  .qr-section { 
    margin-top: 3mm; 
    text-align: center; 
    font-size: 6pt; 
    color: #666; 
  }
  .qr-section svg { width: 60px; height: 60px; }
</style>
</head>
<body>
<div class="page">
  ${logoBase64 ? `<div class="watermark"><img src="${logoBase64}" /></div>` : ''}
  <div class="content">
    <!-- Header -->
    <div class="header">
      ${logoBase64 ? `<img src="${logoBase64}" class="header-logo" />` : ''}
      <div class="header-bar">
        ${companyName} - ${companyAddress} - Fone: ${companyPhone}
        <div class="header-title">
          LAUDO INSPEÇÃO TÉCNICA
          <span class="header-date">DATA: ${dataEmissaoFormatted}</span>
        </div>
      </div>
    </div>

    <!-- Cod Temporal / Ordem Serviço -->
    <div class="info-row">
      <div class="info-box">
        <div class="info-label">Cód. Temporal:</div>
        <div class="info-value">${fullLaudo.codTemporal || ''}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Ordem de Serviço N°:</div>
        <div class="info-value">${fullLaudo.ordemServico}</div>
      </div>
    </div>

    <!-- 1. Client Section -->
    <div class="section">
      <div class="section-title">1 - IDENTIFICAÇÃO DO CONTRATANTE</div>
      <div class="section-body">
        <div class="section-grid">
          <div><span class="info-label">Razão Social</span><br/>${fullLaudo.client.name}</div>
          <div><span class="info-label">CNPJ</span><br/>${fullLaudo.client.cnpj}</div>
          <div><span class="info-label">Endereço</span><br/>${[fullLaudo.client.addressStreet, fullLaudo.client.addressNumber, fullLaudo.client.addressDistrict].filter(Boolean).join(', ')}</div>
          <div><span class="info-label">Cidade/UF</span><br/>${[fullLaudo.client.addressCity, fullLaudo.client.addressState].filter(Boolean).join(' / ')}</div>
          <div><span class="info-label">CEP</span><br/>${fullLaudo.client.addressZip || ''}</div>
          <div><span class="info-label">Telefone</span><br/>${fullLaudo.client.phone || ''}</div>
        </div>
      </div>
    </div>

    <!-- 2. Vehicle Section -->
    <div class="section">
      <div class="section-title">2 - IDENTIFICAÇÃO DO VEÍCULO</div>
      <div class="section-body">
        <div class="vehicle-row">
          <div class="vehicle-cell"><span class="info-label">Espécie/Tipo</span><br/>${fullLaudo.vehicle.especieTipo || ''}</div>
          <div class="vehicle-cell"><span class="info-label">Marca/Modelo</span><br/>${fullLaudo.vehicle.marcaModelo || ''}</div>
          <div class="vehicle-cell"><span class="info-label">Nro. Chassi</span><br/>${fullLaudo.vehicle.numeroChassi || ''}</div>
          <div class="vehicle-cell"><span class="info-label">Placa</span><br/>${fullLaudo.vehicle.placa || ''}</div>
          <div class="vehicle-cell"><span class="info-label">Ano Fab./Modelo</span><br/>${fullLaudo.vehicle.anoFabricacaoModelo || ''}</div>
        </div>
        <div class="vehicle-row">
          <div class="vehicle-cell"><span class="info-label">Fabricante Equipamento</span><br/>${fullLaudo.fabricanteEquipamento || 'N.A'}</div>
          <div class="vehicle-cell"><span class="info-label">Mês/Ano Fabric.</span><br/>${fullLaudo.mesAnoFabricEquip || 'N.A'}</div>
          <div class="vehicle-cell"><span class="info-label">⌀ - Pino Rei</span><br/>${fullLaudo.diametroPinoRei || 'N.A'}</div>
          <div class="vehicle-cell"><span class="info-label">Data Verif. Pino Rei</span><br/>${dataVerifPinoReiFormatted}</div>
        </div>
      </div>
    </div>

    <!-- 3 & 4 - Photos Dianteira / Traseira -->
    <div class="photos-row">
      <div class="photo-section">
        <div class="photo-title">3 - FOTO DIANTEIRA</div>
        <div class="photo-body">
          ${fotoDianteiraBase64 ? `<img src="${fotoDianteiraBase64}" />` : '<div class="no-photo">Sem foto</div>'}
        </div>
      </div>
      <div class="photo-section">
        <div class="photo-title">4 - FOTO TRASEIRA</div>
        <div class="photo-body">
          ${fotoTraseiraBase64 ? `<img src="${fotoTraseiraBase64}" />` : '<div class="no-photo">Sem foto</div>'}
        </div>
      </div>
    </div>

    <!-- 5 - Photo Chassi -->
    <div class="photo-section full" style="margin-top: 3mm;">
      <div class="photo-title">5 - FOTO DO CHASSI</div>
      <div class="photo-body">
        ${fotoChassiBase64 ? `<img src="${fotoChassiBase64}" />` : '<div class="no-photo">Sem foto</div>'}
      </div>
    </div>

    <!-- 6 - Observations -->
    <div class="section" style="margin-top: 3mm;">
      <div class="section-title">6 - OBSERVAÇÕES</div>
      <div class="section-body">
        <div class="obs-text">${obsText.replace(/\n/g, '<br/>')}</div>
      </div>
    </div>

    <!-- 7 - Expiry + Signature -->
    <div class="footer-row">
      <div class="footer-box">
        <div class="footer-title">7 - DATA DE VENCIMENTO</div>
        <div class="footer-body">
          <div class="expiry-date">${fullLaudo.dataVencimento || ''}</div>
        </div>
      </div>
      <div class="footer-box">
        <div class="footer-title">ASSINATURA/CARIMBO TÉCNICO</div>
        <div class="footer-body"></div>
      </div>
    </div>

    <!-- QR Code -->
    ${qrCodeSvg ? `
    <div class="qr-section">
      ${qrCodeSvg}
      <div>Hash: ${documentHash.substring(0, 16)}...</div>
    </div>
    ` : ''}
  </div>
</div>
</body>
</html>`;
}

// Função para gerar PDF de laudo de checklist (código existente)
async function generateChecklistHTML(fullLaudo: Laudo & { client: Client; vehicle: Vehicle }, adminSettings: AdminSetting, qrCodeSvg: string = '', documentHash: string = '') {
  // Converter logo para base64 - filesystem-first (igual ao LIT)
  let logoBase64 = '';
  if (adminSettings.companyLogoUrl) {
    try {
      const logoUrl = adminSettings.companyLogoUrl.startsWith('http')
        ? adminSettings.companyLogoUrl
        : `http://localhost:3006${adminSettings.companyLogoUrl}`;

      const isLocalLogo = adminSettings.companyLogoUrl.startsWith('/uploads/') || adminSettings.companyLogoUrl.startsWith('/api/uploads/');
      if (isLocalLogo) {
        const pathModule = require('path');
        const fs = require('fs');
        const filename = adminSettings.companyLogoUrl.replace(/^\/(api\/)?uploads\//, '');
        const filePath = pathModule.join(process.cwd(), 'public', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          const logoBytes = fs.readFileSync(filePath);
          const ext = pathModule.extname(filename).toLowerCase();
          const logoType = ext === '.png' ? 'image/png' : 'image/jpeg';
          logoBase64 = `data:${logoType};base64,${logoBytes.toString('base64')}`;
          console.log('✅ Logo checklist carregado do filesystem:', filePath);
        }
      }

      if (!logoBase64) {
        const logoResponse = await fetch(logoUrl);
        if (logoResponse.ok) {
          const logoBytes = new Uint8Array(await logoResponse.arrayBuffer());
          const logoType = logoResponse.headers.get('content-type') || 'image/png';
          const logoBase64String = Buffer.from(logoBytes).toString('base64');
          logoBase64 = `data:${logoType};base64,${logoBase64String}`;
        }
      }
    } catch (e) {
      console.error('Erro ao converter logo para base64:', e);
    }
  }

  // Parse dos dados do checklist
  const observacoes = fullLaudo.observacoes || '';
  let checklistData: Record<string, string> = {};

  try {
    const checklistStart = observacoes.indexOf('--- DADOS CHECKLIST ---');
    if (checklistStart !== -1) {
      const jsonStart = observacoes.indexOf('{', checklistStart);
      if (jsonStart !== -1) {
        const jsonData = observacoes.substring(jsonStart);
        checklistData = JSON.parse(jsonData);
      }
    }
  } catch (e) {
    console.error('Erro ao parse dos dados do checklist:', e);
  }

  // Função helper para mapeamento
  const mapMedicaoValue = (value: string, defaultType: 'NA' | 'X' = 'NA') => {
    return value && value.trim() ? value : defaultType;
  };

  // LOG DETALHADO DAS URLS DAS IMAGENS DO BANCO
  console.log('🔍 DEBUG CHECKLIST - URLs das imagens do banco:', {
    fotoDianteiraUrl: fullLaudo.fotoDianteiraUrl,
    fotoTraseiraUrl: fullLaudo.fotoTraseiraUrl,
    fotoChassiUrl: fullLaudo.fotoChassiUrl,
    hasAnyImageUrl: !!(fullLaudo.fotoDianteiraUrl || fullLaudo.fotoTraseiraUrl || fullLaudo.fotoChassiUrl)
  });

  // Preparar URLs das imagens - converter para base64 se necessário
  const processImageUrl = async (url: string | null): Promise<string> => {
    console.log('🔄 processImageUrl chamada com:', url);
    if (!url || url.trim() === '') {
      console.log('❌ URL vazia ou null, retornando string vazia');
      return '';
    }

    try {
      // Se já é base64, retornar como está
      if (url.startsWith('data:')) {
        console.log('✅ URL já é base64, retornando como está');
        return url;
      }

      // Para uploads locais, ler diretamente do disco (mais confiável em produção/Docker)
      const isLocalUpload = url.startsWith('/uploads/') || url.startsWith('/api/uploads/');
      if (isLocalUpload) {
        const fs = require('fs');
        const pathModule = require('path');
        // Extract filename from either /uploads/filename or /api/uploads/filename
        const filename = url.replace(/^\/(api\/)?uploads\//, '');
        const filePath = pathModule.join(process.cwd(), 'public', 'uploads', filename);

        console.log('📁 Lendo imagem do disco:', filePath);

        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const ext = pathModule.extname(filename).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
          const base64String = fileBuffer.toString('base64');
          const result = `data:${mimeType};base64,${base64String}`;
          console.log('✅ Imagem lida do disco com sucesso, tamanho:', result.length);
          return result;
        } else {
          console.log('❌ Arquivo não encontrado no disco:', filePath);
        }
      }

      // Fallback: buscar via HTTP para URLs externas
      const imageUrl = url.startsWith('http')
        ? url
        : `http://localhost:3006${url}`;

      console.log('🌐 Tentando buscar imagem em:', imageUrl);

      const response = await fetch(imageUrl);
      console.log('📡 Response status:', response.status, 'OK:', response.ok);

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const base64String = Buffer.from(bytes).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        const result = `data:${mimeType};base64,${base64String}`;
        console.log('✅ Imagem convertida para base64 com sucesso, tamanho:', result.length);
        return result;
      } else {
        console.log('❌ Falha ao buscar imagem, status:', response.status);
      }
    } catch (e) {
      console.error('❌ Erro ao processar imagem:', e);
    }
    return '';
  };

  // Processar as 3 imagens do checklist
  console.log('🔄 Iniciando processamento das imagens...');
  const fotoDianteiraBase64 = await processImageUrl(fullLaudo.fotoDianteiraUrl);
  console.log('📷 Foto dianteira processada:', !!fotoDianteiraBase64);

  const fotoTraseiraBase64 = await processImageUrl(fullLaudo.fotoTraseiraUrl);
  console.log('📷 Foto traseira processada:', !!fotoTraseiraBase64);

  const fotoChassiBase64 = await processImageUrl(fullLaudo.fotoChassiUrl);
  console.log('📷 Foto chassi processada:', !!fotoChassiBase64);

  console.log('🖼️ Status final das imagens processadas:', {
    fotoDianteira: !!fotoDianteiraBase64,
    fotoTraseira: !!fotoTraseiraBase64,
    fotoChassi: !!fotoChassiBase64,
    willShowImageSection: !!(fotoDianteiraBase64 || fotoTraseiraBase64 || fotoChassiBase64)
  });

  // SVG do pneu base64
  const pneuSvgBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIENpcmN1bG8gZXh0ZXJubyBkbyBwbmV1IC0tPgogIDxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjI4IiBmaWxsPSIjMWExYTFhIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPgogIDwhLS0gQ2lyY3VsbyBpbnRlcm5vIC0tPgogIDxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjIyIiBmaWxsPSIjMmEyYTJhIiBzdHJva2U9IiM0NDQiIHN0cm9rZS13aWR0aD0iMSIvPgogIDwhLS0gUGFkcsOjbyBkZSBzdWxjb3MgZG8gcG5ldSAtLT4KICA8ZyBzdHJva2U9IiM1NTUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSI+CiAgICA8cGF0aCBkPSJNIDEwIDMwIFEgMzAgMjAgNTAgMzAiLz4KICAgIDxwYXRoIGQ9Ik0gMTAgMzAgUSAzMCA0MCA1MCAzMCIvPgogICAgPHBhdGggZD0iTSAzMCA4IFEgMjAgMzAgMzAgNTIiLz4KICAgIDxwYXRoIGQ9Ik0gMzAgOCBRIDQwIDMwIDMwIDUyIi8+CiAgPC9nPgogIDwhLS0gQ2VudHJvIGRvIHBuZXUgLS0+CiAgPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTUiIGZpbGw9IiMzMzMiIHN0cm9rZT0iIzU1NSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==';

  // Funções helper para renderização
  const renderField = (label: string, field: string) => {
    const value = checklistData[field] || '';
    const okActive = value === 'OK' ? 'chip-active chip-ok' : 'chip-inactive';
    const nokActive = value === 'NOK' ? 'chip-active chip-nok' : 'chip-inactive';
    const naActive = value === 'NA' ? 'chip-active chip-na' : 'chip-inactive';
    return `
      <div class="field-row">
        <span class="field-label">${label}</span>
        <span class="chip-group">
          <span class="chip ${okActive}">✓</span>
          <span class="chip ${nokActive}">✗</span>
          <span class="chip ${naActive}">N.A</span>
        </span>
      </div>
    `;
  };

  const renderTextField = (label: string, field: string, defaultValue = '') => {
    const value = checklistData[field] || defaultValue;
    return `
      <div class="field-text">
        <span class="label">${label}:</span>
        <span class="value">${value}</span>
      </div>
    `;
  };

  // Gerar HTML completo com TODAS as seções de checklist
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laudo CHECKLIST - ${fullLaudo.ordemServico}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.1;
            color: #000;
            background: white;
            padding: 0px;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }
        
        .page {
            width: 100%;
            max-width: 200mm;
            margin: 0 auto;
            padding: 2mm;
            box-sizing: border-box;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2px;
            border-bottom: 1px solid #000;
            padding-bottom: 1px;
            position: relative;
        }
        
        .company-header {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 6px;
            margin-bottom: 1.5px;
        }
        
        .header-logo {
            max-height: 50px;
            max-width: 130px;
            object-fit: contain;
        }
        
        .company-info {
            font-size: 8px;
            margin-bottom: 1px;
        }
        
        .title {
            font-size: 11px;
            font-weight: bold;
            margin: 1px 0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1px;
            margin-bottom: 2px;
        }
        
        .info-box {
            border: 0.5px solid #000;
            padding: 1.5px;
            font-size: 8px;
        }
        
        .client-vehicle-section {
            border: 0.5px solid #000;
            margin-bottom: 2px;
            padding: 2px;
        }
        
        .section-header {
            font-weight: bold;
            font-size: 11px;
            background: #f0f0f0;
            padding: 1.5px;
            margin-bottom: 2px;
        }

        /* LAYOUT DE 3 COLUNAS OTIMIZADO */
        .items-container {
            border: 0.5px solid #000;
            padding: 2px;
        }
        
        .items-title {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 2px;
            border-bottom: 0.5px solid #000;
            padding-bottom: 1px;
        }
        
        .items-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1px;
            font-size: 10px;
        }
        
        .column {
            border: 0.5px solid #ccc;
            padding: 3px;
        }

        /* NOVO LAYOUT: cada field é uma linha label+chips alinhada à direita */
        .field-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 4px;
            padding: 1px 2px;
            font-size: 9px;
            line-height: 1.2;
            border-bottom: 0.3px dotted #ddd;
        }
        .field-row:last-child { border-bottom: none; }

        .field-label {
            flex: 1 1 auto;
            font-size: 9px;
            line-height: 1.15;
            padding-right: 2px;
        }

        .chip-group {
            flex: 0 0 auto;
            display: inline-flex;
            gap: 2px;
            white-space: nowrap;
        }

        .chip {
            display: inline-block;
            min-width: 14px;
            height: 11px;
            line-height: 11px;
            font-size: 8px;
            font-weight: bold;
            text-align: center;
            padding: 0 3px;
            border: 0.5px solid #999;
            border-radius: 2px;
            color: #999;
            background: #fff;
        }
        .chip-active.chip-ok  { background: #2ea84a; color: #fff; border-color: #1e7a32; }
        .chip-active.chip-nok { background: #d62828; color: #fff; border-color: #8a1a1a; }
        .chip-active.chip-na  { background: #555;    color: #fff; border-color: #333;    }
        .chip-inactive { color: #c0c0c0; border-color: #d8d8d8; }

        .field-text {
            display: flex;
            justify-content: space-between;
            gap: 4px;
            padding: 1px 2px;
            font-size: 9px;
            line-height: 1.2;
            border-bottom: 0.3px dotted #ddd;
        }
        .field-text .label,
        .field-text > span:first-child {
            flex: 1 1 auto;
            font-size: 9px;
        }
        .field-text .value {
            flex: 0 0 auto;
            font-weight: bold;
            font-size: 9px;
            color: #000;
        }
        
        .subsection-title {
            font-weight: bold;
            font-size: 10px;
            text-decoration: underline;
            margin: 1px 0 1px 0;
            line-height: 1.1;
        }
        
        /* MEDIÇÃO DOS PNEUS - COMPACTA PARA PÁGINA Única */
        .measurement-section {
          border: 0.5px solid #000;
          margin: 2px 0;
          padding: 2px;
          font-size: 8px;
          background: #f8f8f8;
        }

        .measurement-title {
          text-align: center;
          font-weight: bold;
          font-size: 10px;
          margin-bottom: 2px;
          border-bottom: 1px solid #000;
          padding-bottom: 1px;
          color: #000;
        }

        /* TABELA DE PNEUS - largura fixa por coluna, legível */
        .tire-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          table-layout: fixed;
        }
        .tire-table th, .tire-table td {
          border: 0.5px solid #555;
          text-align: center;
          padding: 4px 4px;
          line-height: 1.3;
          word-break: keep-all;
        }
        .tire-table th {
          background: #d0d0d0;
          font-weight: bold;
          font-size: 9px;
        }
        .tire-table .subhead {
          background: #ececec;
          font-weight: 600;
          font-size: 8px;
        }
        .tire-table .row-label {
          background: #e8e8e8;
          font-weight: bold;
          font-size: 9px;
          width: 36px;
        }
        .tire-table .tire-cell {
          background: white;
          font-size: 10px;
          font-weight: bold;
          min-width: 38px;
        }
        .tire-cell.na { color: #666; }
        .tire-cell.nao { color: #c00; }

        .measurement-footer-compact {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-top: 3px;
          font-size: 9px;
          padding: 3px;
          background: #f0f0f0;
          border: 0.5px solid #ccc;
        }
        
        /* SEÇÃO FINAL UNIFICADA - LAYOUT 2 COLUNAS EXPANDIDA */
        .final-unified-section {
            border: 1px solid #000;
            margin: 3px 0;
            padding: 4px;
            min-height: 40px;
            background: #f8f8f8;
        }
        
        .final-grid-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            height: 100%;
        }
        
        .left-column, .right-column {
            padding: 3px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            border: 1px solid #ccc;
            background: white;
            border-radius: 2px;
        }
        
        .section-block {
            flex: 1;
            min-height: 15px;
        }
        
        .section-subtitle {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 2px;
            border-bottom: 1px solid #333;
            padding-bottom: 1px;
            text-align: center;
            color: #000;
        }
        
        .section-content {
            font-size: 7px;
            line-height: 1.2;
            color: #333;
        }
        
        /* SISTEMA DE MARCA D'ÁGUA IGUAL AO LIT - 3 LOGOS */
        .logo-watermark-main {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.08;
            z-index: -1;
            pointer-events: none;
            width: 500px;
            height: 200px;
        }
        
        .logo-watermark-secondary {
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.06;
            z-index: -2;
            pointer-events: none;
            width: 300px;
            height: 120px;
        }
        
        .logo-watermark-tertiary {
            position: fixed;
            bottom: 15%;
            right: 10%;
            opacity: 0.05;
            z-index: -3;
            pointer-events: none;
            width: 200px;
            height: 80px;
        }
        
        .logo-watermark-main img,
        .logo-watermark-secondary img,
        .logo-watermark-tertiary img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: grayscale(100%);
        }
        
        /* QUEBRA DE PÁGINA: mantém linhas/blocos íntegros, permite fluir para a 2ª página */
        .field-row, .field-text, .chip-group, tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
        }
        .page-2-break {
            page-break-before: always !important;
            break-before: page !important;
        }
        
        .page {
            page-break-after: avoid !important;
            break-after: avoid !important;
        }
        
        @media print {
            body {
                padding: 0 !important;
                margin: 0 !important;
                display: flex !important;
                justify-content: center !important;
            }
            .page {
                margin: 0 auto !important;
                width: 100% !important;
                max-width: 200mm !important;
                padding: 2mm !important;
            }
            .field-row, .field-text, .chip-group, tr {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            .measurement-section,
            .final-unified-section {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            .page-2-break {
                page-break-before: always !important;
                break-before: page !important;
            }
            /* MARCA D'ÁGUA PARA IMPRESSÃO - PADRÃO LIT */
            .logo-watermark-main {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                opacity: 0.08 !important;
                z-index: -1 !important;
                pointer-events: none !important;
                width: 500px !important;
                height: 200px !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .logo-watermark-secondary {
                position: fixed !important;
                top: 30% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                opacity: 0.06 !important;
                z-index: -2 !important;
                pointer-events: none !important;
                width: 300px !important;
                height: 120px !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .logo-watermark-tertiary {
                position: fixed !important;
                bottom: 15% !important;
                right: 10% !important;
                opacity: 0.05 !important;
                z-index: -3 !important;
                pointer-events: none !important;
                width: 200px !important;
                height: 80px !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .logo-watermark-main img,
            .logo-watermark-secondary img,
            .logo-watermark-tertiary img {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain !important;
                filter: grayscale(100%) !important;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        
        <div class="header">
            ${logoBase64 ? `
                <div class="company-header">
                    <img src="${logoBase64}" alt="Logo" class="header-logo">
                    <div class="company-info">
                        EMPRESA EXEMPLO INSPEÇÕES LTDA - Rua Exemplo 100 - Cidade Exemplo /RS - Fone: (11) 90000-0000
                    </div>
                </div>
            ` : `
                <div class="company-info" style="text-align: center; margin-bottom: 2px;">
                    EMPRESA EXEMPLO INSPEÇÕES LTDA - Rua Exemplo 100 - Cidade Exemplo /RS - Fone: (11) 90000-0000
                </div>
            `}
            <div class="title">Laudo CHECKLIST - Relatório de Preventiva</div>
            <div style="font-size: 6px;">DATA: ${format(new Date(fullLaudo.dataEmissao || new Date()), 'dd/MM/yyyy')}</div>
            ${checklistData.validade ? `<div style="font-size: 6px;">VALIDADE: ${format(new Date(checklistData.validade), 'dd/MM/yyyy')}</div>` : ''}
        </div>

        <div class="info-grid">
            <div class="info-box">
                <strong>Cód. Temporal:</strong> ${fullLaudo.codTemporal || ''}
            </div>
            <div class="info-box">
                <strong>Ordem de Serviço N°:</strong> ${fullLaudo.ordemServico}
            </div>
            ${checklistData.validade ? `<div class="info-box">
                <strong>Validade:</strong> ${format(new Date(checklistData.validade), 'dd/MM/yyyy')}
            </div>` : ''}
        </div>

        <div class="client-vehicle-section">
            <div class="section-header">1 - CLIENTE</div>
            <div style="font-size: 9px; line-height: 1.3;">
                <strong>${fullLaudo.client.name || ''}</strong><br>
                <strong>CNPJ/CPF:</strong> ${fullLaudo.client.cnpj || ''}<br>
                <strong>Endereço:</strong> ${fullLaudo.client.addressStreet || ''}, ${fullLaudo.client.addressNumber || ''}
            </div>
        </div>

        <div class="client-vehicle-section">
            <div class="section-header">2 - VEÍCULO</div>
            <div style="font-size: 9px; line-height: 1.3;">
                <strong>Marca/Modelo:</strong> ${fullLaudo.vehicle.marcaModelo || ''} |
                <strong>Chassi:</strong> ${fullLaudo.vehicle.numeroChassi || ''} |
                <strong>Placa:</strong> ${fullLaudo.vehicle.placa || ''} |
                <strong>Ano:</strong> ${fullLaudo.vehicle.anoFabricacaoModelo || ''}
            </div>
        </div>

        <div class="items-container">
            <div class="items-title">ITENS INSPECIONADOS</div>
            
            <div class="items-grid">
                <!-- COLUNA 1: Estrutura Física -->
                <div class="column">
                    <div class="subsection-title">Cabina</div>
                    ${renderField('Estado Geral', 'cabina_estadoGeral')}
                    ${renderField('Estado Degraus de Acesso', 'cabina_estadoDegraus')}
                    ${renderField('Portas', 'cabina_portas')}
                    ${renderField('Integridade e Funcionamento', 'cabina_integridadeFuncionamento')}
                    
                    <div class="subsection-title">Bancos</div>
                    ${renderField('Estado Geral', 'cabina_bancosEstadoGeral')}
                    ${renderField('Fixação', 'cabina_bancosFixacao')}
                    
                    <div class="subsection-title">Equipamentos de Segurança</div>
                    ${renderField('Cinto de Segurança', 'seguranca_cintoSeguranca')}
                    ${renderField('Extintor de Incêndio da Cabine', 'seguranca_extintorCabine')}
                    ${renderField('Extintor de Incêndio do Tanque', 'seguranca_extintorTanque')}
                    ${renderField('Triângulo', 'seguranca_triangulo')}
                    ${renderField('Integridade dos Espelhos Retrov.', 'seguranca_espelhosRetrovisores')}
                    
                    <div class="subsection-title">Pedais de Embreagem e Freio</div>
                    ${renderField('Operacionalidade', 'pedais_embragemFreio')}
                    ${renderField('Superfície de Pisomante', 'pedais_superficiePisomante')}
                    ${renderField('Trincas', 'pedais_trincas')}
                    
                    <div class="subsection-title">Para-Brisa</div>
                    ${renderField('Integridade, Visibilidade', 'paraBrisa_integridadeVisibilidade')}
                    ${renderField('Trincas', 'paraBrisa_trincas')}
                    
                    <div class="subsection-title">Para-Sol</div>
                    ${renderField('Integridade, Fixação, Estado', 'paraSol_integridadeFixacao')}
                    
                    <div class="subsection-title">Reservatório de Combustível</div>
                    ${renderField('Integridade, Fixação, Tubulação', 'reservatorio_integridadeFixacao')}
                    ${renderField('Vazamento', 'reservatorio_vazamento')}
                    ${renderField('Material', 'reservatorio_material')}
                    ${renderField('Reservatório de Comb. Suplementar', 'reservatorio_suplementar')}
                </div>

                <!-- COLUNA 2: Sistemas Mecânicos -->
                <div class="column">
                    <div class="subsection-title">Conjunto Motor/Caixa de Mudanças</div>
                    ${renderField('Ancoragem', 'motor_ancoragem')}
                    ${renderField('Proteção do Motor', 'motor_protecao')}
                    ${renderField('Sistema de Direção', 'motor_sistemaOperacao')}
                    ${renderField('Funcionamento, Folgas, Soldas', 'motor_funcionamentoFolgas')}
                    ${renderField('Óleo Hidraul., Vazamentos, Tubulação', 'motor_oleoHidraulico')}
                    ${renderField('Alinhamento de Direção', 'motor_alinhamentoDirecao')}
                    ${renderField('Transmissão', 'motor_transmissao')}
                    ${renderField('Eixo Cardã, Integridade, Cinta', 'motor_eixoCarda')}
                    ${renderField('Cruzetas e Mancais', 'motor_cruzetasMancais')}
                    
                    <div class="subsection-title">Sistema de Escapamento</div>
                    ${renderField('Integridade', 'motor_sistemaEscapamento')}
                    ${renderField('Silenciosos (Produtos da Classe 3)', 'motor_integridade')}
                    ${renderField('Contra de Segurança (Proteção Classe A)', 'motor_contraSeguranca')}
                    
                    <div class="subsection-title">Chassi</div>
                    ${renderField('Estacionamento, Freios, Reparo', 'motor_estacionamento')}
                    ${renderField('Proteção Pino do Arlinhão, do Chassi', 'motor_protecaoPino')}
                    ${renderField('Limite de Operacidade', 'motor_limiteOperacidade')}
                    ${renderField('Chassi', 'motor_chassi')}
                    ${renderField('Estado da Articulação, Configuração', 'motor_estadoArticulacao')}
                    ${renderField('Rastreamento', 'motor_rastreamento')}
                    ${renderField('Posição de Fixação', 'motor_posicaoFixacao')}
                    
                    <div class="subsection-title">Sistema de Iluminação</div>
                    ${renderField('Farol Principal', 'iluminacao_farolPrincipal')}
                    ${renderField('Farol Penetrador', 'iluminacao_farolPenetrador')}
                    ${renderField('Lanterna da Placa', 'iluminacao_lanternaPlaca')}
                    ${renderField('Sistema de Sinalização', 'iluminacao_sinalizacao')}
                    ${renderField('Lanterna de Freio', 'iluminacao_lanternaFreio')}
                    ${renderField('Retrorefletores', 'iluminacao_retrorefletores')}
                    ${renderField('Delimitadoras Dianteira', 'iluminacao_delimitadoraDianteira')}
                    ${renderField('Delimitadoras Traseira', 'iluminacao_delimitadoraTraseira')}
                    ${renderField('Direção Dianteira', 'iluminacao_direcaoDianteira')}
                    ${renderField('Direção Traseira', 'iluminacao_direcaoTraseira')}
                    ${renderField('Intermitente Direção', 'iluminacao_intermitenteDirecao')}
                    ${renderField('Intermitente Advertência', 'iluminacao_intermitenteAdvertencia')}
                    ${renderField('Luz Marcha-à-Ré', 'iluminacao_marchaRe')}
                    ${renderField('Luz de Identificação', 'iluminacao_identificacao')}
                    ${renderField('Luz de Emergência', 'iluminacao_emergencia')}
                    ${renderField('Farol de Neblina', 'iluminacao_farolNeblina')}
                    ${renderField('Lanterna de Luz/Cor Branca', 'iluminacao_lanternaLuz')}
                    ${renderField('Lanterna Delimitadora', 'iluminacao_lanternaDelimitadora')}
                    ${renderField('Lanterna Indicadora de Direção', 'iluminacao_lanternaIndicadora')}
                    ${renderField('Lanterna Indic. Direção Lateral', 'iluminacao_lanternaIndicadoraLateral')}
                    ${renderField('Lanterna de Advertência', 'iluminacao_lanternaAdvertencia')}
                    ${renderField('Lanternas Laterais', 'iluminacao_lanternaLaterais')}
                    ${renderField('Lanterna Lateral à Ré', 'iluminacao_lanternaLateralRe')}
                    ${renderField('Lanterna de Neblina Traseira', 'iluminacao_lanternaNeblina')}
                    ${renderField('Lanterna de Projeção', 'iluminacao_lanternaProjecao')}
                </div>

                <!-- COLUNA 3: Eixos, Suspensão, Rodas, Pneus e Sistemas Especiais -->
                <div class="column">
                    <div class="subsection-title">Eixos</div>
                    ${renderField('Trincas ou Soldas Observáveis', 'eixos_trincasSoldas')}
                    ${renderField('Integridade do Eixo Direcional', 'eixos_integridadeDirecional')}
                    ${renderField('Mecanismo de Elevação do Eixo', 'eixos_mecanismoElevacao')}
                    ${renderField('Integridade e Operacionalidade', 'eixos_integridadeOperacionalidade')}
                    
                    <div class="subsection-title">Suspensão</div>
                    ${renderField('Amortecedor', 'suspensao_amortecedor')}
                    ${renderField('Balancins', 'suspensao_balancins')}
                    ${renderField('Barra Estabilizadora', 'suspensao_barraEstabilizadora')}
                    ${renderField('Feixes de Molas', 'suspensao_feixesMolas')}
                    ${renderField('Braço Tensor', 'suspensao_bracoTensor')}
                    
                    <div class="subsection-title">Suspensão Pneumática</div>
                    ${renderField('Integridade e Vazamentos', 'suspensao_pneumaticaMangueiras')}
                    
                    <div class="subsection-title">Rodas</div>
                    ${renderField('Elementos de Fixação', 'rodas_elementosFixacao')}
                    ${renderField('Integridade dos Aros e Rodas', 'rodas_integridadeAros')}
                    ${renderField('Existência e Estado de Elementos', 'rodas_existenciaEstado')}
                    ${renderField('Integridade dos Anéis de Fixação', 'rodas_integridadeAneis')}
                    ${renderField('Estado dos Rolos, Substâncias', 'rodas_estadoRolos')}
                    
                    <div class="subsection-title">Pneus</div>
                    ${renderField('Pneu Dianteiro (Recondição)', 'pneus_dianteiro')}
                    ${renderTextField('Sulcos (Profund.m.m.)', 'pneus_sulcosProfundidade', '12.2')}
                    ${renderField('Paridade de Pneus no Mesmo Eixo', 'pneus_paridadeMesmoEixo')}
                    ${renderField('Flancos (Raspos ou Cortes)', 'pneus_flancos')}
                    ${renderField('Banda Rodagem (Raspos, Cortes)', 'pneus_bandaRodagem')}
                    ${renderTextField('Pneu Sobresalente m.m.', 'pneus_sobresalente', '5.8')}
                    
                    <div class="subsection-title">Sistema de Freio</div>
                    ${renderField('Freio Estacionamento', 'freio_estacionamento')}
                    ${renderField('Freio de Serviço', 'freio_servico')}
                    ${renderField('Estado Compressor', 'freio_estadoCompressor')}
                    ${renderField('Correias Compressor', 'freio_correiasCompressor')}
                    ${renderField('Fixação/Conexões', 'freio_fixacaoConexoes')}
                    ${renderField('Vazamentos', 'freio_vazamentos')}
                    ${renderField('Lonas de Freio', 'freio_lonasFreio')}
                    ${renderField('Condição das Lonas', 'freio_condicaoLonas')}
                    ${renderField('Fixação da Lona', 'freio_fixacaoLona')}
                    ${renderField('Espessura das Lonas', 'freio_espessuraLonas')}
                    ${renderField('Indicador Pressão', 'freio_indicadorPressao')}
                    <div class="subsection-title">Reservatório de Ar</div>
                    ${renderField('Integridade', 'reservatorioAr_integridade')}
                    ${renderField('Fixação', 'reservatorioAr_fixacao')}
                    ${renderField('Vazamentos', 'reservatorioAr_vazamentos')}
                    ${renderField('Válvulas', 'reservatorioAr_valvulas')}
                    ${renderTextField('Pressão Op.', 'reservatorioAr_pressaoOperacional')}
                    ${renderField('Sistema de Dreno', 'reservatorioAr_dreno')}
                </div>
            </div>
        </div>

        <!-- NOVA SEÇÃO: COMPRESSOR DE AR EXPANDIDA -->
        <div style="margin: 2px 0; font-size: 6px; border: 0.5px solid #000; padding: 2px;">
            <div class="subsection-title" style="text-align: center; font-weight: bold; margin-bottom: 1px;">Compressor de ar</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;">
                ${renderTextField('Tempo Recuperação Compressor (seg)', 'compressor_tempoRecuperacao', '29 S')}
                ${renderTextField('Pressão Inicial (Bar)', 'compressor_pressaoInicial', '9')}
                ${renderTextField('Pressão Final (Bar)', 'compressor_pressaoFinal', '8')}
                ${renderTextField('Perda ar %', 'compressor_perdaAr', '11.1%')}
            </div>
        </div>

        <!-- ===== PÁGINA 2: SISTEMAS ELÉTRICOS E SEÇÕES ESPECIAIS ===== -->
        <div class="items-container page-2-break" style="margin-top: 2px;">
            <div class="items-title">ITENS INSPECIONADOS (continuação)</div>
            <div class="items-grid">
                <!-- COLUNA A: Elétricos e instrumentos -->
                <div class="column">
                    <div class="subsection-title">Bateria Elétrica</div>
                    ${renderField('Integridade e Fixação', 'bateria_integridadeFixacao')}
                    ${renderField('Alteração da Proteção', 'bateria_alteracaoProtecao')}

                    <div class="subsection-title">Cronotacógrafo</div>
                    ${renderField('Laces', 'cronografo_laces')}
                    ${renderField('Funcionamento, Ligação Elétrica', 'cronografo_funcionamento')}

                    <div class="subsection-title">Buzina Elétrica</div>
                    ${renderField('Existência e Funcionamento', 'buzina_existenciaFuncionamento')}

                    <div class="subsection-title">Instalação Elétrica</div>
                    ${renderField('Estado dos Cabos Elétrica', 'eletrica_estadoCabosEletrica')}
                    ${renderField('Isolamento da Fiação', 'eletrica_isolamento')}

                    <div class="subsection-title">Limpador de Para-Brisa</div>
                    ${renderField('Operacionalidade', 'limpador_operacionalidade')}
                    ${renderField('Integridade e Operacionalidade', 'limpador_integridadeOperacionalidade')}
                </div>

                <!-- COLUNA B: Comunicação, alarme, para-choque, refletivos -->
                <div class="column">
                    <div class="subsection-title">Sistema de Comunicação e Elétricos</div>
                    ${renderField('Retrorefletores', 'comunicacao_retrorefletores')}
                    ${renderField('Bateria: Integridade', 'eletricos_bateriaIntegridade')}
                    ${renderField('Fiação: Integridade', 'eletricos_fiacaoIntegridade')}
                    ${renderField('Fiação: Fixação', 'eletricos_fiacaoFixacao')}
                    ${renderTextField('Largura', 'eletricos_largura')}
                    ${renderField('Funcionamento', 'eletricos_funcionamento')}
                    ${renderField('Ligação Elétrica', 'eletricos_ligacaoEletrica')}
                    ${renderField('Estado da Fiação Elétrica', 'eletricos_estadoFiacao')}

                    <div class="subsection-title">Sistema de Alarme de Ré</div>
                    ${renderField('Funcionamento', 'alarmeRe_funcionamento')}
                    ${renderField('Estado da Fiação Elétrica', 'alarmeRe_estadoFiacao')}

                    <div class="subsection-title">Para-Choque Traseiro</div>
                    ${renderField('Listas (Zebradas)', 'paraChoque_listas')}
                    ${renderField('Furos', 'paraChoque_furos')}
                    ${renderField('Integridade', 'paraChoque_integridade')}
                    ${renderField('Visibilidade da Placa', 'paraChoque_visibilidadePlaca')}

                    <div class="subsection-title">Para-Lama</div>
                    ${renderField('Integridade', 'paraLama_integridade')}

                    <div class="subsection-title">Dispositivos Refletivos de Segurança</div>
                    ${renderField('Existência', 'refletivos_existencia')}
                    ${renderField('Integridade', 'refletivos_integridade')}
                    ${renderField('Conservação', 'refletivos_conservacao')}
                </div>

                <!-- COLUNA C: Contêiner, dolly, semi-reboque, quinta-roda, pino-rei, engate -->
                <div class="column">
                    <div class="subsection-title">Veículo Chassi Porta-Contêiner</div>
                    ${renderField('Atendimento à Res. Contran 725/18', 'chassiContainer_atendimentoRes725')}
                    ${renderField('Dispositivos de Fixação Operacionais', 'chassiContainer_dispositivosFixacao')}

                    <div class="subsection-title">Dolly</div>
                    ${renderField('Estado do Câmbio', 'dolly_estadoCambio')}

                    <div class="subsection-title">Pinos de Ação do Semi-Reboque</div>
                    ${renderField('Integridade', 'pinosSemi_integridade')}
                    ${renderField('Operacionalidade', 'pinosSemi_operacionalidade')}
                    ${renderField('Vazamentos', 'pinosSemi_vazamentos')}
                    ${renderField('Fixação', 'pinosSemi_fixacao')}

                    <div class="subsection-title">Quinta-Roda</div>
                    ${renderField('Integridade', 'quintaRoda_integridade')}
                    ${renderField('Fixação', 'quintaRoda_fixacao')}
                    ${renderField('Estado dos Apoios', 'quintaRoda_estadoApoios')}
                    ${renderField('Funcionamento Mecânico do Engate', 'quintaRoda_funcionamentoEngate')}

                    <div class="subsection-title">Pino-Rei</div>
                    ${renderField('Fixação Vertical à Mesa', 'pinoRei_fixacaoVertical')}
                    ${renderTextField('Diâmetro em mm', 'pinoRei_diametroMm')}
                    ${renderField('Trincas Observáveis', 'pinoRei_trincas')}
                    ${renderField('Deformado', 'pinoRei_deformado')}
                    ${renderField('Recuperado por Solda', 'pinoRei_recuperadoSolda')}

                    <div class="subsection-title">Conjunto de Engate</div>
                    ${renderField('Estado da Rótula', 'engate_estadoRotula')}
                    ${renderField('Trava de Segurança', 'engate_travaSeguranca')}
                    ${renderField('Integridade dos Pinos', 'engate_integridadePinos')}
                    ${renderField('Trava dos Pinos', 'engate_travaPinos')}
                </div>
            </div>
        </div>

        <!-- (seções especiais e campos de texto movidos para o container da página 2 acima) -->

        <!-- MEDIÇÃO DOS PNEUS - TABELA COMPACTA DE TEXTO -->
        <div class="measurement-section">
          <div class="measurement-title">Medição dos Pneus</div>
          <table class="tire-table">
            <thead>
              <tr>
                <th class="row-label" rowspan="2">EIXO</th>
                <th colspan="2">ESQUERDA</th>
                <th colspan="2">DIREITA</th>
              </tr>
              <tr>
                <th class="subhead">EXT</th>
                <th class="subhead">INT</th>
                <th class="subhead">INT</th>
                <th class="subhead">EXT</th>
              </tr>
            </thead>
            <tbody>
              <!-- D1 - Dianteiro único -->
              <tr>
                <td class="row-label">D1</td>
                <td class="tire-cell" colspan="2">${mapMedicaoValue(checklistData.medicao_linha1_esquerdo)}</td>
                <td class="tire-cell" colspan="2">${mapMedicaoValue(checklistData.medicao_linha1_direito)}</td>
              </tr>
              <!-- D2 - Dianteiro duplo (par) -->
              <tr>
                <td class="row-label">D2</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha2_esquerdo1)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha2_esquerdo2)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha2_direito1)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha2_direito2)}</td>
              </tr>
              <!-- T1 - Traseiro par -->
              <tr>
                <td class="row-label">T1</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha3_esquerdo1)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha3_esquerdo2)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha3_direito1)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha3_direito2)}</td>
              </tr>
              <!-- T2 - Traseiro par -->
              <tr>
                <td class="row-label">T2</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha4_esquerdo1)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha4_esquerdo2)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha4_direito1)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha4_direito2)}</td>
              </tr>
              <!-- T3 - Traseiro par -->
              <tr>
                <td class="row-label">T3</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha5_esquerdo1)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha5_esquerdo2)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha5_direito1)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha5_direito2)}</td>
              </tr>
              <!-- D3 - Dianteiro 3 (par) -->
              <tr>
                <td class="row-label">D3</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha6_esquerdo1)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha6_esquerdo2)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha6_direito1)}</td>
                <td class="tire-cell">${mapMedicaoValue(checklistData.medicao_linha6_direito2)}</td>
              </tr>
            </tbody>
          </table>
          <!-- Info compacta inline -->
          <div class="measurement-footer-compact">
            <span><strong>Modelo:</strong> ${checklistData.medicao_modelo || '275/80 R 22.5'}</span> |
            <span><strong>Tipo:</strong> ${checklistData.medicao_tipo || 'LISO'}</span> |
            <span><strong>Estado:</strong> ${checklistData.medicao_estadoGeral || 'Bom'}</span>
          </div>
        </div>

        <!-- SEÇÃO FINAL UNIFICADA - 2 COLUNAS EXPANDIDA -->
        <div class="final-unified-section">
            <div class="final-grid-2col">
                <div class="left-column">
                    <div class="section-block">
                        <div class="section-subtitle">Observações</div>
                        <div class="section-content">
                            ${observacoes.split('--- DADOS CHECKLIST ---')[0] || observacoes || 'Nenhuma observação específica.'}<br>
                            <strong>Normas Aplicáveis:</strong> Portaria nº457/08, POP-OP001/0418
                        </div>
                    </div>
                </div>
                <div class="right-column">
                    <div class="section-block">
                        <div class="section-subtitle">RESULTADO INSPEÇÃO</div>
                        <div class="section-content">
                            <strong>Marcação:</strong> ✓ Aprovado | R Reprovado | ✗ Não Aplicável<br>
                            <strong>APROVADO APÓS REINSPEÇÃO EM:</strong> _______________
                        </div>
                    </div>
                    <div class="section-block">
                        <div class="section-subtitle">Inspetor Emissor</div>
                        <div class="section-content">
                            _________________________________<br>
                            Nome: ______________________________<br>
                            Assinatura: _________________________
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- SEÇÃO DE REGISTRO FOTOGRÁFICO - ADICIONADA -->
        ${(fotoDianteiraBase64 || fotoTraseiraBase64 || fotoChassiBase64) ? `
        <div style="margin: 2px 0; border: 0.5px solid #000; padding: 2px;">
            <div class="section-header" style="text-align: center; font-weight: bold; font-size: 10px; margin-bottom: 2px; border-bottom: 1px solid #000; padding-bottom: 1px;">
                Registro Fotográfico
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; text-align: center;">
                ${fotoDianteiraBase64 ? `
                <div>
                    <div style="font-size: 8px; font-weight: bold; margin-bottom: 1px;">Foto Dianteira</div>
                    <img src="${fotoDianteiraBase64}" style="max-width: 100%; max-height: 120px; object-fit: contain; border: 1px solid #ccc;" />
                </div>
                ` : ''}
                ${fotoTraseiraBase64 ? `
                <div>
                    <div style="font-size: 8px; font-weight: bold; margin-bottom: 1px;">Foto Traseira</div>
                    <img src="${fotoTraseiraBase64}" style="max-width: 100%; max-height: 120px; object-fit: contain; border: 1px solid #ccc;" />
                </div>
                ` : ''}
                ${fotoChassiBase64 ? `
                <div>
                    <div style="font-size: 8px; font-weight: bold; margin-bottom: 1px;">Foto Chassi</div>
                    <img src="${fotoChassiBase64}" style="max-width: 100%; max-height: 120px; object-fit: contain; border: 1px solid #ccc;" />
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; padding: 5px 6px; border-top: 0.5px solid #ccc; gap: 8px;">
            <div style="flex: 1; line-height: 1.35;">
                <div style="font-size: 8px; color: #444; margin-bottom: 2px;">Documento gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')} - Sistema GTS</div>
                <div style="font-size: 7px; color: #555; font-family: monospace; word-break: break-all;">${documentHash ? `SHA-256: ${documentHash.substring(0, 40)}...` : ''}</div>
                <div style="font-size: 7px; color: #444; margin-top: 2px;">${documentHash ? `Verifique autenticidade em: generalinspetor.terpens.com.br/verificar/${documentHash}` : ''}</div>
            </div>
            ${qrCodeSvg ? `<div style="width: 64px; height: 64px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <div style="width: 60px; height: 60px;">${qrCodeSvg}</div>
            </div>` : ''}
        </div>
    </div>
</body>
</html>`;

  return htmlContent;
}

export async function POST(request: NextRequest) {
  try {
    const { laudoId, type, format } = await request.json();

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

    let htmlContent: string;
    let filename: string;

    // Verificar se é laudo de ruído
    if (type === 'ruido') {
      // Buscar dados básicos para o hash
      const laudoBase = await prisma.laudo.findUnique({
        where: { id: laudoId },
        include: { vehicle: true },
      });
      const { hash: docHash, qrCodeSvg } = laudoBase
        ? await getOrCreateLaudoHash(laudoId, laudoBase.vehicle.placa, laudoBase.dataEmissao, 'RUIDO')
        : { hash: '', qrCodeSvg: '' };

      htmlContent = await generateRuidoPDF(laudoId, adminSettings, qrCodeSvg, docHash);
      filename = `laudo-ruido-${laudoBase?.ordemServico || laudoId}.pdf`;
    } else {
      // Buscar laudo (LIT ou Checklist) DIRETAMENTE do banco (sem fetch HTTP)
      const fullLaudo = await prisma.laudo.findUnique({
        where: { id: laudoId },
        include: { client: true, vehicle: true },
      }) as (Laudo & { client: Client; vehicle: Vehicle }) | null;
      if (!fullLaudo) {
        return NextResponse.json({ error: 'Laudo não encontrado' }, { status: 404 });
      }

      const { hash: docHash, qrCodeSvg } = await getOrCreateLaudoHash(
        laudoId, fullLaudo.vehicle.placa, fullLaudo.dataEmissao, fullLaudo.laudoType
      );

      // Rotear para o template correto baseado no tipo do laudo
      if (type === 'lit' || fullLaudo.laudoType === 'LIT') {
        filename = `laudo-lit-${fullLaudo.ordemServico}.pdf`;
        htmlContent = await generateLitHTML(fullLaudo, adminSettings, qrCodeSvg, docHash);
      } else {
        filename = `laudo-checklist-${fullLaudo.ordemServico}.pdf`;
        htmlContent = await generateChecklistHTML(fullLaudo, adminSettings, qrCodeSvg, docHash);
      }
    }

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

    // Configurações específicas por tipo de laudo
    let pdfBuffer: Uint8Array;
    if (type === 'ruido') {
      // Configurações para laudo de ruído
      pdfBuffer = await page.pdf({
        format: 'A4' as const,
        printBackground: true,
        margin: {
          top: '8mm',
          right: '5mm',
          bottom: '3mm',
          left: '5mm'
        },
        preferCSSPageSize: false,
        displayHeaderFooter: false,
        scale: 0.95,
        pageRanges: '1'
      });
    } else if (type === 'lit' || (type !== 'ruido' && type !== 'checklist')) {
      // Configurações para laudo LIT
      pdfBuffer = await page.pdf({
        format: 'A4' as const,
        printBackground: true,
        margin: {
          top: '2mm',
          right: '2mm',
          bottom: '2mm',
          left: '2mm'
        },
        preferCSSPageSize: false,
        displayHeaderFooter: false,
        scale: 0.90,
        pageRanges: '1'
      });
    } else {
      // Configurações OTIMIZADAS para checklist - melhor aproveitamento da página
      pdfBuffer = await page.pdf({
        format: 'A4' as const,
        printBackground: true,
        margin: {
          top: '2mm',
          right: '2mm',
          bottom: '2mm',
          left: '2mm'
        },
        preferCSSPageSize: false,
        displayHeaderFooter: false,
        scale: 0.82      // 2 páginas: conteúdo flui naturalmente (sem pageRanges, nada é cortado)
      });
    }

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