/* Server-only auth utilities */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'luxe-store-jwt-secret-key-2024'
);

const COOKIE_NAME = 'luxe-auth-token';

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Sign a JWT token with the given payload.
 * Token expires in 7 days.
 */
export async function signToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify a JWT token and return the decoded payload.
 * Returns null if the token is invalid or expired.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

/**
 * Create a JWT and set it as an httpOnly cookie with 7-day expiry.
 */
export async function setAuthCookie(payload: JWTPayload): Promise<void> {
  const token = await signToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
}

/**
 * Get the current authenticated user from the auth cookie.
 * Returns the JWT payload or null if not authenticated.
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  return verifyToken(token);
}

/**
 * Clear the auth cookie, effectively logging the user out.
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
