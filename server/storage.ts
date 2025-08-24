import {
  users,
  customers,
  inventory,
  sales,
  notifications,
  type User,
  type UpsertUser,
  type InsertUser,
  type UpdateUser,
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
  type AdminStats,
  type UserStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, count, sum, desc, lt } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Authentication operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: UpdateUser): Promise<User | undefined>;
  updateUserLastLogin(id: string): Promise<void>;
  
  // Customer operations
  getCustomers(userId: string): Promise<Customer[]>;
  getCustomer(id: string, userId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: UpdateCustomer, userId: string): Promise<Customer | undefined>;
  deleteCustomer(id: string, userId: string): Promise<boolean>;
  
  // Inventory operations
  getInventory(userId: string): Promise<Inventory[]>;
  getInventoryItem(id: string, userId: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, item: UpdateInventory, userId: string): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string, userId: string): Promise<boolean>;
  getLowStockItems(userId: string): Promise<Inventory[]>;
  
  // Sales operations
  getSales(userId: string): Promise<Sale[]>;
  getSale(id: string, userId: string): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  getRecentSales(userId: string, limit?: number): Promise<Sale[]>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationSent(id: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: string, status: 'active' | 'inactive'): Promise<User | undefined>;
  getAdminStats(): Promise<AdminStats>;
  
  // User stats operations
  getUserStats(userId: string): Promise<UserStats>;
}

export class DatabaseStorage implements IStorage {
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

  // Customer operations
  async getCustomers(userId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.userId, userId));
  }

  async getCustomer(id: string, userId: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.userId, userId)));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  async updateCustomer(id: string, customerData: UpdateCustomer, userId: string): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set(customerData)
      .where(and(eq(customers.id, id), eq(customers.userId, userId)))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.userId, userId)));
    return result.rowCount > 0;
  }

  // Inventory operations
  async getInventory(userId: string): Promise<Inventory[]> {
    return await db.select().from(inventory).where(eq(inventory.userId, userId));
  }

  async getInventoryItem(id: string, userId: string): Promise<Inventory | undefined> {
    const [item] = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.id, id), eq(inventory.userId, userId)));
    return item;
  }

  async createInventoryItem(itemData: InsertInventory): Promise<Inventory> {
    const [item] = await db.insert(inventory).values(itemData).returning();
    return item;
  }

  async updateInventoryItem(id: string, itemData: UpdateInventory, userId: string): Promise<Inventory | undefined> {
    const [item] = await db
      .update(inventory)
      .set(itemData)
      .where(and(eq(inventory.id, id), eq(inventory.userId, userId)))
      .returning();
    return item;
  }

  async deleteInventoryItem(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(inventory)
      .where(and(eq(inventory.id, id), eq(inventory.userId, userId)));
    return result.rowCount > 0;
  }

  async getLowStockItems(userId: string): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(and(
        eq(inventory.userId, userId),
        lt(inventory.stock, inventory.minStock)
      ));
  }

  // Sales operations
  async getSales(userId: string): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(eq(sales.userId, userId))
      .orderBy(desc(sales.createdAt));
  }

  async getSale(id: string, userId: string): Promise<Sale | undefined> {
    const [sale] = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), eq(sales.userId, userId)));
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

  async getRecentSales(userId: string, limit: number = 10): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(eq(sales.userId, userId))
      .orderBy(desc(sales.createdAt))
      .limit(limit);
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
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

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.status, 'pending')
      ));
    return result.count;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserStatus(id: string, status: 'active' | 'inactive'): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAdminStats(): Promise<AdminStats> {
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.status, 'active'));
    
    // Mock pending payments and system health for now
    return {
      totalUsers: totalUsersResult.count,
      activeUsers: activeUsersResult.count,
      pendingPayments: 23, // This would be calculated based on subscription logic
      systemHealth: 99.9,
    };
  }

  // User stats operations
  async getUserStats(userId: string): Promise<UserStats> {
    const [totalProductsResult] = await db
      .select({ count: count() })
      .from(inventory)
      .where(eq(inventory.userId, userId));

    const lowStockItems = await this.getLowStockItems(userId);

    const [totalCustomersResult] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.userId, userId));

    const [monthlyRevenueResult] = await db
      .select({ total: sum(sales.totalPrice) })
      .from(sales)
      .where(and(
        eq(sales.userId, userId),
        sql`${sales.createdAt} >= date_trunc('month', now())`
      ));

    return {
      totalProducts: totalProductsResult.count,
      lowStockAlerts: lowStockItems.length,
      totalCustomers: totalCustomersResult.count,
      monthlyRevenue: monthlyRevenueResult[0]?.total || '0',
    };
  }
}

export const storage = new DatabaseStorage();
