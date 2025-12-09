import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

// Função para verificar se o usuário é admin
async function isAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('gts_session');
  
  if (!sessionCookie) {
    return false;
  }
  
  try {
    const sessionData = JSON.parse(sessionCookie.value);
    return sessionData.role === 'admin';
  } catch {
    return false;
  }
}

// PUT - Atualizar usuário (senha, status, etc)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { password, isActive, role } = body;

    const updateData: any = {};

    if (password !== undefined) {
      updateData.password = hashPassword(password);
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Deletar usuário (apenas admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    // Não permitir deletar o próprio usuário admin
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gts_session');
    if (sessionCookie) {
      const sessionData = JSON.parse(sessionCookie.value);
      if (sessionData.userId === id) {
        return NextResponse.json({ error: 'Não é possível deletar seu próprio usuário' }, { status: 400 });
      }
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}