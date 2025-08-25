import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { isAuthenticated, requireRole, requireSuperAdmin, checkCompanyStatus } from "./authMiddleware";
import { insertUserSchema, insertCustomerSchema, insertInventorySchema, insertSaleSchema, updateUserSchema, updateCustomerSchema, updateInventorySchema, insertCompanySchema, updateCompanySchema } from "@shared/schema";
import { generateToken } from "./jwt";
import bcrypt from "bcrypt";
import { seedDatabase } from "./seed";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with seed data (skip if there are schema issues)
  try {
    await seedDatabase();
  } catch (error: any) {
    console.log("Skipping database seeding due to schema mismatch:", error.message);
  }
  
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const user = req.user;
      let company = null;
      
      // Get company info if user belongs to one
      if (user.companyId) {
        company = await storage.getCompany(user.companyId);
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, company });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    // Clear the JWT cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.json({ message: "Logged out successfully" });
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, role } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.role !== role) {
        return res.status(401).json({ message: "Role mismatch" });
      }

      if (user.status !== 'active') {
        return res.status(401).json({ message: "Account is inactive" });
      }

      // Check company status if user belongs to a company
      let company = null;
      let companyStatus = 'active';
      
      if (user.companyId) {
        company = await storage.getCompany(user.companyId);
        if (company) {
          companyStatus = company.status;
        }
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyStatus,
      });

      // Set JWT as HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, company, companyStatus });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Super Admin routes (SaaS Owner)
  app.get('/api/super-admin/companies', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post('/api/super-admin/companies', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.patch('/api/super-admin/companies/:id/status', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'active' or 'inactive'" });
      }

      const company = await storage.updateCompany(id, { status });
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json(company);
    } catch (error) {
      console.error("Error updating company status:", error);
      res.status(500).json({ message: "Failed to update company status" });
    }
  });

  app.get('/api/super-admin/stats', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSuperAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching super admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Company Admin routes
  app.get('/api/admin/users', isAuthenticated, requireRole('admin'), checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const users = await storage.getAllUsers(companyId);
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users', isAuthenticated, requireRole('admin'), checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const userData = insertUserSchema.parse({ ...req.body, companyId });
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/admin/users/:id', isAuthenticated, requireRole('admin'), checkCompanyStatus, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userData = updateUserSchema.parse(req.body);
      
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.patch('/api/admin/users/:id/status', isAuthenticated, requireRole('admin'), checkCompanyStatus, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const user = await storage.updateUserStatus(id, status);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.post('/api/admin/users/:id/reset-password', isAuthenticated, requireRole('admin'), checkCompanyStatus, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { companyId } = req.user;
      
      // Check if user exists and belongs to same company
      const user = await storage.getUser(id);
      if (!user || user.companyId !== companyId) {
        return res.status(404).json({ message: "User not found" });
      }

      // In a real application, you would:
      // 1. Generate a secure password reset token
      // 2. Store the token with expiration in the database
      // 3. Send an email with the reset link
      // For demo purposes, we'll just generate a temporary password and return it
      
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      await storage.updateUser(id, { password: hashedPassword });
      
      // In production, this should be sent via email, not returned in response
      res.json({ 
        message: "Password reset successfully", 
        tempPassword: tempPassword, // Only for demo - remove in production
        note: "In production, this would be sent via email"
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, requireRole('admin'), checkCompanyStatus, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { companyId } = req.user;
      
      // Check if user exists and belongs to same company
      const user = await storage.getUser(id);
      if (!user || user.companyId !== companyId) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deletion of the last admin
      if (user.role === 'admin') {
        const allAdmins = await storage.getAllUsers(companyId);
        const activeAdmins = allAdmins.filter(u => u.role === 'admin' && u.status === 'active');
        if (activeAdmins.length <= 1) {
          return res.status(400).json({ message: "Cannot delete the last active admin" });
        }
      }

      // For now, we'll just deactivate the user instead of actually deleting
      // to preserve data integrity
      const deactivatedUser = await storage.updateUserStatus(id, 'inactive');
      res.json({ message: "User deactivated successfully", user: deactivatedUser });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, requireRole('admin'), checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const stats = await storage.getAdminStats(companyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Company settings routes (Admin only)
  app.get('/api/admin/company', isAuthenticated, requireRole('admin'), checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.patch('/api/admin/company', isAuthenticated, requireRole('admin'), checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const companyData = updateCompanySchema.parse(req.body);
      
      const company = await storage.updateCompany(companyId, companyData);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // User stats route
  app.get('/api/user/stats', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { userId, companyId } = req.user;
      const stats = await storage.getUserStats(userId, companyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Customer routes (Multi-tenant)
  app.get('/api/customers', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const customers = await storage.getCustomers(companyId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post('/api/customers', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { userId, companyId } = req.user;
      const customerData = insertCustomerSchema.parse({ ...req.body, userId, companyId });
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.patch('/api/customers/:id', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const { id } = req.params;
      const customerData = updateCustomerSchema.parse(req.body);
      
      const customer = await storage.updateCustomer(id, customerData, companyId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const { id } = req.params;
      
      const success = await storage.deleteCustomer(id, companyId);
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Inventory routes (Multi-tenant)
  app.get('/api/inventory', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const inventory = await storage.getInventory(companyId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get('/api/inventory/low-stock', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const lowStockItems = await storage.getLowStockItems(companyId);
      res.json(lowStockItems);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.post('/api/inventory', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { userId, companyId } = req.user;
      const itemData = insertInventorySchema.parse({ ...req.body, userId, companyId });
      const item = await storage.createInventoryItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.patch('/api/inventory/:id', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const { id } = req.params;
      const itemData = updateInventorySchema.parse(req.body);
      
      const item = await storage.updateInventoryItem(id, itemData, companyId);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete('/api/inventory/:id', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const { id } = req.params;
      
      const success = await storage.deleteInventoryItem(id, companyId);
      if (!success) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.json({ message: "Inventory item deleted successfully" });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Sales routes (Multi-tenant)
  app.get('/api/sales', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const sales = await storage.getSales(companyId);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get('/api/sales/recent', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { companyId } = req.user;
      const limit = parseInt(req.query.limit as string) || 10;
      const sales = await storage.getRecentSales(companyId, limit);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching recent sales:", error);
      res.status(500).json({ message: "Failed to fetch recent sales" });
    }
  });

  app.post('/api/sales', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { userId, companyId } = req.user;
      const saleData = insertSaleSchema.parse({ ...req.body, userId, companyId });
      const sale = await storage.createSale(saleData);
      res.json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // Notifications routes (Multi-tenant)
  app.get('/api/notifications', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { userId, companyId } = req.user;
      const notifications = await storage.getNotifications(userId, companyId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, checkCompanyStatus, async (req: any, res) => {
    try {
      const { userId, companyId } = req.user;
      const count = await storage.getUnreadNotificationCount(userId, companyId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
