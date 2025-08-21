import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Client, Vehicle, Laudo, AdminSetting } from '@prisma/client';
import type { Equipment } from '@/types/equipment';

// Função para gerar PDF de laudo de ruído
async function generateRuidoPDF(laudoId: string, adminSettings: AdminSetting) {
  console.log('🔊 Gerando PDF de laudo de ruído...');
  console.log(`🔍 LaudoId: ${laudoId}`);
  
  // Buscar dados do laudo de ruído
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const fetchUrl = `${baseUrl}/api/laudos/ruido/${laudoId}`;
  console.log(`🔗 Fetch URL: ${fetchUrl}`);
  
  const ruidoResponse = await fetch(fetchUrl);
  console.log(`📊 Response Status: ${ruidoResponse.status}`);
  console.log(`📊 Response StatusText: ${ruidoResponse.statusText}`);
  
  if (!ruidoResponse.ok) {
    const errorText = await ruidoResponse.text();
    console.error(`❌ Erro na busca do laudo de ruído:`, errorText);
    throw new Error(`Falha ao buscar dados do laudo de ruído - Status: ${ruidoResponse.status} - ${errorText}`);
  }
  
  const ruidoData = await ruidoResponse.json();
  
  // 🔍 LOG: Verificar dados de aceleração e data de vencimento
  console.log('🔍 DEBUG - Dados recebidos:');
  console.log('aceleracao1:', ruidoData.aceleracao1, 'tipo:', typeof ruidoData.aceleracao1);
  console.log('dataVencimento RAW:', ruidoData.dataVencimento, 'tipo:', typeof ruidoData.dataVencimento);
  console.log('inspetorResponsavel:', ruidoData.inspetorResponsavel);
  console.log('observacoes:', ruidoData.observacoes);
  console.log('🔍 TODOS OS DADOS:', JSON.stringify(ruidoData, null, 2));
  
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
  
  // Buscar dados do equipamento
  let equipmentData: Equipment | null = null;
  if (ruidoData.equipmentId) {
    try {
      const equipmentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/equipments/${ruidoData.equipmentId}`);
      if (equipmentResponse.ok) {
        equipmentData = await equipmentResponse.json();
      }
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
      const logoUrl = adminSettings.companyLogoUrl.startsWith('http')
        ? adminSettings.companyLogoUrl
        : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${adminSettings.companyLogoUrl}`;
      
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const logoArrayBuffer = await logoBlob.arrayBuffer();
        const logoBytes = new Uint8Array(logoArrayBuffer);
        const logoType = adminSettings.companyLogoUrl.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
        const logoBase64String = Buffer.from(logoBytes).toString('base64');
        logoBase64 = `data:${logoType};base64,${logoBase64String}`;
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
    '{{resultado}}': ruidoData.resultado || 'APROVADO',
    '{{resultClass}}': ruidoData.resultado === 'APROVADO' ? 'aprovado' : 'reprovado',
    '{{validityDate}}': ruidoData.dataVencimento || 'NÃO INFORMADO',
    '{{inspector}}': ruidoData.inspetorResponsavel || 'Espaço para assinatura digital',
    '{{observations}}': ruidoData.observacoes || 'Laudo de ruído conforme especificações técnicas. Medições realizadas em condições controladas.',
    '{{generationDate}}': format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
    
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

// Função para gerar PDF de laudo de checklist (código existente)
async function generateChecklistHTML(fullLaudo: Laudo & { client: Client; vehicle: Vehicle }, adminSettings: AdminSetting) {
  // Converter logo para base64
  let logoBase64 = '';
  if (adminSettings.companyLogoUrl) {
    try {
      const logoUrl = adminSettings.companyLogoUrl.startsWith('http')
        ? adminSettings.companyLogoUrl
        : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${adminSettings.companyLogoUrl}`;
      
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const logoArrayBuffer = await logoBlob.arrayBuffer();
        const logoBytes = new Uint8Array(logoArrayBuffer);
        const logoType = adminSettings.companyLogoUrl.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
        const logoBase64String = Buffer.from(logoBytes).toString('base64');
        logoBase64 = `data:${logoType};base64,${logoBase64String}`;
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
      
      // Construir URL completa se necessário
      const imageUrl = url.startsWith('http')
        ? url
        : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${url}`;
      
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
  const renderCheckbox = (value: string) => {
    if (value === 'OK') return '✓';
    if (value === 'NOK') return '✗';
    if (value === 'NA') return 'N.A';
    return '';
  };

  const renderField = (label: string, field: string) => {
    const value = checklistData[field] || '';
    const cssClass = value === 'OK' ? 'ok' : value === 'NOK' ? 'nok' : 'na';
    return `
      <div class="field">
        ${label} <span class="checkbox ${cssClass}">${renderCheckbox(value)}</span>
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
            justify-content: center;
            gap: 4px;
            margin-bottom: 1.5px;
        }
        
        .header-logo {
            max-height: 30px;
            max-width: 80px;
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
            padding: 1.5px;
        }
        
        .field {
            margin-bottom: 1px;
            padding: 1px;
            font-size: 11px;
            line-height: 1.2;
        }
        
        .field .label {
            display: inline;
            font-size: 11px;
        }
        
        .field .checkbox {
            display: inline;
            width: 16px;
            height: 16px;
            font-size: 11px;
            line-height: 14px;
            margin-left: 3px;
            vertical-align: middle;
        }
        
        .field-text {
            margin-bottom: 1px;
            padding: 1px;
        }
        
        .field-text .value {
            font-weight: bold;
            font-size: 11px;
        }
        
        .label {
            flex-grow: 1;
            font-size: 11px;
            line-height: 1.2;
        }
        
        .checkbox {
            width: 12px;
            height: 12px;
            border: 0.5px solid #000;
            display: inline-block;
            text-align: center;
            font-size: 9px;
            line-height: 10px;
            margin-left: 2px;
        }
        
        .ok { background: #90EE90; }
        .nok { background: #FFB6C1; }
        .na { background: #E6E6FA; }
        
        .subsection-title {
            font-weight: bold;
            font-size: 10px;
            text-decoration: underline;
            margin: 1px 0 1px 0;
            line-height: 1.1;
        }
        
        /* MEDIÇÃO DOS PNEUS - COMPACTA PARA PÁGINA ÚNICA */
        .measurement-section {
          border: 1px solid #000;
          margin: 1px 0;
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

        .measurement-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1px;
          margin-bottom: 2px;
          font-size: 7px;
        }

        .header-field {
          border: 1px solid #000;
          padding: 1px;
          text-align: center;
          background: #e0e0e0;
          font-weight: bold;
        }

        /* GRID SIMPLIFICADO - LAYOUT COMPACTO PARA PÁGINA ÚNICA */
        .measurement-grid-simplified {
          display: grid;
          grid-template-columns: 1fr 2fr 2fr 1fr;
          gap: 1px;
          border: 1px solid #000;
          font-size: 7px;
          background: white;
          padding: 1px;
        }

        .label-compact {
          padding: 1px;
          text-align: center;
          border: 1px solid #ccc;
          background: #f5f5f5;
          font-size: 8px;
          line-height: 1.0;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 24px;
        }

        .measurement-grid-simplified .header {
          background: #d0d0d0;
          border: 1px solid #000;
          padding: 1px;
          font-weight: bold;
          font-size: 8px;
          text-align: center;
        }

        .measurement-grid-simplified .value {
          border: 1px solid #ccc;
          padding: 2px;
          min-height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 7px;
          background: white;
        }

        .measurement-footer-compact {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 2px;
          font-size: 6px;
          padding: 1px;
          background: #f0f0f0;
          border: 1px solid #ccc;
        }

        /* Estilos para pneus EXPANDIDOS PARA MELHOR LEGIBILIDADE */
        .pneu-value {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background-image: url('${pneuSvgBase64}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: bold;
          color: #000;
          margin: 2px;
          position: relative;
          border: 1px solid #333;
        }

        .pneu-value::before {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          z-index: 1;
        }

        .pneu-value span {
          position: relative;
          z-index: 2;
          font-weight: bold;
          color: #000;
          font-size: 8px;
        }

        .par-values {
          display: flex;
          gap: 3px;
          align-items: center;
          justify-content: center;
          border: 1px solid #ccc;
          padding: 3px;
        }

        .single-value {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ccc;
          padding: 3px;
        }

        .measurement-footer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
          margin-top: 2px;
          font-size: 7px;
        }

        .footer-field {
          border: 1px solid #000;
          padding: 2px;
          background: #f0f0f0;
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
        
        /* FORÇAR PÁGINA ÚNICA E CENTRALIZAÇÃO */
        * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
            * {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            .measurement-section,
            .final-unified-section,
            .items-container {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
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
                    
                    <div class="subsection-title">Chassi</div>
                    ${renderField('Estacionamento, Freios, Reparo', 'motor_estacionamento')}
                    ${renderField('Proteção Pino do Arlinhão, do Chassi', 'motor_protecaoPino')}
                    ${renderField('Limite de Operacidade', 'motor_limiteOperacidade')}
                    
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

        <!-- SISTEMAS ELÉTRICOS E ESPECIAIS EXPANDIDOS -->
        <div style="margin: 2px 0; font-size: 6px;">
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;">
                ${renderField('Cronotacógrafo', 'cronografo_funcionamento')}
                ${renderField('Buzina', 'buzina_existenciaFuncionamento')}
                ${renderField('Limpador Para-Brisa', 'limpador_operacionalidade')}
                ${renderField('Integridade Limpador', 'limpador_integridadeOperacionalidade')}
            </div>
        </div>

        <!-- SEÇÕES ESPECIAIS EM GRADE EXPANDIDA -->
        <div style="margin: 2px 0; font-size: 6px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px;">
            ${renderField('Sistema Alarme Ré', 'alarmeRe_funcionamento')}
            ${renderField('Para-Choque Traseiro', 'paraChoque_integridade')}
            ${renderField('Para-Lama', 'paraLama_integridade')}
            ${renderField('Dispositivos Refletivos', 'refletivos_integridade')}
            ${renderField('Chassi Porta-Contêiner', 'chassiContainer_atendimentoRes725')}
            ${renderField('Dolly', 'dolly_estadoCambio')}
            ${renderField('Pinos Semi-Reboque', 'pinosSemi_integridade')}
            ${renderField('Quinta-Roda', 'quintaRoda_integridade')}
            ${renderField('Pino-Rei', 'pinoRei_fixacaoVertical')}
            ${renderField('Conjunto de Engate', 'engate_estadoRotula')}
        </div>

        <!-- CAMPOS DE TEXTO ADICIONAIS EXPANDIDOS -->
        <div style="margin: 2px 0; font-size: 6px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px;">
            ${renderTextField('Largura Elétrico', 'eletricos_largura')}
            ${renderTextField('Diâmetro Pino-Rei (mm)', 'pinoRei_diametroMm')}
        </div>

        <!-- MEDIÇÃO DOS PNEUS - LAYOUT ULTRA SIMPLIFICADO -->
        <div class="measurement-section">
          <div class="measurement-title">Medição dos Pneus</div>
          
          <!-- Grid simplificado - apenas posições e pneus -->
          <div class="measurement-grid-simplified">
            <!-- Cabeçalhos -->
            <div></div>
            <div class="header">ESQUERDA</div>
            <div class="header">DIREITA</div>
            <div></div>
            
            <!-- LINHA 1 - Dianteiro -->
            <div class="label-compact">D1</div>
            <div class="single-value">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha1_esquerdo)}</span>
              </div>
            </div>
            <div class="single-value">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha1_direito)}</span>
              </div>
            </div>
            <div class="label-compact">D1</div>
            
            <!-- LINHA 2 - Dianteiro 2 -->
            <div class="label-compact">D2</div>
            <div class="single-value">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha2_esquerdo, 'X')}</span>
              </div>
            </div>
            <div class="single-value">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha2_direito, 'X')}</span>
              </div>
            </div>
            <div class="label-compact">D2</div>
            
            <!-- LINHA 3 - Traseiro 1 -->
            <div class="label-compact">T1</div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha3_esquerdo1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha3_esquerdo2)}</span>
              </div>
            </div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha3_direito1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha3_direito2)}</span>
              </div>
            </div>
            <div class="label-compact">T1</div>
            
            <!-- LINHA 4 - Traseiro 2 -->
            <div class="label-compact">T2</div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha4_esquerdo1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha4_esquerdo2)}</span>
              </div>
            </div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha4_direito1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha4_direito2)}</span>
              </div>
            </div>
            <div class="label-compact">T2</div>
            
            <!-- LINHA 5 - Traseiro 3 -->
            <div class="label-compact">T3</div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha5_esquerdo1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha5_esquerdo2)}</span>
              </div>
            </div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha5_direito1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha5_direito2)}</span>
              </div>
            </div>
            <div class="label-compact">T3</div>
          </div>
          
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

        <div style="text-align: center; font-size: 6px; margin-top: 2px;">
            Documento gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')} - Sistema GTS
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

    // Buscar configurações admin
    const adminSettingsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/settings`);
    if (!adminSettingsRes.ok) {
      return NextResponse.json({ error: 'Falha ao buscar configurações admin' }, { status: 500 });
    }
    const adminSettings: AdminSetting = await adminSettingsRes.json();

    let htmlContent: string;
    let filename: string;

    // Verificar se é laudo de ruído
    if (type === 'ruido') {
      htmlContent = await generateRuidoPDF(laudoId, adminSettings);
      filename = `laudo-ruido-${laudoId}.pdf`;
    } else {
      // Lógica existente para laudo de checklist
      const laudoDetailsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/laudos/${laudoId}`);
      if (!laudoDetailsRes.ok) {
        return NextResponse.json({ error: 'Falha ao buscar dados do laudo' }, { status: 500 });
      }
      const fullLaudo: Laudo & { client: Client; vehicle: Vehicle } = await laudoDetailsRes.json();
      filename = `laudo-checklist-${fullLaudo.ordemServico}.pdf`;
      htmlContent = await generateChecklistHTML(fullLaudo, adminSettings);
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
    } else {
      // Configurações ULTRA COMPACTAS para checklist - PÁGINA ÚNICA
      pdfBuffer = await page.pdf({
        format: 'A4' as const,
        printBackground: true,
        margin: {
          top: '1mm',      // Margem MÍNIMA ABSOLUTA
          right: '1mm',    // Margem MÍNIMA ABSOLUTA
          bottom: '1mm',   // Margem MÍNIMA ABSOLUTA
          left: '1mm'      // Margem MÍNIMA ABSOLUTA
        },
        preferCSSPageSize: false,
        displayHeaderFooter: false,
        scale: 0.75,       // Scale MUITO reduzido para caber TUDO
        pageRanges: '1'    // FORÇA apenas primeira página
      });
    }

    console.log('✅ PDF gerado com sucesso, fechando browser...');
    await browser.close();

    // Retornar PDF como resposta
    return new NextResponse(pdfBuffer, {
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