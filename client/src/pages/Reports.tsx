import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AdminSidebar } from "@/components/Layout/AdminSidebar";
import { Header } from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

interface ReportData {
  sales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    monthlyData: Array<{
      month: string;
      revenue: number;
      orders: number;
    }>;
  };
  inventory: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    topSellingProducts: Array<{
      name: string;
      sold: number;
      revenue: number;
    }>;
  };
  customers: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    topCustomers: Array<{
      name: string;
      totalSpent: number;
      orders: number;
    }>;
  };
}

export default function Reports() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("overview");

  // Mock report data - In real app, this would come from API
  const reportData: ReportData = {
    sales: {
      totalRevenue: 125000,
      totalOrders: 450,
      averageOrderValue: 278,
      monthlyData: [
        { month: "Jan", revenue: 18000, orders: 65 },
        { month: "Feb", revenue: 22000, orders: 75 },
        { month: "Mar", revenue: 19500, orders: 68 },
        { month: "Apr", revenue: 26000, orders: 92 },
        { month: "May", revenue: 24500, orders: 88 },
        { month: "Jun", revenue: 15000, orders: 62 }
      ]
    },
    inventory: {
      totalItems: 250,
      lowStockItems: 12,
      outOfStockItems: 3,
      topSellingProducts: [
        { name: "Premium Widget Pro", sold: 145, revenue: 42500 },
        { name: "Essential Tool Kit", sold: 98, revenue: 23520 },
        { name: "Advanced Solution", sold: 76, revenue: 30400 },
        { name: "Basic Package", sold: 65, revenue: 9750 },
        { name: "Enterprise Suite", sold: 42, revenue: 21000 }
      ]
    },
    customers: {
      totalCustomers: 180,
      newCustomersThisMonth: 25,
      topCustomers: [
        { name: "TechCorp Solutions", totalSpent: 15600, orders: 12 },
        { name: "Global Industries", totalSpent: 12300, orders: 8 },
        { name: "Innovation Labs", totalSpent: 9800, orders: 15 },
        { name: "Future Systems", totalSpent: 8500, orders: 6 },
        { name: "Digital Dynamics", totalSpent: 7200, orders: 9 }
      ]
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      window.location.href = "/";
      return;
    }
  }, [user]);

  const handleExportCSV = (dataType: string) => {
    let csvContent = "";
    let filename = "";
    
    switch (dataType) {
      case "sales":
        csvContent = "Month,Revenue,Orders\n" +
          reportData.sales.monthlyData.map(row => 
            `${row.month},$${row.revenue},${row.orders}`
          ).join("\n");
        filename = "sales-report.csv";
        break;
      case "inventory":
        csvContent = "Product,Sold,Revenue\n" +
          reportData.inventory.topSellingProducts.map(row => 
            `${row.name},${row.sold},$${row.revenue}`
          ).join("\n");
        filename = "inventory-report.csv";
        break;
      case "customers":
        csvContent = "Customer,Total Spent,Orders\n" +
          reportData.customers.topCustomers.map(row => 
            `${row.name},$${row.totalSpent},${row.orders}`
          ).join("\n");
        filename = "customers-report.csv";
        break;
      default:
        return;
    }

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: `${filename} exported successfully`,
    });
  };

  const handleExportPDF = (dataType: string) => {
    // Mock PDF export functionality
    toast({
      title: "PDF Export",
      description: `${dataType} report will be generated and emailed to you shortly`,
    });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AdminSidebar />
      
      <div className="ml-64 min-h-screen">
        <Header
          title="Reports & Analytics"
          subtitle="Business insights and data analytics"
        />

        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-4">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[180px]" data-testid="select-date-range">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[180px]" data-testid="select-report-type">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="summary">Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => handleExportCSV("sales")}
                  data-testid="button-export-csv"
                >
                  <i className="fas fa-file-csv mr-2"></i>
                  Export CSV
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleExportPDF("overview")}
                  data-testid="button-export-pdf"
                >
                  <i className="fas fa-file-pdf mr-2"></i>
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Total Revenue
                      </p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        ${reportData.sales.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <i className="fas fa-dollar-sign text-green-600 dark:text-green-400"></i>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      +12.5% vs last period
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Total Orders
                      </p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {reportData.sales.totalOrders}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <i className="fas fa-shopping-cart text-blue-600 dark:text-blue-400"></i>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      +8.3% vs last period
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Avg Order Value
                      </p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        ${reportData.sales.averageOrderValue}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <i className="fas fa-chart-line text-purple-600 dark:text-purple-400"></i>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                      +3.7% vs last period
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Total Customers
                      </p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {reportData.customers.totalCustomers}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <i className="fas fa-users text-orange-600 dark:text-orange-400"></i>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge variant="default" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                      +{reportData.customers.newCustomersThisMonth} new this month
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Tabs */}
            <Tabs defaultValue="sales" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sales">Sales Reports</TabsTrigger>
                <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
                <TabsTrigger value="customers">Customer Reports</TabsTrigger>
              </TabsList>

              {/* Sales Tab */}
              <TabsContent value="sales" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Trend</CardTitle>
                      <CardDescription>Monthly revenue over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.sales.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Orders vs Revenue</CardTitle>
                      <CardDescription>Order count compared to revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.sales.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="orders" fill="#10B981" name="Orders" />
                          <Bar dataKey="revenue" fill="#3B82F6" name="Revenue ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Sales Summary</CardTitle>
                        <CardDescription>Detailed sales breakdown</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportCSV("sales")}
                        data-testid="button-export-sales-csv"
                      >
                        <i className="fas fa-download mr-2"></i>
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.sales.monthlyData.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                                {item.month}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {item.month} 2025
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {item.orders} orders
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-slate-900 dark:text-white">
                              ${item.revenue.toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Avg: ${Math.round(item.revenue / item.orders)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Selling Products</CardTitle>
                      <CardDescription>Best performing products by revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.inventory.topSellingProducts}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value}`, 'Revenue ($)']} />
                          <Bar dataKey="revenue" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory Status</CardTitle>
                      <CardDescription>Current inventory health</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {reportData.inventory.totalItems}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Total Items</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {reportData.inventory.lowStockItems}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Low Stock</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {reportData.inventory.outOfStockItems}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Out of Stock</p>
                        </div>
                      </div>
                      
                      {reportData.inventory.lowStockItems > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400"></i>
                            <div>
                              <p className="font-medium text-amber-900 dark:text-amber-100">
                                Low Stock Alert
                              </p>
                              <p className="text-sm text-amber-700 dark:text-amber-300">
                                {reportData.inventory.lowStockItems} items need restocking
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Product Performance</CardTitle>
                        <CardDescription>Top selling products with detailed metrics</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportCSV("inventory")}
                        data-testid="button-export-inventory-csv"
                      >
                        <i className="fas fa-download mr-2"></i>
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.inventory.topSellingProducts.map((product, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                              <span className="text-green-600 dark:text-green-400 font-bold">
                                #{index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {product.name}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {product.sold} units sold
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-slate-900 dark:text-white">
                              ${product.revenue.toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              ${Math.round(product.revenue / product.sold)} per unit
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Customers Tab */}
              <TabsContent value="customers" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Customers by Revenue</CardTitle>
                      <CardDescription>Highest value customers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.customers.topCustomers}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${value}`, 'Total Spent']} />
                          <Bar dataKey="totalSpent" fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Insights</CardTitle>
                      <CardDescription>Key customer metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-3xl font-bold text-slate-900 dark:text-white">
                            {reportData.customers.totalCustomers}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Total Customers</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {reportData.customers.newCustomersThisMonth}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">New This Month</p>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <i className="fas fa-trending-up text-green-600 dark:text-green-400"></i>
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">
                              Growing Customer Base
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              15% growth in customer acquisition this month
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Customer Rankings</CardTitle>
                        <CardDescription>Top customers by total spending</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportCSV("customers")}
                        data-testid="button-export-customers-csv"
                      >
                        <i className="fas fa-download mr-2"></i>
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.customers.topCustomers.map((customer, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 dark:text-purple-400 font-bold">
                                #{index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {customer.name}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {customer.orders} orders placed
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-slate-900 dark:text-white">
                              ${customer.totalSpent.toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Avg: ${Math.round(customer.totalSpent / customer.orders)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}