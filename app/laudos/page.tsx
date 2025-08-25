'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LaudosRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a HOME onde agora está o histórico de laudos
    router.replace('/');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '50vh',
      fontSize: '1.2rem',
      color: '#666'
    }}>
      <div>
        <div>📊 Redirecionando para o Histórico de Laudos...</div>
        <div style={{ fontSize: '0.9rem', marginTop: '10px' }}>
          O histórico agora está disponível diretamente na página HOME
        </div>
      </div>
    </div>
  );
}