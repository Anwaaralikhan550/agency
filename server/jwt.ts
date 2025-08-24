import jwt from "jsonwebtoken";
import type { JWTPayload } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

export function refreshToken(oldToken: string): string | null {
  const payload = verifyToken(oldToken);
  if (!payload) return null;
  
  // Remove JWT specific fields before creating new token
  const { iat, exp, iss, aud, ...tokenPayload } = payload as any;
  return generateToken(tokenPayload);
}