import { NextResponse } from 'next/server';
import { getTemporalCode } from '@/lib/temporal-code';

export async function GET() {
  try {
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