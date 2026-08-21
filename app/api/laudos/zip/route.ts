import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { getSessionFromRequest } from '@/lib/middleware-auth';

interface LaudoEntry {
  id: string;
  type: string;
  ordemServico: string;
}

export async function POST(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const laudos: LaudoEntry[] = body.laudos ?? [];

  if (laudos.length === 0) {
    return NextResponse.json({ error: 'Nenhum laudo selecionado' }, { status: 400 });
  }

  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = request.headers.get('host') ?? 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  const cookieHeader = request.headers.get('cookie') ?? '';

  const pdfs: { filename: string; buffer: Buffer }[] = [];

  for (const laudo of laudos) {
    try {
      let res: Response;
      if (laudo.type === 'PINO_REI') {
        res = await fetch(`${baseUrl}/api/laudos/pino-rei/pdf?id=${laudo.id}`, {
          headers: { cookie: cookieHeader },
        });
      } else if (laudo.type === 'QUINTA_RODA') {
        res = await fetch(`${baseUrl}/api/laudos/quinta-roda/pdf?id=${laudo.id}`, {
          headers: { cookie: cookieHeader },
        });
      } else {
        res = await fetch(`${baseUrl}/api/laudos/pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
          body: JSON.stringify({ laudoId: laudo.id, type: laudo.type.toLowerCase() }),
        });
      }

      if (!res.ok) continue;

      const buf = Buffer.from(await res.arrayBuffer());
      pdfs.push({
        filename: `laudo-${laudo.type.toLowerCase()}-${laudo.ordemServico}.pdf`,
        buffer: buf,
      });
    } catch {
      // continua para o próximo se um PDF falhar
    }
  }

  if (pdfs.length === 0) {
    return NextResponse.json({ error: 'Falha ao gerar os PDFs' }, { status: 500 });
  }

  const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('data', chunk => chunks.push(Buffer.from(chunk)));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
    for (const pdf of pdfs) {
      archive.append(pdf.buffer, { name: pdf.filename });
    }
    archive.finalize();
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="laudos-${date}.zip"`,
      'Content-Length': zipBuffer.length.toString(),
    },
  });
}
