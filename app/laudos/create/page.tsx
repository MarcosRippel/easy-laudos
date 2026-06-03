// app/laudos/create/page.tsx
import CreateLaudoForm from "@/components/laudos/CreateLaudoForm";
import { prisma } from '@/lib/prisma';
import type { Client } from '@prisma/client';
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


async function getData() {
  const [clients, nextOrdemServico, temporalCode] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
    getNextOrdemServico(),
    getTemporalCode()
  ]);

  return { clients, nextOrdemServico, temporalCode };
}

export default async function CreateLaudoPage() {
  const { clients, nextOrdemServico, temporalCode } = await getData();

  return (
    <div>
      <h2 style={{
        textAlign: 'center',
        fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
        fontWeight: '600',
        background: 'linear-gradient(135deg, #007bff, #0056b3)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 2px 10px rgba(0,123,255,0.3)',
        marginBottom: '2rem'
      }}>
        📋 Emitir Laudo
      </h2>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '0 1rem'
      }}>
        <CreateLaudoForm
          clients={clients}
          nextOrdemServico={nextOrdemServico}
          temporalCode={temporalCode}
        />
      </div>
    </div>
  );
}