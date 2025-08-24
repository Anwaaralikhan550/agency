import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Check if super admin user already exists
    const existingSuperAdmin = await storage.getUserByEmail("superadmin@cloudbiz.com");
    if (existingSuperAdmin) {
      console.log("Database already seeded");
      return;
    }

    console.log("Seeding database...");

    // Create super admin user (SaaS owner)
    const superAdminUser = await storage.createUser({
      name: "CloudBiz Super Admin",
      email: "superadmin@cloudbiz.com",
      password: "superadmin123",
      role: "super_admin",
      status: "active",
      firstName: "CloudBiz",
      lastName: "Admin",
      companyId: null, // Super admin doesn't belong to any company
      language: "en",
    });

    // Create demo company
    const demoCompany = await storage.createCompany({
      name: "Demo Tech Solutions",
      slug: "demo-tech",
      email: "info@demotech.com",
      phone: "+1-555-0100",
      address: "123 Tech Street, Innovation City, TC 12345",
      website: "https://demotech.com",
      timezone: "UTC",
      currency: "USD",
      language: "en",
      status: "active",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    });

    // Create demo company admin
    const adminUser = await storage.createUser({
      name: "Demo Admin",
      email: "admin@demotech.com",
      password: "admin123",
      role: "admin",
      status: "active",
      firstName: "Demo",
      lastName: "Admin",
      companyId: demoCompany.id,
      language: "en",
    });

    // Create demo employee
    const demoUser = await storage.createUser({
      name: "Demo Employee",
      email: "employee@demotech.com",
      password: "employee123",
      role: "employee",
      status: "active",
      firstName: "Demo",
      lastName: "Employee",
      companyId: demoCompany.id,
      language: "en",
    });

    // Create some demo customers for the demo company
    const customer1 = await storage.createCustomer({
      companyId: demoCompany.id,
      userId: demoUser.id,
      name: "John Smith",
      phone: "+1-555-0123",
      email: "john.smith@example.com",
      address: "123 Main St, Anytown, USA 12345",
    });

    const customer2 = await storage.createCustomer({
      companyId: demoCompany.id,
      userId: demoUser.id,
      name: "Sarah Johnson",
      phone: "+1-555-0456",
      email: "sarah.johnson@example.com",
      address: "456 Oak Ave, Somewhere, USA 67890",
    });

    // Create some demo inventory for the demo company
    const product1 = await storage.createInventoryItem({
      companyId: demoCompany.id,
      userId: demoUser.id,
      productName: "Wireless Headphones",
      category: "Electronics",
      stock: 25,
      minStock: 5,
      price: "99.99",
    });

    const product2 = await storage.createInventoryItem({
      companyId: demoCompany.id,
      userId: demoUser.id,
      productName: "Smartphone Case",
      category: "Accessories",
      stock: 50,
      minStock: 10,
      price: "19.99",
    });

    const product3 = await storage.createInventoryItem({
      companyId: demoCompany.id,
      userId: demoUser.id,
      productName: "USB Cable",
      category: "Accessories",
      stock: 3,  // Low stock to trigger alert
      minStock: 10,
      price: "12.99",
    });

    // Create some demo sales
    await storage.createSale({
      companyId: demoCompany.id,
      userId: demoUser.id,
      customerId: customer1.id,
      productId: product1.id,
      quantity: 2,
      unitPrice: "99.99",
      totalPrice: "199.98",
    });

    await storage.createSale({
      companyId: demoCompany.id,
      userId: demoUser.id,
      customerId: customer2.id,
      productId: product2.id,
      quantity: 1,
      unitPrice: "19.99",
      totalPrice: "19.99",
    });

    // Create demo notifications
    await storage.createNotification({
      companyId: demoCompany.id,
      userId: demoUser.id,
      type: "stock_alert",
      title: "Low Stock Alert",
      message: "USB Cable stock is running low (3 remaining)",
      status: "pending",
    });

    await storage.createNotification({
      companyId: demoCompany.id,
      userId: adminUser.id,
      type: "custom",
      title: "Welcome to CloudBiz Pro",
      message: "Welcome to CloudBiz Pro! Your workspace is ready for use.",
      status: "pending",
    });

    console.log("Database seeded successfully!");
    console.log("Demo credentials:");
    console.log("Super Admin: superadmin@cloudbiz.com / superadmin123");
    console.log("Company Admin: admin@demotech.com / admin123");
    console.log("Employee: employee@demotech.com / employee123");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}