import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      domain: 'inspetor.terpens.com.br'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}