import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Logout realizado com sucesso' });
    
    // Remover cookie de sessão
    response.cookies.delete(SESSION_COOKIE_NAME);
    
    return response;
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}