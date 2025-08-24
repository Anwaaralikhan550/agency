import type { RequestHandler } from "express";
import { storage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Unified auth middleware that supports both Replit Auth and traditional session auth
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    let userId: string | null = null;
    
    // Check for Replit Auth user
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      const replitUser = req.user as any;
      if (replitUser.claims?.sub) {
        userId = replitUser.claims.sub;
      }
    }
    
    // Check for traditional session auth
    if (!userId && req.session && (req.session as any).userId) {
      userId = (req.session as any).userId;
    }
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Verify user exists and is active
    const user = await storage.getUser(userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Add user info to request for easy access
    (req as any).userId = userId;
    (req as any).currentUser = user;
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export function createSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}