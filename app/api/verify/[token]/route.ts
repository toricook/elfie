import { NextResponse } from 'next/server';
import { verifyParticipant } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const displayName = formData.get('displayName') as string | null;

    if (!displayName || displayName.trim() === '') {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    const participant = await verifyParticipant(token, displayName.trim());
    if (!participant) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }
    
    // Redirect to success page
    return NextResponse.redirect(new URL(`/verify?token=${token}`, request.url));
  } catch (error) {
    console.error('Error verifying participant:', error);
    return NextResponse.json(
      { error: 'Failed to verify participant' },
      { status: 500 }
    );
  }
}
