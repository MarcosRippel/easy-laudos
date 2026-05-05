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

// GET - Listar todos os usuários (apenas admin)
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clients: true,
            equipments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar novo usuário (apenas admin)
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { username, password, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Username, password e role são obrigatórios' }, { status: 400 });
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}