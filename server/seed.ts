import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail("admin@system.com");
    if (existingAdmin) {
      console.log("Database already seeded");
      return;
    }

    console.log("Seeding database...");

    // Create admin user
    const adminUser = await storage.createUser({
      name: "System Administrator",
      email: "admin@system.com",
      password: "admin123",
      role: "admin",
      status: "active",
      firstName: "System",
      lastName: "Administrator",
    });

    // Create demo user
    const demoUser = await storage.createUser({
      name: "Demo User",
      email: "user@demo.com",
      password: "user123",
      role: "user",
      status: "active",
      firstName: "Demo",
      lastName: "User",
    });

    // Create some demo customers for the demo user
    const customer1 = await storage.createCustomer({
      userId: demoUser.id,
      name: "John Smith",
      phone: "+1-555-0123",
      email: "john.smith@example.com",
      address: "123 Main St, Anytown, USA 12345",
    });

    const customer2 = await storage.createCustomer({
      userId: demoUser.id,
      name: "Sarah Johnson",
      phone: "+1-555-0456",
      email: "sarah.johnson@example.com",
      address: "456 Oak Ave, Somewhere, USA 67890",
    });

    // Create some demo inventory for the demo user
    const product1 = await storage.createInventoryItem({
      userId: demoUser.id,
      productName: "Wireless Headphones",
      category: "Electronics",
      stock: 25,
      minStock: 5,
      price: "99.99",
    });

    const product2 = await storage.createInventoryItem({
      userId: demoUser.id,
      productName: "Smartphone Case",
      category: "Accessories",
      stock: 50,
      minStock: 10,
      price: "19.99",
    });

    const product3 = await storage.createInventoryItem({
      userId: demoUser.id,
      productName: "USB Cable",
      category: "Accessories",
      stock: 3,  // Low stock to trigger alert
      minStock: 10,
      price: "12.99",
    });

    // Create some demo sales
    await storage.createSale({
      userId: demoUser.id,
      customerId: customer1.id,
      productId: product1.id,
      quantity: 2,
      totalPrice: "199.98",
    });

    await storage.createSale({
      userId: demoUser.id,
      customerId: customer2.id,
      productId: product2.id,
      quantity: 1,
      totalPrice: "19.99",
    });

    // Create demo notifications
    await storage.createNotification({
      userId: demoUser.id,
      type: "stock_alert",
      message: "USB Cable stock is running low (3 remaining)",
      status: "pending",
    });

    await storage.createNotification({
      userId: adminUser.id,
      type: "custom",
      message: "Welcome to CloudBiz Pro! System is ready for use.",
      status: "pending",
    });

    console.log("Database seeded successfully!");
    console.log("Demo credentials:");
    console.log("Admin: admin@system.com / admin123");
    console.log("User: user@demo.com / user123");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}