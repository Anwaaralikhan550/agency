import {
  users,
  companies,
  customers,
  inventory,
  sales,
  notifications,
  subscriptions,
  type User,
  type UpsertUser,
  type InsertUser,
  type UpdateUser,
  type Company,
  type InsertCompany,
  type UpdateCompany,
  type Customer,
  type InsertCustomer,
  type UpdateCustomer,
  type Inventory,
  type InsertInventory,
  type UpdateInventory,
  type Sale,
  type InsertSale,
  type Notification,
  type InsertNotification,
  type Subscription,
  type InsertSubscription,
  type AdminStats,
  type UserStats,
  type SuperAdminStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, count, sum, desc, lt, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Company operations (Multi-tenant)
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyBySlug(slug: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: UpdateCompany): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  getCompanySubscription(companyId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Authentication operations
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailAndCompany(email: string, companyId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: UpdateUser): Promise<User | undefined>;
  updateUserLastLogin(id: string): Promise<void>;
  
  // Customer operations (Multi-tenant)
  getCustomers(companyId: string, userId?: string): Promise<Customer[]>;
  getCustomer(id: string, companyId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: UpdateCustomer, companyId: string): Promise<Customer | undefined>;
  deleteCustomer(id: string, companyId: string): Promise<boolean>;
  
  // Inventory operations (Multi-tenant)
  getInventory(companyId: string, userId?: string): Promise<Inventory[]>;
  getInventoryItem(id: string, companyId: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, item: UpdateInventory, companyId: string): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string, companyId: string): Promise<boolean>;
  getLowStockItems(companyId: string): Promise<Inventory[]>;
  
  // Sales operations (Multi-tenant)
  getSales(companyId: string, userId?: string): Promise<Sale[]>;
  getSale(id: string, companyId: string): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  getRecentSales(companyId: string, limit?: number): Promise<Sale[]>;
  
  // Notification operations (Multi-tenant)
  getNotifications(userId: string, companyId?: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationSent(id: string): Promise<void>;
  getUnreadNotificationCount(userId: string, companyId?: string): Promise<number>;
  
  // Admin operations (Multi-tenant)
  getAllUsers(companyId?: string): Promise<User[]>;
  updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<User | undefined>;
  getAdminStats(companyId: string): Promise<AdminStats>;
  
  // Super Admin operations
  getSuperAdminStats(): Promise<SuperAdminStats>;
  
  // User stats operations
  getUserStats(userId: string, companyId: string): Promise<UserStats>;
}

export class DatabaseStorage implements IStorage {
  // Company operations
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.slug, slug));
    return company;
  }

  async createCompany(companyData: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(companyData).returning();
    return company;
  }

  async updateCompany(id: string, companyData: UpdateCompany): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ ...companyData, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(companies.createdAt);
  }

  async getCompanySubscription(companyId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.companyId, companyId));
    return subscription;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(subscriptionData).returning();
    return subscription;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByEmailAndCompany(email: string, companyId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.companyId, companyId)));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: UpdateUser): Promise<User | undefined> {
    const updateData = { ...userData };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  // Customer operations (Multi-tenant)
  async getCustomers(companyId: string, userId?: string): Promise<Customer[]> {
    const conditions = [eq(customers.companyId, companyId)];
    if (userId) {
      conditions.push(eq(customers.userId, userId));
    }
    return await db.select().from(customers).where(and(...conditions));
  }

  async getCustomer(id: string, companyId: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  async updateCustomer(id: string, customerData: UpdateCustomer, companyId: string): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Inventory operations (Multi-tenant)
  async getInventory(companyId: string, userId?: string): Promise<Inventory[]> {
    const conditions = [eq(inventory.companyId, companyId)];
    if (userId) {
      conditions.push(eq(inventory.userId, userId));
    }
    return await db.select().from(inventory).where(and(...conditions));
  }

  async getInventoryItem(id: string, companyId: string): Promise<Inventory | undefined> {
    const [item] = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.id, id), eq(inventory.companyId, companyId)));
    return item;
  }

  async createInventoryItem(itemData: InsertInventory): Promise<Inventory> {
    const [item] = await db.insert(inventory).values(itemData).returning();
    return item;
  }

  async updateInventoryItem(id: string, itemData: UpdateInventory, companyId: string): Promise<Inventory | undefined> {
    const [item] = await db
      .update(inventory)
      .set({ ...itemData, updatedAt: new Date() })
      .where(and(eq(inventory.id, id), eq(inventory.companyId, companyId)))
      .returning();
    return item;
  }

  async deleteInventoryItem(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(inventory)
      .where(and(eq(inventory.id, id), eq(inventory.companyId, companyId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getLowStockItems(companyId: string): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(and(
        eq(inventory.companyId, companyId),
        lt(inventory.stock, inventory.minStock)
      ));
  }

  // Sales operations (Multi-tenant)
  async getSales(companyId: string, userId?: string): Promise<Sale[]> {
    const conditions = [eq(sales.companyId, companyId)];
    if (userId) {
      conditions.push(eq(sales.userId, userId));
    }
    return await db
      .select()
      .from(sales)
      .where(and(...conditions))
      .orderBy(desc(sales.createdAt));
  }

  async getSale(id: string, companyId: string): Promise<Sale | undefined> {
    const [sale] = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), eq(sales.companyId, companyId)));
    return sale;
  }

  async createSale(saleData: InsertSale): Promise<Sale> {
    const [sale] = await db.insert(sales).values(saleData).returning();
    
    // Update inventory stock
    await db
      .update(inventory)
      .set({
        stock: sql`stock - ${saleData.quantity}`
      })
      .where(eq(inventory.id, saleData.productId));
    
    return sale;
  }

  async getRecentSales(companyId: string, limit: number = 10): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(eq(sales.companyId, companyId))
      .orderBy(desc(sales.createdAt))
      .limit(limit);
  }

  // Notification operations (Multi-tenant)
  async getNotifications(userId: string, companyId?: string): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId)];
    if (companyId) {
      conditions.push(eq(notifications.companyId, companyId));
    }
    return await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async markNotificationSent(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ status: 'sent' })
      .where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string, companyId?: string): Promise<number> {
    const conditions = [
      eq(notifications.userId, userId),
      eq(notifications.status, 'pending')
    ];
    if (companyId) {
      conditions.push(eq(notifications.companyId, companyId));
    }
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(...conditions));
    return result.count;
  }

  // Admin operations (Multi-tenant)
  async getAllUsers(companyId?: string): Promise<User[]> {
    if (companyId) {
      return await db
        .select()
        .from(users)
        .where(eq(users.companyId, companyId))
        .orderBy(desc(users.createdAt));
    }
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAdminStats(companyId: string): Promise<AdminStats> {
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.companyId, companyId));
    
    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.companyId, companyId), eq(users.status, 'active')));
    
    const [totalCustomersResult] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.companyId, companyId));
    
    const [totalProductsResult] = await db
      .select({ count: count() })
      .from(inventory)
      .where(eq(inventory.companyId, companyId));
    
    const [monthlyRevenueResult] = await db
      .select({ total: sum(sales.totalPrice) })
      .from(sales)
      .where(and(
        eq(sales.companyId, companyId),
        sql`${sales.createdAt} >= date_trunc('month', now())`
      ));
    
    const company = await this.getCompany(companyId);
    const subscription = await this.getCompanySubscription(companyId);
    
    const subscriptionStatus = subscription?.status || 'trial';
    let daysLeftInTrial;
    if (company?.trialEndsAt && new Date() < company.trialEndsAt) {
      daysLeftInTrial = Math.ceil((company.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      totalUsers: totalUsersResult.count,
      activeUsers: activeUsersResult.count,
      totalCustomers: totalCustomersResult.count,
      totalProducts: totalProductsResult.count,
      monthlyRevenue: monthlyRevenueResult.total || '0',
      subscriptionStatus,
      daysLeftInTrial,
    };
  }

  // Super Admin operations
  async getSuperAdminStats(): Promise<SuperAdminStats> {
    const [totalCompaniesResult] = await db.select({ count: count() }).from(companies);
    
    const [activeSubscriptionsResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
    
    const [trialCompaniesResult] = await db
      .select({ count: count() })
      .from(companies)
      .where(sql`${companies.trialEndsAt} > now()`);
    
    const [totalRevenueResult] = await db
      .select({ total: sum(sales.totalPrice) })
      .from(sales);
    
    return {
      totalCompanies: totalCompaniesResult.count,
      activeSubscriptions: activeSubscriptionsResult.count,
      totalRevenue: totalRevenueResult.total || '0',
      trialCompanies: trialCompaniesResult.count,
      systemHealth: 99.9, // This would be calculated based on system metrics
    };
  }

  // User stats operations  
  async getUserStats(userId: string, companyId: string): Promise<UserStats> {
    const [totalProductsResult] = await db
      .select({ count: count() })
      .from(inventory)
      .where(and(eq(inventory.userId, userId), eq(inventory.companyId, companyId)));

    const lowStockItems = await this.getLowStockItems(companyId);

    const [totalCustomersResult] = await db
      .select({ count: count() })
      .from(customers)
      .where(and(eq(customers.userId, userId), eq(customers.companyId, companyId)));

    const [monthlyRevenueResult] = await db
      .select({ total: sum(sales.totalPrice) })
      .from(sales)
      .where(and(
        eq(sales.userId, userId),
        eq(sales.companyId, companyId),
        sql`${sales.createdAt} >= date_trunc('month', now())`
      ));
    
    const [pendingSalesResult] = await db
      .select({ count: count() })
      .from(sales)
      .where(and(
        eq(sales.userId, userId),
        eq(sales.companyId, companyId),
        sql`${sales.createdAt} >= date_trunc('day', now())`
      ));

    return {
      totalProducts: totalProductsResult.count,
      lowStockAlerts: lowStockItems.length,
      totalCustomers: totalCustomersResult.count,
      monthlyRevenue: monthlyRevenueResult.total || '0',
      pendingSales: pendingSalesResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
