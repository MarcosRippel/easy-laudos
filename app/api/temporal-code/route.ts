import { NextRequest, NextResponse } from 'next/server';
import { getTemporalCode } from '@/lib/temporal-code';
import { getSessionFromRequest } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const code = await getTemporalCode();

    if (!code) {
      return new NextResponse(
        JSON.stringify({ message: 'Could not generate temporal code' }),
        { status: 500 }
      );
    }

    return NextResponse.json({ code });

  } catch (error) {
    console.error('Failed to generate temporal code:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Could not generate temporal code' }),
      { status: 500 }
    );
  }
}