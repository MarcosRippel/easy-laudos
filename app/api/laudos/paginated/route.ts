import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de paginação
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Parâmetros de filtros
    const type = searchParams.get('type') || '';
    const clientId = searchParams.get('clientId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const search = searchParams.get('search') || '';
    
    // Construir objeto where para filtros
    const where: Record<string, any> = {};
    
    // Filtro por tipo
    if (type) {
      where.laudoType = type;
    }
    
    // Filtro por cliente
    if (clientId) {
      where.clientId = clientId;
    }
    
    // Filtro por data
    if (dateFrom) {
      where.dataEmissao = {
        ...where.dataEmissao,
        gte: new Date(dateFrom)
      };
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Incluir todo o dia
      where.dataEmissao = {
        ...where.dataEmissao,
        lte: toDate
      };
    }
    
    // Filtro de busca (OS, placa, cliente)
    // SQLite: LIKE é case-insensitive ASCII por padrão; `mode: 'insensitive'` não
    // é suportado pelo provider SQLite e dispara erro de validação no Prisma 6.
    if (search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { ordemServico: { contains: searchTerm } },
        { vehicle: { placa: { contains: searchTerm } } },
        { client: { name: { contains: searchTerm } } },
      ];
    }
    
    // Buscar laudos com paginação e total
    const [laudos, totalCount] = await Promise.all([
      prisma.laudo.findMany({
        where,
        include: {
          client: true,
          vehicle: true,
        },
        orderBy: {
          dataEmissao: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.laudo.count({ where })
    ]);
    
    // Calcular informações de paginação
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      laudos,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar laudos paginados:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Erro ao buscar laudos paginados' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}