import type { RequestHandler } from "express";
import { verifyToken } from "./jwt";
import { storage } from "./storage";
import type { JWTPayload } from "@shared/schema";

// JWT-based authentication middleware
export const authenticateJWT: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Verify user still exists and is active
    const user = await storage.getUser(payload.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    // For non-super-admin users, verify company exists and is active
    if (payload.role !== 'super_admin' && payload.companyId) {
      const company = await storage.getCompany(payload.companyId);
      if (!company || company.status !== 'active') {
        return res.status(401).json({ message: "Company not found or inactive" });
      }
      (req as any).company = company;
    }

    // Add user and payload info to request
    (req as any).user = user;
    (req as any).jwtPayload = payload;
    
    next();
  } catch (error) {
    console.error("JWT Auth middleware error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]): RequestHandler => {
  return (req, res, next) => {
    const payload = (req as any).jwtPayload as JWTPayload;
    
    if (!payload || !roles.includes(payload.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
};

// Multi-tenant data isolation middleware
export const requireTenantAccess: RequestHandler = (req, res, next) => {
  const payload = (req as any).jwtPayload as JWTPayload;
  
  // Super admin can access all data
  if (payload.role === 'super_admin') {
    return next();
  }
  
  // Regular users can only access their company's data
  if (!payload.companyId) {
    return res.status(403).json({ message: "No company access" });
  }
  
  // Add companyId to request for data filtering
  (req as any).companyId = payload.companyId;
  
  next();
};

// Permission-based authorization middleware
export const requirePermission = (permission: string): RequestHandler => {
  return (req, res, next) => {
    const payload = (req as any).jwtPayload as JWTPayload;
    
    // Super admin has all permissions
    if (payload.role === 'super_admin') {
      return next();
    }
    
    // Admin has most permissions by default
    if (payload.role === 'admin') {
      return next();
    }
    
    // Check specific permissions
    if (payload.permissions && payload.permissions[permission]) {
      return next();
    }
    
    return res.status(403).json({ message: `Permission '${permission}' required` });
  };
};