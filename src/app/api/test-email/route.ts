import { NextRequest, NextResponse } from 'next/server';
import { testEmailConfig } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  try {
    const isValid = await testEmailConfig();
    
    if (isValid) {
      return NextResponse.json({ 
        message: 'Email configuration is valid',
        status: 'success'
      });
    } else {
      return NextResponse.json({ 
        message: 'Email configuration is invalid',
        status: 'error',
        details: 'Check your environment variables for EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({ 
      message: 'Email test failed',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
