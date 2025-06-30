import ChecklistForm from "@/components/laudos/ChecklistForm";
import { prisma } from '@/lib/prisma';

async function getChecklistData() {
  const [clients, nextOsData, temporalCodeData] = await Promise.all([
    prisma.client.findMany(),
    fetch(`${process.env.NEXT_PUBLIC_URL}/api/laudos/next-os`, {
      cache: 'no-store',
    }).then(res => res.json()),
    fetch(`${process.env.NEXT_PUBLIC_URL}/api/temporal-code`, {
      cache: 'no-store',
    }).then(res => res.json())
  ]);

  return {
    clients,
    nextOrdemServico: nextOsData.nextOS,
    temporalCode: temporalCodeData.code
  };
}

export default async function ChecklistPage() {
  const { clients, nextOrdemServico, temporalCode } = await getChecklistData();

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
          📋 Laudo CHECKLIST - Relatório de Preventiva
        </h1>
        
        <ChecklistForm 
          clients={clients}
          nextOrdemServico={nextOrdemServico}
          temporalCode={temporalCode}
        />
      </div>
    </div>
  );
}