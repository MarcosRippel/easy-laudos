// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file found' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // THIS IS THE LINE TO FIX. Ensure it uses backticks (`).
    const filename = `${Date.now()}-${file.name}`;

    const uploadsDir = path.join(process.cwd(), 'public/uploads');

    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    console.log(`File uploaded to: ${filePath}`);

    // Use /api/uploads/ path so files are served dynamically via API route.
    // Next.js `next start` (production) does NOT serve files added to public/ after build.
    const publicPath = `/api/uploads/${filename}`;
    return NextResponse.json({ success: true, url: publicPath });

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, message: 'File upload failed' }, { status: 500 });
  }
}