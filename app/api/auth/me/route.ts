import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  try {
    const user = getSessionFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}