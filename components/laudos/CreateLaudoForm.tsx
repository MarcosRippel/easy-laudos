'use client';

import { useState, useEffect } from 'react';
import type { Client, Laudo, Vehicle, AdminSetting } from '@prisma/client';
import { companyHeaderLine } from '@/lib/companyIdentity';
import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import { download } from '@/lib/download';
import { format } from 'date-fns';
import fontkit from '@pdf-lib/fontkit';
import styles from './CreateLaudoForm.module.css';

interface CreateLaudoFormProps {
  clients: Client[];
  nextOrdemServico: string;
  temporalCode: string;
  initialClientId?: string;
  initialPlaca?: string;
}

const initialLaudoData = {
  ordemServico: '', // ID automático do sistema
  ordemServicoUsuario: '', // Novo campo para usuário preencher
  dataEmissao: '',
  laudoType: 'LIT',
  dataVencimento: '',
  codTemporal: '',
  observacoes: '',
  fabricanteEquipamento: 'N.A',
  mesAnoFabricEquip: 'N.A',
  diametroPinoRei: 'N.A',
  dataVerifPinoRei: '',
};

const initialImageFiles = { dianteira: null, traseira: null, chassi: null };

// Observações fixas baseadas no tipo de laudo
const getDefaultObservations = (laudoType: string) => {
  if (laudoType === 'LIT') {
    return `6.1- A verificação do veículo foi realizada com base na portaria INMETRO nº 457/2008, POP-OP001/0418
6.2- O laudo preventivo contemplou os itens possíveis de serem verificados com o veículo em ordem de marcha.
6.3- Este Laudo não pressupõe qualquer garantia explicíta ou implicíta pela empresa emissora, relativo ao veículo verificado, não isentando o fabricante e/ou proprietário de suas responsabilidades quanto aos danos pessoais, materiais e ambientais ou quaisquer perdas provocadas por problemas de instalação, construção, manutenção e operação incorreta do veículo e seus acessórios.
6.4- Verificação realizada com base itens de atendimento ao sistema SASSMAQ`;
  } else if (laudoType === 'CHECKLIST') {
    return `Este relatório não pressupõe qualquer garantia explícita ou implícita dada pela empresa emissora, relativo ao Veículo inspecionado. Não isentando o fabricante e proprietário de suas responsabilidades quanto aos danos pessoais, materiais e ambientais ou quaisquer perdas provocadas por problemas de instalação, construção, manutenção e operação incorreta do veículo e seus acessórios.`;
  } else if (laudoType === 'QUINTA_RODA') {
    return `Este laudo de quinta roda foi realizado conforme normas técnicas aplicáveis para verificação de sistemas de acoplamento. A inspeção contemplou exame visual dos componentes de quinta roda e elementos de fixação. Este relatório não pressupõe qualquer garantia explícita ou implícita dada pela empresa emissora, relativo ao equipamento inspecionado. Não isentando o fabricante e proprietário de suas responsabilidades quanto aos danos pessoais, materiais e ambientais.`;
  }
  return '';
};

