import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getSessionFromRequest } from '@/lib/middleware-auth';

const FEEDBACK_DIR = path.join(process.cwd(), 'data');
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, 'feedbacks.jsonl');
const AUDIO_DIR = path.join(process.cwd(), 'public', 'uploads', 'feedback');
const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_TEXT_LENGTH = 4000;
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-m4a',
]);

function extensionFor(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a';
  if (mime.includes('mpeg')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  return 'bin';
}

export async function POST(request: NextRequest) {
  try {
    const user = getSessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const form = await request.formData();
    const text = String(form.get('text') || '').trim().slice(0, MAX_TEXT_LENGTH);
    const page = String(form.get('page') || '').slice(0, 200);
    const userAgent = request.headers.get('user-agent')?.slice(0, 300) || '';
    const audio = form.get('audio');

    if (!text && !(audio instanceof File && audio.size > 0)) {
      return NextResponse.json({ error: 'Envie texto ou áudio' }, { status: 400 });
    }

    await fs.mkdir(FEEDBACK_DIR, { recursive: true });
    await fs.mkdir(AUDIO_DIR, { recursive: true });

    const id = randomUUID();
    let audioPath: string | null = null;
    let audioMime: string | null = null;
    let audioBytes = 0;

    if (audio instanceof File && audio.size > 0) {
      if (audio.size > MAX_AUDIO_BYTES) {
        return NextResponse.json({ error: 'Áudio acima de 8 MB' }, { status: 413 });
      }
      if (!ALLOWED_AUDIO_TYPES.has(audio.type)) {
        return NextResponse.json({ error: 'Formato de áudio não suportado' }, { status: 415 });
      }
      const ext = extensionFor(audio.type);
      const filename = `${id}.${ext}`;
      const fullPath = path.join(AUDIO_DIR, filename);
      const buf = Buffer.from(await audio.arrayBuffer());
      await fs.writeFile(fullPath, buf);
      audioPath = `/uploads/feedback/${filename}`;
      audioMime = audio.type;
      audioBytes = audio.size;
    }

    const entry = {
      id,
      createdAt: new Date().toISOString(),
      userId: user.id,
      username: user.username,
      role: user.role,
      page,
      userAgent,
      text: text || null,
      audioPath,
      audioMime,
      audioBytes,
    };

    await fs.appendFile(FEEDBACK_FILE, JSON.stringify(entry) + '\n', 'utf8');

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error('[feedback] erro ao salvar:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Lista os últimos N feedbacks (somente admin)
  try {
    const user = getSessionFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    let entries: unknown[] = [];
    try {
      const raw = await fs.readFile(FEEDBACK_FILE, 'utf8');
      entries = raw
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          try { return JSON.parse(line); } catch { return null; }
        })
        .filter(Boolean) as unknown[];
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') throw e;
    }
    return NextResponse.json({ entries: entries.reverse().slice(0, 200) });
  } catch (err) {
    console.error('[feedback] erro ao listar:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
