import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const roleEnum = pgEnum('role', ['super_admin', 'admin', 'manager', 'employee']);
export const statusEnum = pgEnum('status', ['active', 'inactive', 'suspended']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'trialing', 'past_due', 'canceled', 'unpaid']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['starter', 'professional', 'enterprise']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);
export const announcementTypeEnum = pgEnum('announcement_type', ['info', 'warning', 'maintenance', 'feature']);
export const targetAudienceEnum = pgEnum('target_audience', ['all', 'admins', 'trial', 'paid']);
export const notificationTypeEnum = pgEnum('notification_type', ['payment_reminder', 'stock_alert', 'subscription_alert', 'system_announcement', 'custom']);
export const notificationStatusEnum = pgEnum('notification_status', ['sent', 'pending', 'failed']);
export const languageEnum = pgEnum('language', ['en', 'ur', 'ar']);

// Companies table (Multi-tenant support)
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  domain: varchar("domain"),
  logo: varchar("logo"),
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  website: varchar("website"),
  timezone: varchar("timezone").default('UTC'),
  currency: varchar("currency").default('USD'),
  language: languageEnum("language").notNull().default('en'),
  status: statusEnum("status").notNull().default('active'),
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionId: varchar("subscription_id"),
  customerId: varchar("customer_id"), // Stripe customer ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique().notNull(),
  stripePriceId: varchar("stripe_price_id").notNull(),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: integer("cancel_at_period_end").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table (Updated for multi-tenancy)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: 'cascade' }),
  email: varchar("email").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default('employee'),
  status: statusEnum("status").notNull().default('active'),
  language: languageEnum("language").notNull().default('en'),
  permissions: jsonb("permissions").default({}),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("users_email_company_idx").on(table.email, table.companyId),
]);

// Customers table (Updated for multi-tenancy)
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  tags: text("tags").array(),
  totalPurchases: decimal("total_purchases", { precision: 12, scale: 2 }).default('0'),
  lastPurchase: timestamp("last_purchase"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("customers_company_idx").on(table.companyId),
]);

// Product Categories table
export const productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("categories_company_idx").on(table.companyId),
]);

// Inventory table (Enhanced for SaaS)
export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid("category_id").references(() => productCategories.id, { onDelete: 'set null' }),
  productName: text("product_name").notNull(),
  description: text("description"),
  sku: varchar("sku"),
  barcode: varchar("barcode"),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(10),
  maxStock: integer("max_stock"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 12, scale: 2 }),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  dimensions: jsonb("dimensions"), // {length, width, height}
  images: text("images").array(),
  tags: text("tags").array(),
  status: statusEnum("status").notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("inventory_company_idx").on(table.companyId),
  index("inventory_sku_company_idx").on(table.sku, table.companyId),
]);

// Invoices table (Enhanced sales system)
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: 'cascade' }),
  invoiceNumber: varchar("invoice_number").notNull(),
  status: invoiceStatusEnum("status").notNull().default('draft'),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default('0'),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").default('USD'),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("invoices_company_idx").on(table.companyId),
  index("invoices_number_company_idx").on(table.invoiceNumber, table.companyId),
]);

// Invoice Items table
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: uuid("product_id").references(() => inventory.id, { onDelete: 'set null' }),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
});

// Sales table (Updated for multi-tenancy)
export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: 'cascade' }),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: 'set null' }),
  productId: uuid("product_id").notNull().references(() => inventory.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sales_company_idx").on(table.companyId),
  index("sales_date_idx").on(table.createdAt),
]);

// Notifications table (Enhanced for SaaS)
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  status: notificationStatusEnum("status").notNull().default('pending'),
  isGlobal: integer("is_global").default(0), // For system-wide announcements
  actionUrl: varchar("action_url"),
  metadata: jsonb("metadata"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("notifications_company_idx").on(table.companyId),
  index("notifications_user_idx").on(table.userId),
]);

