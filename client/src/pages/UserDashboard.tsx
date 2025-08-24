import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserSidebar } from "@/components/Layout/UserSidebar";
import { Header } from "@/components/Layout/Header";
import { StatsCard } from "@/components/Dashboard/StatsCard";
import { AddProductModal } from "@/components/Modals/AddProductModal";
import { AddCustomerModal } from "@/components/Modals/AddCustomerModal";
import { RecordSaleModal } from "@/components/Modals/RecordSaleModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function UserDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showRecordSaleModal, setShowRecordSaleModal] = useState(false);

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

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      window.location.href = "/admin";
      return;
    }
  }, [user]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user && user.role === "user",
  });

  const { data: recentSales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["/api/sales/recent"],
    enabled: !!user && user.role === "user",
  });

  const { data: lowStockItems = [], isLoading: lowStockLoading } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    enabled: !!user && user.role === "user",
  });

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

  if (user.role !== "user") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <UserSidebar />
      
      <div className="ml-64 min-h-screen">
        <Header
          title="Business Dashboard"
          subtitle="Manage your inventory, customers, and sales"
          showSubscriptionStatus={true}
        />

        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Products"
              value={stats?.totalProducts || 0}
              change="+8 new this month"
              changeType="positive"
              icon="fas fa-boxes"
              iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            />
            <StatsCard
              title="Low Stock Alerts"
              value={stats?.lowStockAlerts || 0}
              change="Requires attention"
              changeType="neutral"
              icon="fas fa-exclamation-triangle"
              iconColor="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            />
            <StatsCard
              title="Total Customers"
              value={stats?.totalCustomers || 0}
              change="+5 new this week"
              changeType="positive"
              icon="fas fa-users"
              iconColor="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
            />
            <StatsCard
              title="Monthly Revenue"
              value={`$${stats?.monthlyRevenue || "0.00"}`}
              change="+15% from last month"
              changeType="positive"
              icon="fas fa-dollar-sign"
              iconColor="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Sales Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Sales Overview</CardTitle>
                    <select className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Last 3 months</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <i className="fas fa-chart-area text-4xl text-slate-400 mb-4"></i>
                      <p className="text-slate-600 dark:text-slate-400">Sales Chart Component</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">Implementation: Chart.js integration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full justify-start gap-3 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50"
                    variant="outline"
                    onClick={() => setShowAddProductModal(true)}
                    data-testid="button-add-product"
                  >
                    <i className="fas fa-plus-circle"></i>
                    Add Product
                  </Button>

                  <Button
                    className="w-full justify-start gap-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                    variant="outline"
                    onClick={() => setShowAddCustomerModal(true)}
                    data-testid="button-add-customer"
                  >
                    <i className="fas fa-user-plus"></i>
                    Add Customer
                  </Button>

                  <Button
                    className="w-full justify-start gap-3 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
                    variant="outline"
                    onClick={() => setShowRecordSaleModal(true)}
                    data-testid="button-record-sale"
                  >
                    <i className="fas fa-shopping-cart"></i>
                    Record Sale
                  </Button>

                  <Button
                    className="w-full justify-start gap-3"
                    variant="outline"
                    data-testid="button-generate-report"
                  >
                    <i className="fas fa-file-alt"></i>
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Sales & Low Stock Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Sales</CardTitle>
                  <Button variant="outline" size="sm" data-testid="button-view-all-sales">
                    View all
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentSales.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-shopping-cart text-4xl text-slate-300 dark:text-slate-600 mb-4"></i>
                    <p className="text-slate-500 dark:text-slate-400">No sales recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSales.slice(0, 3).map((sale: any) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                        data-testid={`sale-card-${sale.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                            <i className="fas fa-shopping-bag text-emerald-600 dark:text-emerald-400"></i>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white" data-testid={`sale-product-${sale.id}`}>
                              Sale #{sale.id.slice(-6)}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400" data-testid={`sale-quantity-${sale.id}`}>
                              Qty: {sale.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900 dark:text-white" data-testid={`sale-amount-${sale.id}`}>
                            ${sale.totalPrice}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400" data-testid={`sale-time-${sale.id}`}>
                            {new Date(sale.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Products */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Low Stock Products</CardTitle>
                  <Button variant="outline" size="sm" data-testid="button-view-inventory">
                    View inventory
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {lowStockLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="h-4 bg-red-200 dark:bg-red-800 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-red-200 dark:bg-red-800 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : lowStockItems.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-4xl text-green-300 dark:text-green-600 mb-4"></i>
                    <p className="text-slate-500 dark:text-slate-400">All products are well stocked</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStockItems.slice(0, 3).map((product: any) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                        data-testid={`low-stock-card-${product.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                            <i className="fas fa-box text-red-600 dark:text-red-400"></i>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white" data-testid={`product-name-${product.id}`}>
                              {product.productName}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400" data-testid={`product-category-${product.id}`}>
                              {product.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive" data-testid={`product-stock-${product.id}`}>
                            {product.stock} left
                          </Badge>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Min: {product.minStock}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AddProductModal
        open={showAddProductModal}
        onOpenChange={setShowAddProductModal}
      />
      <AddCustomerModal
        open={showAddCustomerModal}
        onOpenChange={setShowAddCustomerModal}
      />
      <RecordSaleModal
        open={showRecordSaleModal}
        onOpenChange={setShowRecordSaleModal}
      />
    </div>
  );
}
