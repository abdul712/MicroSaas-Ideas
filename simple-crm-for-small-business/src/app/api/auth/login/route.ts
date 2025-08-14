import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUserSession } from '@/lib/auth';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    
    // Attempt to create user session
    const result = await createUserSession(validatedData.email, validatedData.password);
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }
    
    // Set secure HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return NextResponse.json({
      user: result.user,
      message: 'Login successful',
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}