export default function CreateLaudoForm({ clients, nextOrdemServico, temporalCode, initialClientId, initialPlaca }: CreateLaudoFormProps) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isVehicleLoading, setIsVehicleLoading] = useState(false);
  const [laudoData, setLaudoData] = useState({
    ...initialLaudoData,
    ordemServico: nextOrdemServico, // ID automático do sistema
    ordemServicoUsuario: nextOrdemServico, // Pré-preenche com o próximo número
    codTemporal: temporalCode,
    observacoes: getDefaultObservations('LIT'), // Observações padrão iniciais
  });

  // ID único do laudo será gerado após criação
  const [laudoSystemId, setLaudoSystemId] = useState('');
  const [imageFiles, setImageFiles] = useState<{
    dianteira: File | null;
    traseira: File | null;
    chassi: File | null;
  }>(initialImageFiles);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [newLaudo, setNewLaudo] = useState<Laudo | null>(null);

  // useEffect para atualizar observações quando o tipo de laudo mudar
  useEffect(() => {
    const defaultObs = getDefaultObservations(laudoData.laudoType);

    // Só atualiza se as observações atuais são exatamente as observações padrão de outro tipo
    // ou se estão vazias, preservando observações personalizadas do usuário
    const currentObs = laudoData.observacoes;
    const litDefault = getDefaultObservations('LIT');
    const checklistDefault = getDefaultObservations('CHECKLIST');
    const quintaRodaDefault = getDefaultObservations('QUINTA_RODA');

    if (currentObs === '' || currentObs === litDefault || currentObs === checklistDefault || currentObs === quintaRodaDefault) {
      setLaudoData(prev => ({ ...prev, observacoes: defaultObs }));
    }
  }, [laudoData.laudoType]);

  // Auto-selecionar cliente e veículo quando vindo da lista de veículos
  useEffect(() => {
    if (initialClientId) {
      setSelectedClient(initialClientId);
      setIsVehicleLoading(true);
      fetch(`/api/vehicles?clientId=${initialClientId}`)
        .then(res => res.ok ? res.json() : [])
        .then((vehiclesData: Vehicle[]) => {
          setVehicles(vehiclesData);
          if (initialPlaca) {
            const match = vehiclesData.find((v: Vehicle) => v.placa === initialPlaca);
            if (match) setSelectedVehicle(match.id);
          }
        })
        .catch(console.error)
        .finally(() => setIsVehicleLoading(false));
    }
  }, [initialClientId, initialPlaca]);

  const handleClientChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = event.target.value;
    setSelectedClient(clientId);
    setSelectedVehicle('');
    setVehicles([]);

    if (clientId) {
      setIsVehicleLoading(true);
      try {
        const response = await fetch(`/api/vehicles?clientId=${clientId}`);
        if (!response.ok) throw new Error('Failed to fetch vehicles');
        setVehicles(await response.json());
      } catch (error) { console.error(error); }
      finally { setIsVehicleLoading(false); }
    }
  };

  const handleLaudoDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLaudoData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setImageFiles(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewLaudo(null);
    if (!selectedClient || !selectedVehicle) {
      setMessage('Please select a client and a vehicle.');
      return;
    }

    // Redirecionamento para laudos especializados
    if (laudoData.laudoType === 'QUINTA_RODA') {
      window.location.href = '/laudos/quinta-roda';
      return;
    }

    setIsSubmitting(true);
    setMessage('Uploading images...');

    try {
      const imageUrls = {
        fotoDianteiraUrl: '',
        fotoTraseiraUrl: '',
        fotoChassiUrl: '',
      };

      const uploadPromises = [];

      if (imageFiles.dianteira) {
        console.log('📤 LIT: Fazendo upload da imagem dianteira...');
        const formData = new FormData();
        formData.append('file', imageFiles.dianteira);
        uploadPromises.push(
          fetch('/api/upload', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
              console.log('✅ LIT: Upload dianteira sucesso:', data);
              imageUrls.fotoDianteiraUrl = data.url; // CORRIGIDO: era data.path, agora data.url
            })
            .catch(err => console.error('❌ LIT: Erro upload dianteira:', err))
        );
      }
      if (imageFiles.traseira) {
        console.log('📤 LIT: Fazendo upload da imagem traseira...');
        const formData = new FormData();
        formData.append('file', imageFiles.traseira);
        uploadPromises.push(
          fetch('/api/upload', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
              console.log('✅ LIT: Upload traseira sucesso:', data);
              imageUrls.fotoTraseiraUrl = data.url; // CORRIGIDO: era data.path, agora data.url
            })
            .catch(err => console.error('❌ LIT: Erro upload traseira:', err))
        );
      }
      if (imageFiles.chassi) {
        console.log('📤 LIT: Fazendo upload da imagem chassi...');
        const formData = new FormData();
        formData.append('file', imageFiles.chassi);
        uploadPromises.push(
          fetch('/api/upload', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
              console.log('✅ LIT: Upload chassi sucesso:', data);
              imageUrls.fotoChassiUrl = data.url; // CORRIGIDO: era data.path, agora data.url
            })
            .catch(err => console.error('❌ LIT: Erro upload chassi:', err))
        );
      }

      await Promise.all(uploadPromises);

      console.log('🔍 LIT: URLs finais das imagens após upload:', imageUrls);

      setMessage('Creating Laudo...');

      const submissionData = {
        ...laudoData,
        ordemServico: laudoData.ordemServicoUsuario, // Usar o campo do usuário
        ...imageUrls,
        clientId: selectedClient,
        vehicleId: selectedVehicle,
      };

      const laudoResponse = await fetch('/api/laudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!laudoResponse.ok) {
        const errorData = await laudoResponse.json();
        throw new Error(errorData.message || 'Failed to create laudo.');
      }

      const newLaudo = await laudoResponse.json();
      setLaudoSystemId(newLaudo.id); // Definir o ID do sistema
      setMessage('Laudo created successfully! Generating PDF...');

      await generateFinalPdf(newLaudo.id);

      setTimeout(() => {
        setMessage('');
        setSelectedClient('');
        setSelectedVehicle('');
        setVehicles([]);
        setLaudoData({
          ...initialLaudoData,
          ordemServico: nextOrdemServico,
          codTemporal: temporalCode,
          observacoes: getDefaultObservations('LIT'), // Reset para observações padrão
        });
        setLaudoSystemId(''); // Limpar ID do sistema
        setImageFiles(initialImageFiles);
        (document.getElementById('laudo-form') as HTMLFormElement)?.reset();
      }, 2000);

    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? `Error: ${error.message}` : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const generateFinalPdf = async (laudoId: string) => {
    try {
      const [laudoDetailsRes, adminSettingsRes, fontBytesRes] = await Promise.all([
        fetch(`/api/laudos/${laudoId}`),
        fetch('/api/admin/settings'),
        fetch('/DejaVuSans.ttf')
      ]);

      if (!laudoDetailsRes.ok || !adminSettingsRes.ok || !fontBytesRes.ok) {
        throw new Error('Failed to fetch all data for PDF generation.');
      }

      const fullLaudo: Laudo & { client: Client; vehicle: Vehicle } = await laudoDetailsRes.json();
      const adminSettings: AdminSetting = await adminSettingsRes.json();
      const fontBytes = await fontBytesRes.arrayBuffer();

      // Debug e fetch do logo
      console.log("Admin settings:", adminSettings);
      console.log("Company logo URL:", adminSettings.companyLogoUrl);

      let logoImageData = null;
      if (adminSettings.companyLogoUrl) {
        try {
          const logoResponse = await fetch(adminSettings.companyLogoUrl);
          console.log("Logo fetch response:", logoResponse.ok, logoResponse.status);
          if (logoResponse.ok) {
            logoImageData = await logoResponse.arrayBuffer();
            console.log("Logo data size:", logoImageData.byteLength);
          }
        } catch (e) {
          console.error('Error fetching logo:', e);
        }
      }

      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(fontBytes);

      console.log("fullLaudofullLaudo", fullLaudo)

      // DEBUG: Logs para diagnosticar erro "Invalid time value"
      console.log("=== DEBUG DATES ===");
      console.log("dataEmissao raw:", fullLaudo.dataEmissao);
      console.log("dataEmissao type:", typeof fullLaudo.dataEmissao);
      console.log("dataVerifPinoRei raw:", fullLaudo.dataVerifPinoRei);
      console.log("dataVerifPinoRei type:", typeof fullLaudo.dataVerifPinoRei);

      // Teste de conversão das datas
      try {
        const testDataEmissao = new Date(fullLaudo.dataEmissao);
        console.log("dataEmissao convertida:", testDataEmissao);
        console.log("dataEmissao isValid:", !isNaN(testDataEmissao.getTime()));
      } catch (e) {
        console.error("ERRO na conversão dataEmissao:", e);
      }

      try {
        if (fullLaudo.dataVerifPinoRei) {
          const testDataVerifPinoRei = new Date(fullLaudo.dataVerifPinoRei);
          console.log("dataVerifPinoRei convertida:", testDataVerifPinoRei);
          console.log("dataVerifPinoRei isValid:", !isNaN(testDataVerifPinoRei.getTime()));
        }
      } catch (e) {
        console.error("ERRO na conversão dataVerifPinoRei:", e);
      }
      console.log("=== FIM DEBUG DATES ===");

      const drawText = (text: string, x: number, y: number, size: number = 8, isBold: boolean = false) => {
        page.drawText(text || '', {
          x,
          y,
          font,
          size,
          color: rgb(0, 0, 0)
        });
      };

      const drawRect = (x: number, y: number, w: number, h: number, filled: boolean = false, fillColor: number = 0.85, borderWidth: number = 0.5) => {
        page.drawRectangle({
          x,
          y,
          width: w,
          height: h,
          borderColor: rgb(0, 0, 0),
          borderWidth: borderWidth,
          color: filled ? rgb(fillColor, fillColor, fillColor) : undefined
        });
      };

      const drawImage = async (url: string | null, x: number, y: number, w: number, h: number) => {
        if (!url) {
          console.log('❌ DrawImage: URL vazia, ignorando');
          return;
        }
        try {
          // Backward compatibility: convert old /uploads/ paths to /api/uploads/
          let normalizedUrl = url;
          if (normalizedUrl.startsWith('/uploads/')) {
            normalizedUrl = `/api${normalizedUrl}`;
          }

          // Build full URL if needed
          const imageUrl = normalizedUrl.startsWith('http')
            ? normalizedUrl
            : `${window.location.origin}${normalizedUrl}`;

          console.log('🖼️ DrawImage: Tentando carregar imagem:', imageUrl);

          const response = await fetch(imageUrl);
          if (!response.ok) {
            console.error('❌ DrawImage: Falha ao buscar imagem, status:', response.status);
            return;
          }

          const imgBytes = await response.arrayBuffer();
          console.log('✅ DrawImage: Imagem carregada, tamanho:', imgBytes.byteLength);

          if (imgBytes.byteLength === 0) {
            console.error('❌ DrawImage: Imagem vazia (0 bytes)');
            return;
          }

          // Detect format: prefer Content-Type header, fallback to extension
          const contentType = response.headers.get('content-type') || '';
          const isPng = contentType.includes('png') || normalizedUrl.toLowerCase().endsWith('.png');

          let img;
          try {
            if (isPng) {
              img = await pdfDoc.embedPng(imgBytes);
            } else {
              img = await pdfDoc.embedJpg(imgBytes);
            }
          } catch {
            // Fallback: try the other format
            console.log('⚠️ DrawImage: Tentando formato alternativo...');
            try {
              img = isPng
                ? await pdfDoc.embedJpg(imgBytes)
                : await pdfDoc.embedPng(imgBytes);
            } catch (e2) {
              console.error('❌ DrawImage: Ambos formatos falharam:', e2);
              return;
            }
          }
          page.drawImage(img, { x, y, width: w, height: h });
          console.log('✅ DrawImage: Imagem inserida no PDF com sucesso');
        } catch (e) {
          console.error(`❌ DrawImage: Falha ao processar imagem ${url}:`, e);
        }
      };

      // Logo no cabeçalho e como marca d'água
      if (logoImageData) {
        try {
          let logoImage;
          const logoUrl = adminSettings.companyLogoUrl?.toLowerCase() || '';

          if (logoUrl.includes('.png')) {
            logoImage = await pdfDoc.embedPng(logoImageData);
          } else if (logoUrl.includes('.jpg') || logoUrl.includes('.jpeg')) {
            logoImage = await pdfDoc.embedJpg(logoImageData);
          } else {
            // Tenta PNG como padrão
            logoImage = await pdfDoc.embedPng(logoImageData);
          }

          console.log("Logo embedded successfully");

          // Logo no cabeçalho (centralizado no topo, 30% maior)
          const headerLogoWidth = 156; // 120 * 1.3 = 30% maior
          const headerLogoHeight = 52; // 40 * 1.3 = 30% maior
          const headerLogoX = (width - headerLogoWidth) / 2;
          const headerLogoY = height - 40; // Ajustado para logo maior

          page.drawImage(logoImage, {
            x: headerLogoX,
            y: headerLogoY,
            width: headerLogoWidth,
            height: headerLogoHeight
          });

          // Logo marca d'água principal (centro da página)
          const logoWidth = 500; // Dobrado de 250
          const logoHeight = 200; // Dobrado de 100
          const logoX = (width - logoWidth) / 2;
          const logoY = height / 2 - logoHeight / 2;

          page.drawImage(logoImage, {
            x: logoX,
            y: logoY,
            width: logoWidth,
            height: logoHeight,
            opacity: 0.08 // Bem transparente
          });

          // Logo marca d'água adicional (sobre seções cliente e veículo)
          const topLogoWidth = 300;
          const topLogoHeight = 120;
          const topLogoX = (width - topLogoWidth) / 2;
          const topLogoY = height - 250; // Posicionado sobre as seções cliente/veículo

          page.drawImage(logoImage, {
            x: topLogoX,
            y: topLogoY,
            width: topLogoWidth,
            height: topLogoHeight,
            opacity: 0.06 // Ainda mais transparente para não atrapalhar
          });

        } catch (e) {
          console.error('Error embedding company logo:', e);
        }
      } else {
        console.log("No logo data available");
      }
      drawRect(40, height - 80, 520, 25, true, 0.75);
      drawText(companyHeaderLine(adminSettings), 45, height - 72, 7);
      drawText('LAUDO INSPEÇÃO TÉCNICA', 220, height - 64, 10);

      // CORREÇÃO: Proteção contra "Invalid time value" na dataEmissao
      let dataEmissaoFormatted = '';
      try {
        if (fullLaudo.dataEmissao) {
          const dataEmissaoDate = new Date(fullLaudo.dataEmissao);
          if (!isNaN(dataEmissaoDate.getTime())) {
            dataEmissaoFormatted = format(dataEmissaoDate, 'dd/MM/yyyy');
          } else {
            console.error('Data de emissão inválida:', fullLaudo.dataEmissao);
            dataEmissaoFormatted = 'Data Inválida';
          }
        } else {
          dataEmissaoFormatted = 'Sem Data';
        }
      } catch (e) {
        console.error('Erro ao formatar data de emissão:', e);
        dataEmissaoFormatted = 'Erro na Data';
      }
      drawText(`DATA: ${dataEmissaoFormatted}`, 450, height - 64, 8);

      // Code and Service Order section
      drawRect(40, height - 103, 220, 18);
      drawText(`Cód. Temporal:`, 42, height - 95, 7);
      drawText(`${fullLaudo.codTemporal || ''}`, 105, height - 95, 8);

      drawRect(260, height - 103, 300, 18);
      drawText(`Ordem de Serviço N°:`, 262, height - 95, 7);
      drawText(`${fullLaudo.ordemServico}`, 350, height - 95, 8);

      let currentY = height - 125;

      const clientSectionHeight = 95; // Total height including title (15) + content (80)

      // Draw the complete section box first (including space for title)
      drawRect(40, currentY - clientSectionHeight, 520, clientSectionHeight, false, 0.85, 1.5);

      // Draw title with gray background at the TOP of the section
      drawRect(40, currentY - 15, 520, 15, true, 0.75);
      drawText('1 - CLIENTE', 42, currentY - 11, 8);

      // Content starts immediately below title (no gap)
      const contentStartY = currentY - 15;

      // Client section content (no gap between title and content)
      /* currentY -= 15;
      drawRect(40, currentY - clientSectionHeight, 520, clientSectionHeight, false, 0.85, 1.5); */

      page.drawLine({
        start: { x: 40, y: contentStartY - 25 },
        end: { x: 560, y: contentStartY - 25 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      // Horizontal line after second row
      page.drawLine({
        start: { x: 40, y: contentStartY - 50 },
        end: { x: 560, y: contentStartY - 50 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      // Vertical divisions (same as your existing code)
      page.drawLine({
        start: { x: 420, y: contentStartY },
        end: { x: 420, y: contentStartY - 25 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      page.drawLine({
        start: { x: 280, y: contentStartY - 25 },
        end: { x: 280, y: contentStartY - 50 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      page.drawLine({
        start: { x: 200, y: contentStartY - 50 },
        end: { x: 200, y: contentStartY - 80 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      page.drawLine({
        start: { x: 240, y: contentStartY - 50 },
        end: { x: 240, y: contentStartY - 80 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      page.drawLine({
        start: { x: 340, y: contentStartY - 50 },
        end: { x: 340, y: contentStartY - 80 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });


      // Client labels and data
      drawText('Proprietário do Veículo', 42, contentStartY - 8, 6);
      drawText(fullLaudo.client.name || '', 42, contentStartY - 18, 8);

      drawText('CNPJ/CPF', 422, contentStartY - 8, 6);
      drawText(fullLaudo.client.cnpj || '', 422, contentStartY - 18, 8);

      drawText('Endereço', 42, contentStartY - 33, 6);
      drawText(`${fullLaudo.client.addressStreet || ''}, ${fullLaudo.client.addressNumber || ''}`, 42, contentStartY - 43, 8);

      drawText('Bairro', 282, contentStartY - 33, 6);
      drawText(fullLaudo.client.addressDistrict || '', 282, contentStartY - 43, 8);

      drawText('Município', 42, contentStartY - 58, 6);
      drawText(fullLaudo.client.addressCity || '', 42, contentStartY - 68, 8);

      drawText('UF', 202, contentStartY - 58, 6);
      drawText(fullLaudo.client.addressState || '', 202, contentStartY - 68, 8);

      drawText('CEP', 242, contentStartY - 58, 6);
      drawText(fullLaudo.client.addressZip || '', 242, contentStartY - 68, 8);

      drawText('Telefones', 342, contentStartY - 58, 6);
      drawText(fullLaudo.client.phone || '', 342, contentStartY - 68, 8);

      // Section 2 - VEHICLE (with spacing between sections)
      currentY -= 105; // Add spacing between sections

      const vehicleSectionHeight = 75; // Include title height
      // Draw the complete section box including title
      drawRect(40, currentY - vehicleSectionHeight, 520, vehicleSectionHeight, false, 0.85, 1.5);

      // Title with gray background - at the top of the section
      drawRect(40, currentY - 15, 520, 15, true, 0.75);
      drawText('2 - VEÍCULO', 42, currentY - 11, 8);

      currentY -= 15; // Content starts below title

      // Internal divisions for vehicle section
      // Horizontal line after first row
      page.drawLine({
        start: { x: 40, y: currentY - 25 },
        end: { x: 560, y: currentY - 25 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      // Vertical divisions for first row
      page.drawLine({
        start: { x: 140, y: currentY },
        end: { x: 140, y: currentY - 25 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      page.drawLine({
        start: { x: 280, y: currentY },
        end: { x: 280, y: currentY - 25 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      page.drawLine({
        start: { x: 380, y: currentY },
        end: { x: 380, y: currentY - 25 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      page.drawLine({
        start: { x: 450, y: currentY },
        end: { x: 450, y: currentY - 25 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      // Vertical divisions for second row
      page.drawLine({
        start: { x: 150, y: currentY - 25 },
        end: { x: 150, y: currentY - 60 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      page.drawLine({
        start: { x: 250, y: currentY - 25 },
        end: { x: 250, y: currentY - 60 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      page.drawLine({
        start: { x: 350, y: currentY - 25 },
        end: { x: 350, y: currentY - 60 },
        thickness: 0.5,
        color: rgb(0, 0, 0)
      });

      // Vehicle labels and data - Primeira linha com espaçamento corrigido
      drawText('Espécie/Tipo', 42, currentY - 8, 6);
      const especieText = fullLaudo.vehicle.especieTipo || '';
      // Use multiple lines if needed to fit text in field width (98px available)
      const especieWords = especieText.split(' ');
      let especieLines = [];
      let currentEspecieLine = '';

      for (const word of especieWords) {
        const testLine = currentEspecieLine + (currentEspecieLine ? ' ' : '') + word;
        if (testLine.length <= 14) { // Adjusted for field width
          currentEspecieLine = testLine;
        } else {
          if (currentEspecieLine) {
            especieLines.push(currentEspecieLine);
            currentEspecieLine = word;
          } else {
            especieLines.push(word);
          }
        }
      }
      if (currentEspecieLine) especieLines.push(currentEspecieLine);

      // Draw espécie/tipo with multiple lines if needed, ensuring no overlap
      especieLines.slice(0, 2).forEach((line, index) => {
        drawText(line, 42, currentY - 18 - (index * 7), 7);
      });

      drawText('Marca/Modelo', 162, currentY - 8, 6);
      const marcaText = fullLaudo.vehicle.marcaModelo || '';
      // Use multiple lines if needed to fit text in field width (118px available)
      const marcaWords = marcaText.split(' ');
      let marcaLines = [];
      let currentMarcaLine = '';

      for (const word of marcaWords) {
        const testLine = currentMarcaLine + (currentMarcaLine ? ' ' : '') + word;
        if (testLine.length <= 17) { // Adjusted for field width
          currentMarcaLine = testLine;
        } else {
          if (currentMarcaLine) {
            marcaLines.push(currentMarcaLine);
            currentMarcaLine = word;
          } else {
            marcaLines.push(word);
          }
        }
      }
      if (currentMarcaLine) marcaLines.push(currentMarcaLine);

      // Draw marca/modelo with multiple lines if needed, ensuring no overlap
      marcaLines.slice(0, 2).forEach((line, index) => {
        drawText(line, 162, currentY - 18 - (index * 7), 7);
      });

      drawText('Nro. Chassi', 300, currentY - 8, 6);
      drawText(fullLaudo.vehicle.numeroChassi || '', 300, currentY - 18, 7);

      drawText('Placa', 400, currentY - 8, 6);
      drawText(fullLaudo.vehicle.placa || '', 400, currentY - 18, 8);

      drawText('Ano Fabric./Modelo', 470, currentY - 8, 6);
      drawText(fullLaudo.vehicle.anoFabricacaoModelo || '', 470, currentY - 18, 8);

      // Segunda linha - Equipamentos
      drawText('Fabricante Equipamento', 42, currentY - 33, 6);
      drawText(fullLaudo.fabricanteEquipamento || 'N.A', 42, currentY - 43, 8);

      drawText('Mês/Ano Fabric.', 152, currentY - 33, 6);
      drawText(fullLaudo.mesAnoFabricEquip || 'N.A', 152, currentY - 43, 8);

      drawText('⌀ - Pino Rei', 252, currentY - 33, 6);
      drawText(fullLaudo.diametroPinoRei || 'N.A', 252, currentY - 43, 8);

      drawText('Data Verif. Pino Rei', 352, currentY - 33, 6);

      // CORREÇÃO: Proteção contra "Invalid time value" na dataVerifPinoRei
      let dataVerifPinoReiFormatted = '';
      try {
        if (fullLaudo.dataVerifPinoRei) {
          // Se a data já está em formato DD/MM/YYYY, converte para YYYY-MM-DD
          let dateToConvert = fullLaudo.dataVerifPinoRei;
          if (typeof dateToConvert === 'string' && dateToConvert.includes('/')) {
            const parts = dateToConvert.split('/');
            if (parts.length === 3) {
              // Converte DD/MM/YYYY para YYYY-MM-DD
              dateToConvert = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }

          const dataVerifPinoReiDate = new Date(dateToConvert);
          if (!isNaN(dataVerifPinoReiDate.getTime())) {
            dataVerifPinoReiFormatted = format(dataVerifPinoReiDate, 'dd/MM/yyyy');
          } else {
            console.error('Data de verificação pino rei inválida:', fullLaudo.dataVerifPinoRei);
            dataVerifPinoReiFormatted = fullLaudo.dataVerifPinoRei; // Mostra o valor original
          }
        }
      } catch (e) {
        console.error('Erro ao formatar data de verificação pino rei:', e);
        dataVerifPinoReiFormatted = fullLaudo.dataVerifPinoRei || ''; // Fallback para valor original
      }
      drawText(dataVerifPinoReiFormatted, 352, currentY - 43, 8);

      // Section 3 & 4 - PHOTOS (side by side with spacing)
      currentY -= 85; // Add spacing between sections

      // Front photo section - complete box with title
      drawRect(40, currentY - 135, 260, 135, false, 0.85, 1.5);
      drawRect(40, currentY - 15, 260, 15, true, 0.75);
      drawText('3 - FOTO DIANTEIRA', 42, currentY - 11, 8);
      await drawImage(fullLaudo.fotoDianteiraUrl, 42, currentY - 133, 256, 116);

      // Rear photo section - complete box with title (aligned with front photo)
      drawRect(300, currentY - 135, 260, 135, false, 0.85, 1.5);
      drawRect(300, currentY - 15, 260, 15, true, 0.75);
      drawText('4 - FOTO TRASEIRA', 302, currentY - 11, 8);
      await drawImage(fullLaudo.fotoTraseiraUrl, 302, currentY - 133, 256, 116);

      // Section 5 - CHASSIS PHOTO (with spacing)
      currentY -= 150; // Add spacing between sections

      // Complete section box with title
      drawRect(40, currentY - 135, 520, 135, false, 0.85, 1.5);
      drawRect(40, currentY - 15, 520, 15, true, 0.75);
      drawText('5 - FOTO DO CHASSI', 42, currentY - 11, 8);
      await drawImage(fullLaudo.fotoChassiUrl, 42, currentY - 133, 516, 116);//await drawImage(fullLaudo.fotoChassiUrl, 42, currentY - 133, 516, 116);

      // Section 6 - OBSERVATIONS (with spacing)
      currentY -= 150; // Add spacing between sections

      // Process observations text - unify into single paragraph
      const obsText = fullLaudo.observacoes || '';

      // Unify LIT observations into single paragraph (remove numbering)
      const unifiedText = obsText
        .replace(/6\.1-\s*/g, '')
        .replace(/6\.2-\s*/g, '. ')
        .replace(/6\.3-\s*/g, '. ')
        .replace(/6\.4-\s*/g, '. ')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Calculate space needed based on content - optimize for full width usage
      const charsPerLine = 90; // Increased to use full 520px width effectively
      const words = unifiedText.split(' ');
      const obsLines = [];
      let currentLine = '';

      // Intelligent word-aware line breaking
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        if (testLine.length <= charsPerLine) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            obsLines.push(currentLine);
            currentLine = word;
          } else {
            // Word is longer than max line, force break
            obsLines.push(word);
          }
        }
      }
      if (currentLine) obsLines.push(currentLine);

      // Calculate dynamic section height with better spacing
      const lineHeight = 10; // Reduced line height for better density
      const sectionHeight = Math.max(95, obsLines.length * lineHeight + 35);

      // Draw section once with correct height
      drawRect(40, currentY - sectionHeight, 520, sectionHeight, false, 0.85, 1.5);
      drawRect(40, currentY - 15, 520, 15, true, 0.75);
      drawText('6 - OBSERVAÇÕES', 42, currentY - 11, 8);

      // Draw text with optimized spacing for full width usage
      obsLines.forEach((line, index) => {
        drawText(line, 42, currentY - 28 - (index * lineHeight), 8);
      });

      // Section 7 - EXPIRY DATE and SIGNATURE (side by side with spacing)
      currentY -= sectionHeight + 15; // Dynamic spacing based on actual section height

      // Expiry date section - complete box with title
      drawRect(40, currentY - 55, 260, 55, false, 0.85, 1.5);
      drawRect(40, currentY - 15, 260, 15, true, 0.75);
      drawText('7 - DATA DE VENCIMENTO', 42, currentY - 11, 8);
      drawText(fullLaudo.dataVencimento || '', 50, currentY - 35, 12);

      // Signature section - complete box with title (aligned with expiry date)
      drawRect(300, currentY - 55, 260, 55, false, 0.85, 1.5);
      drawRect(300, currentY - 15, 260, 15, true, 0.75);
      drawText('ASSINATURA/CARIMBO TÉCNICO', 302, currentY - 11, 8);

      const pdfBytes = await pdfDoc.save();
      download(pdfBytes, `laudo-${fullLaudo.ordemServico}.pdf`, 'application/pdf');

    } catch (e) {
      console.error('Failed to generate PDF', e);
      setMessage('Error: Could not generate PDF.');
    }
  };

  return (
    /*     <form id="laudo-form" onSubmit={handleSubmit} className={styles.formContainer}>
          <fieldset className={styles.fieldset}>
            <legend style={{ fontWeight: 'bold' }}>1. Select Client & Vehicle</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="client-select">Client</label>
                <select id="client-select" value={selectedClient} onChange={handleClientChange} required>
                  <option value="">-- Select a Client --</option>
                  {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="vehicle-select">Vehicle</label>
                <select id="vehicle-select" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} disabled={!selectedClient || isVehicleLoading} required>
                  {isVehicleLoading ? <option>Loading...</option> : vehicles.length > 0 ?
                    <><option value="">-- Select a Vehicle --</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.marcaModelo}</option>)}</> :
                    <option>-- Select a Client First --</option>}
                </select>
              </div>
            </div>
          </fieldset>
    
          <fieldset style={{ padding: '1rem', border: '1px solid #ddd', marginTop: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold' }}>2. Fill Laudo Details</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="ordemServico">Ordem de Serviço N°</label>
                <input type="text" id="ordemServico" name="ordemServico" value={laudoData.ordemServico} onChange={handleLaudoDataChange} required readOnly style={{ backgroundColor: '#eee' }} />
              </div>
              <div>
                <label htmlFor="codTemporal">Cód. Temporal</label>
                <input type="text" id="codTemporal" name="codTemporal" value={laudoData.codTemporal} onChange={handleLaudoDataChange} />
              </div>
              <div>
                <label htmlFor="dataEmissao">Data de Emissão</label>
                <input type="date" id="dataEmissao" name="dataEmissao" value={laudoData.dataEmissao} onChange={handleLaudoDataChange} required />
              </div>
              <div>
                <label htmlFor="dataVencimento">Data de Vencimento</label>
                <input type="text" id="dataVencimento" name="dataVencimento" placeholder="e.g., DD/MM/YYYY" value={laudoData.dataVencimento} onChange={handleLaudoDataChange} />
              </div>
              <div>
                <label htmlFor="laudoType">Laudo Type</label>
                <select id="laudoType" name="laudoType" value={laudoData.laudoType} onChange={handleLaudoDataChange}>
                  <option value="LIT">LIT</option>
                  <option value="CHECKLIST">CHECKLIST</option>
                </select>
              </div>
            </div>
          </fieldset>
    
          <fieldset style={{ padding: '1rem', border: '1px solid #ddd', marginTop: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold' }}>3. Optional Equipment Details</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label>Fabricante Equipamento</label><input name="fabricanteEquipamento" value={laudoData.fabricanteEquipamento} onChange={handleLaudoDataChange} /></div>
              <div><label>Mês/Ano Fabric.</label><input name="mesAnoFabricEquip" value={laudoData.mesAnoFabricEquip} onChange={handleLaudoDataChange} /></div>
              <div><label>⌀ - Pino Rei</label><input name="diametroPinoRei" value={laudoData.diametroPinoRei} onChange={handleLaudoDataChange} /></div>
              <div><label>Data Verif. Pino Rei</label><input type="text" placeholder="e.g., DD/MM/YYYY" name="dataVerifPinoRei" value={laudoData.dataVerifPinoRei} onChange={handleLaudoDataChange} /></div>
            </div>
          </fieldset>
    
          <fieldset style={{ padding: '1rem', border: '1px solid #ddd', marginTop: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold' }}>4. Photos</legend>
            <p style={{ marginTop: 0, color: '#555' }}>Upload the required photos for the report.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="dianteira">Foto Dianteira</label>
                <input type="file" id="dianteira" name="dianteira" accept="image/*" onChange={handleImageChange} />
              </div>
              <div>
                <label htmlFor="traseira">Foto Traseira</label>
                <input type="file" id="traseira" name="traseira" accept="image/*" onChange={handleImageChange} />
              </div>
              <div>
                <label htmlFor="chassi">Foto do Chassi</label>
                <input type="file" id="chassi" name="chassi" accept="image/*" onChange={handleImageChange} />
              </div>
            </div>
          </fieldset>
    
          <fieldset style={{ padding: '1rem', border: '1px solid #ddd', marginTop: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold' }}>5. Observações</legend>
            <textarea name="observacoes" value={laudoData.observacoes} onChange={handleLaudoDataChange} style={{ width: '100%', minHeight: '100px' }}></textarea>
          </fieldset>
    
          <div style={{ marginTop: '2rem' }}>
            <button type="submit" disabled={isSubmitting} style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1.2rem',
              background: 'linear-gradient(135deg, #007bff, #0056b3)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(0,123,255,0.4)',
              transition: 'all 0.3s ease'
            }}>
              {isSubmitting ? '📄 Emitindo...' : '📋 Emitir Laudo'}
            </button>
            {message && <span style={{ marginLeft: '1rem', fontStyle: 'italic', fontWeight: 'bold' }}>{message}</span>}
          </div>
        </form> */
    <form id="laudo-form" onSubmit={handleSubmit} className={styles.formContainer}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>1. Select Client & Vehicle</legend>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="client-select">Client</label>
            <select id="client-select" value={selectedClient} onChange={handleClientChange} required className={styles.select}>
              <option value="">-- Select a Client --</option>
              {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="vehicle-select">Vehicle</label>
            <select id="vehicle-select" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} disabled={!selectedClient || isVehicleLoading} required className={styles.select}>
              {isVehicleLoading ? <option>Loading...</option> : vehicles.length > 0 ?
                <><option value="">-- Select a Vehicle --</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.marcaModelo}</option>)}</> :
                <option>-- Select a Client First --</option>}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>2. Fill Laudo Details</legend>
        <div className={styles.grid3col}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>ID LAUDO SYSTEM</label>
            <input type="text" value={laudoSystemId || 'Será gerado após criação'} readOnly className={styles.input} style={{ backgroundColor: '#444', color: '#ccc' }} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label} style={{ color: '#ff4444' }}>Ordem de Serviço</label>
            <input type="text" name="ordemServicoUsuario" value={laudoData.ordemServicoUsuario} onChange={handleLaudoDataChange} required className={styles.input} style={{ borderColor: '#ff4444' }} placeholder="Digite a Ordem de Serviço" />
          </div>
          <div className={styles.inputGroup}><label className={styles.label}>Cód. Temporal 🎲</label>
            <input type="text" name="codTemporal" value={laudoData.codTemporal} onChange={handleLaudoDataChange} className={styles.input} placeholder="Código gerado automaticamente" title="Gerado pelo último sorteio da Loteria Federal. Você pode alterar manualmente." />
          </div>
          <div className={styles.inputGroup}><label className={styles.label}>Data de Emissão</label><input type="date" name="dataEmissao" value={laudoData.dataEmissao} onChange={handleLaudoDataChange} required className={styles.input} /></div>
          <div className={styles.inputGroup}><label className={styles.label}>Data de Vencimento</label><input type="text" name="dataVencimento" placeholder="e.g., DD/MM/YYYY" value={laudoData.dataVencimento} onChange={handleLaudoDataChange} className={styles.input} /></div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Laudo Type</label>
            <select
              name="laudoType"
              value={laudoData.laudoType}
              onChange={handleLaudoDataChange}
              className={styles.select}
              disabled={laudoData.laudoType === 'LIT'}
              style={laudoData.laudoType === 'LIT' ? { backgroundColor: '#444', cursor: 'not-allowed', opacity: 0.7 } : {}}
            >
              <option value="LIT">LIT</option>
              <option value="CHECKLIST">CHECKLIST</option>
              <option value="QUINTA_RODA">QUINTA RODA</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>3. Optional Equipment Details</legend>
        <div className={styles.grid4col}>
          <div className={styles.inputGroup}><label className={styles.label}>Fabricante Equipamento</label><input name="fabricanteEquipamento" value={laudoData.fabricanteEquipamento} onChange={handleLaudoDataChange} className={styles.input} /></div>
          <div className={styles.inputGroup}><label className={styles.label}>Mês/Ano Fabric.</label><input name="mesAnoFabricEquip" value={laudoData.mesAnoFabricEquip} onChange={handleLaudoDataChange} className={styles.input} /></div>
          <div className={styles.inputGroup}><label className={styles.label}>⌀ - Pino Rei</label><input name="diametroPinoRei" value={laudoData.diametroPinoRei} onChange={handleLaudoDataChange} className={styles.input} /></div>
          <div className={styles.inputGroup}><label className={styles.label}>Data Verif. Pino Rei</label><input type="date" name="dataVerifPinoRei" value={laudoData.dataVerifPinoRei} onChange={handleLaudoDataChange} className={styles.input} /></div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>4. Photos</legend>
        <div className={styles.grid}>
          <div className={styles.inputGroup}><label className={styles.label}>Foto Dianteira</label><input type="file" name="dianteira" accept="image/*" onChange={handleImageChange} className={styles.fileInput} /></div>
          <div className={styles.inputGroup}><label className={styles.label}>Foto Traseira</label><input type="file" name="traseira" accept="image/*" onChange={handleImageChange} className={styles.fileInput} /></div>
          <div className={styles.inputGroup}><label className={styles.label}>Foto do Chassi</label><input type="file" name="chassi" accept="image/*" onChange={handleImageChange} className={styles.fileInput} /></div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>5. Observações</legend>
        <p style={{ marginBottom: '10px', fontSize: '14px', color: '#ccc' }}>
          <strong>Observações automáticas:</strong> Baseadas no tipo de laudo selecionado. Você pode adicionar observações extras ao texto abaixo.
        </p>
        <div className={styles.inputGroup}>
          <textarea
            name="observacoes"
            value={laudoData.observacoes}
            onChange={handleLaudoDataChange}
            className={styles.textarea}
            rows={8}
            placeholder="As observações padrão são preenchidas automaticamente baseadas no tipo de laudo. Adicione observações extras aqui se necessário."
          ></textarea>
        </div>
      </fieldset>

      <div className={styles.submitSection}>
        <button type="submit" disabled={isSubmitting} className={styles.button} style={{
          background: 'linear-gradient(135deg, #007bff, #0056b3)',
          color: 'white',
          borderRadius: '8px',
          fontWeight: '600',
          boxShadow: '0 4px 15px rgba(0,123,255,0.4)',
          transition: 'all 0.3s ease',
          border: 'none',
          padding: '0.75rem 1.5rem'
        }}>
          {isSubmitting ? '📄 Emitindo & Baixando...' : '📋 Emitir Laudo & Baixar PDF'}
        </button>
        {message && <span className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>{message}</span>}
      </div>
    </form>
  );
}