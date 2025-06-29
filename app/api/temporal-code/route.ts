import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/federal/latest', {
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lottery data');
    }

    const data = await response.json();

    const dezenas: string[] = data.dezenas;
    if (!dezenas || dezenas.length === 0) {
      throw new Error('Dezenas not found in lottery data');
    }

    const temporalCode = dezenas.map(d => d.slice(-1)).join('');

    return NextResponse.json({ code: temporalCode });

  } catch (error) {
    console.error('Failed to generate temporal code:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Could not generate temporal code' }),
      { status: 500 }
    );
  }
}