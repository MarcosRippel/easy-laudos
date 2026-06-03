import QuintaRodaForm from "@/components/laudos/QuintaRodaForm";
import { prisma } from '@/lib/prisma';
import { getTemporalCode } from '@/lib/temporal-code';

async function getNextOrdemServico(): Promise<string> {
  try {
    // Buscar TODOS os números de OS para encontrar o máximo real
    const allLaudos = await prisma.laudo.findMany({
      select: { ordemServico: true },
    });

    const numbers = allLaudos
      .map(l => parseInt(l.ordemServico, 10))
      .filter(n => !isNaN(n));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    return String(maxNumber + 1).padStart(6, '0');
  } catch (error) {
    console.error('Failed to get next OS:', error);
    return '000001';
  }
}



async function getQuintaRodaData() {
  const [clients, nextOrdemServico, temporalCode, adminSettings] = await Promise.all([
    prisma.client.findMany(),
    getNextOrdemServico(),
    getTemporalCode(),
    prisma.adminSetting.findFirst(),
  ]);

  return { clients, nextOrdemServico, temporalCode, nomeResponsavel: adminSettings?.nomeResponsavel || '' };
}

export default async function QuintaRodaPage() {
  const { clients, nextOrdemServico, temporalCode, nomeResponsavel } = await getQuintaRodaData();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
      minHeight: '100vh',
      padding: '2rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'rgba(42, 42, 46, 0.95)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#f1f1f1',
          fontSize: '2rem',
          fontWeight: '700'
        }}>
          🔧 Laudo de Quinta Roda - Inspeção Técnica de Quinta Roda
        </h1>

        <QuintaRodaForm
          clients={clients}
          nextOrdemServico={nextOrdemServico || ''}
          temporalCode={temporalCode || ''}
          nomeResponsavel={nomeResponsavel}
        />
      </div>
    </div>
  );
}