import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserSidebar } from "@/components/Layout/UserSidebar";
import { Header } from "@/components/Layout/Header";
import { RecordSaleModal } from "@/components/Modals/RecordSaleModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Sales() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [showRecordSaleModal, setShowRecordSaleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

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

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["/api/sales"],
    enabled: !!user && user.role === "user",
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    enabled: !!user && user.role === "user",
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory"],
    enabled: !!user && user.role === "user",
  });

  // Create lookup maps for customer and product names
  const customerMap = new Map(customers.map((c: any) => [c.id, c.name]));
  const productMap = new Map(inventory.map((p: any) => [p.id, p.productName]));

  // Filter sales based on search and date
  const filteredSales = sales.filter((sale: any) => {
    const customerName = customerMap.get(sale.customerId) || "";
    const productName = productMap.get(sale.productId) || "";
    const saleDate = new Date(sale.createdAt);
    const now = new Date();
    
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.id.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateFilter === "today") {
      matchesDate = saleDate.toDateString() === now.toDateString();
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = saleDate >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = saleDate >= monthAgo;
    }

    return matchesSearch && matchesDate;
  });

  // Calculate totals
  const totalSales = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum: number, sale: any) => sum + parseFloat(sale.totalPrice), 0);
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

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
          title="Sales Management"
          subtitle="Track and manage your sales transactions"
          showSubscriptionStatus={true}
        />

        <main className="p-6">
          {/* Sales Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="total-sales-count">
                  {totalSales}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  <i className="fas fa-chart-line mr-1"></i>
                  Transactions recorded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="total-revenue">
                  ${totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  <i className="fas fa-dollar-sign mr-1"></i>
                  From filtered sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Average Sale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="average-sale">
                  ${averageSale.toFixed(2)}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  <i className="fas fa-calculator mr-1"></i>
                  Per transaction
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search sales by customer, product, or sale ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
                data-testid="input-search-sales"
              />
            </div>
            <div className="flex gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-date-filter">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowRecordSaleModal(true)} data-testid="button-record-sale">
                <i className="fas fa-plus mr-2"></i>
                Record Sale
              </Button>
            </div>
          </div>

          {/* Sales List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sales History ({filteredSales.length})</CardTitle>
                <Button variant="outline" size="sm" data-testid="button-export-sales">
                  <i className="fas fa-download mr-2"></i>
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-200 dark:bg-slate-600 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/3 mb-1"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
                        </div>
                        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-600 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-chart-bar text-4xl text-slate-300 dark:text-slate-600 mb-4"></i>
                  <p className="text-slate-500 dark:text-slate-400 mb-2">No sales found</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    {searchTerm || dateFilter !== "all" ? "Try adjusting your filters" : "Record your first sale to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSales.map((sale: any) => (
                    <div
                      key={sale.id}
                      className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      data-testid={`sale-row-${sale.id}`}
                    >
                      <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-shopping-cart text-green-600 dark:text-green-400"></i>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-900 dark:text-white" data-testid={`sale-id-${sale.id}`}>
                            Sale #{sale.id.slice(-8)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400" data-testid={`sale-customer-${sale.id}`}>
                          <i className="fas fa-user mr-1"></i>
                          Customer: {customerMap.get(sale.customerId) || "Unknown"}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400" data-testid={`sale-product-${sale.id}`}>
                          <i className="fas fa-box mr-1"></i>
                          Product: {productMap.get(sale.productId) || "Unknown"} × {sale.quantity}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {new Date(sale.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-900 dark:text-white" data-testid={`sale-total-${sale.id}`}>
                          ${parseFloat(sale.totalPrice).toFixed(2)}
                        </p>
                        <Badge variant="default" className="mt-1">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <RecordSaleModal
        open={showRecordSaleModal}
        onOpenChange={setShowRecordSaleModal}
      />
    </div>
  );
}
