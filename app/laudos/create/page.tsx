// app/laudos/create/page.tsx
import CreateLaudoForm from "@/components/laudos/CreateLaudoForm";
import { prisma } from '@/lib/prisma';
import type { Client } from '@prisma/client';

async function getData() {
  const clientPromise = prisma.client.findMany({
    orderBy: { name: 'asc' },
  });

  const nextOsPromise = fetch(`${process.env.NEXT_PUBLIC_URL}/api/laudos/next-os`, {
    cache: 'no-store',
  }).then(res => res.json());

  const temporalCodePromise = fetch(`${process.env.NEXT_PUBLIC_URL}/api/temporal-code`, {
    cache: 'no-store',
  }).then(res => res.json());

  const [clients, nextOsData, temporalCodeData] = await Promise.all([
    clientPromise,
    nextOsPromise,
    temporalCodePromise
  ]);

  return {
    clients,
    nextOrdemServico: nextOsData.nextOrdemServico,
    temporalCode: temporalCodeData.code
  };
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