// System Announcements table (for SaaS owner)
export const systemAnnouncements = pgTable("system_announcements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: announcementTypeEnum("type").notNull().default('info'),
  targetAudience: targetAudienceEnum("target_audience").notNull().default('all'),
  isActive: integer("is_active").default(1),
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity Logs table (for audit trail)
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  action: varchar("action").notNull(),
  resource: varchar("resource").notNull(),
  resourceId: varchar("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("activity_logs_company_idx").on(table.companyId),
  index("activity_logs_user_idx").on(table.userId),
  index("activity_logs_date_idx").on(table.createdAt),
]);

// Relations
export const companiesRelations = relations(companies, ({ one, many }) => ({
  users: many(users),
  customers: many(customers),
  inventory: many(inventory),
  sales: many(sales),
  notifications: many(notifications),
  subscriptions: many(subscriptions),
  productCategories: many(productCategories),
  invoices: many(invoices),
  activityLogs: many(activityLogs),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  company: one(companies, {
    fields: [subscriptions.companyId],
    references: [companies.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  customers: many(customers),
  inventory: many(inventory),
  sales: many(sales),
  notifications: many(notifications),
  invoices: many(invoices),
  activityLogs: many(activityLogs),
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  company: one(companies, {
    fields: [productCategories.companyId],
    references: [companies.id],
  }),
  products: many(inventory),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  sales: many(sales),
  invoices: many(invoices),
}));

export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  company: one(companies, {
    fields: [inventory.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [inventory.userId],
    references: [users.id],
  }),
  category: one(productCategories, {
    fields: [inventory.categoryId],
    references: [productCategories.id],
  }),
  sales: many(sales),
  invoiceItems: many(invoiceItems),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
  sales: many(sales),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(inventory, {
    fields: [invoiceItems.productId],
    references: [inventory.id],
  }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  company: one(companies, {
    fields: [sales.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  product: one(inventory, {
    fields: [sales.productId],
    references: [inventory.id],
  }),
  invoice: one(invoices, {
    fields: [sales.invoiceId],
    references: [invoices.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  company: one(companies, {
    fields: [notifications.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  company: one(companies, {
    fields: [activityLogs.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertSystemAnnouncementSchema = createInsertSchema(systemAnnouncements).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

// Additional schemas for updates
export const updateCompanySchema = insertCompanySchema.partial();
export const updateUserSchema = insertUserSchema.partial();
export const updateCustomerSchema = insertCustomerSchema.partial().omit({ userId: true, companyId: true });
export const updateInventorySchema = insertInventorySchema.partial().omit({ userId: true, companyId: true });
export const updateInvoiceSchema = insertInvoiceSchema.partial().omit({ companyId: true, userId: true });

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type UpdateCompany = z.infer<typeof updateCompanySchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type UpdateInventory = z.infer<typeof updateInventorySchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type SystemAnnouncement = typeof systemAnnouncements.$inferSelect;
export type InsertSystemAnnouncement = z.infer<typeof insertSystemAnnouncementSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Dashboard stats types
export type SuperAdminStats = {
  totalCompanies: number;
  activeSubscriptions: number;
  totalRevenue: string;
  trialCompanies: number;
  systemHealth: number;
};

export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  totalCustomers: number;
  totalProducts: number;
  monthlyRevenue: string;
  subscriptionStatus: string;
  daysLeftInTrial?: number;
};

export type UserStats = {
  totalProducts: number;
  lowStockAlerts: number;
  totalCustomers: number;
  monthlyRevenue: string;
  pendingSales: number;
};

// JWT Payload type
export type JWTPayload = {
  userId: string;
  companyId: string | null;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'employee';
  permissions?: Record<string, boolean>;
};

// Authentication types
export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  companyName: string;
  companySlug: string;
  adminName: string;
  email: string;
  password: string;
  phone?: string;
  website?: string;
};

export type AuthResponse = {
  user: User;
  company?: Company;
  token: string;
  subscription?: Subscription;
};
