import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/middleware-auth';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Dynamic route to serve uploaded files.
 * 
 * In Next.js production mode (`next start`), files added to `public/` AFTER
 * the build are NOT served automatically. This API route fills that gap by
 * serving files from `public/uploads/` dynamically.
 * 
 * GET /api/uploads/filename.jpg → serves public/uploads/filename.jpg
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { path: pathSegments } = await params;
    const filename = pathSegments.join('/');

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('~')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadsDir, filename);

    // Verify the file is within the uploads directory
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);

    // Determine content type from extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving upload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
