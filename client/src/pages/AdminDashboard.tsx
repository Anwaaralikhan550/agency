import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AdminSidebar } from "@/components/Layout/AdminSidebar";
import { Header } from "@/components/Layout/Header";
import { StatsCard } from "@/components/Dashboard/StatsCard";
import { AddUserModal } from "@/components/Modals/AddUserModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { type AdminStats, type User } from "@shared/schema";

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddUserModal, setShowAddUserModal] = useState(false);

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

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && user.role === "admin",
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.role === "admin",
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: "active" | "inactive" }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleUserStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    updateUserStatusMutation.mutate({ userId, status: newStatus });
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
          title="Admin Dashboard"
          subtitle="Manage users and monitor system health"
        />

        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatsCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              change="+12% from last month"
              changeType="positive"
              icon="fas fa-users"
              iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            />
            <StatsCard
              title="Active Users"
              value={stats?.activeUsers || 0}
              change="+5% from last month"
              changeType="positive"
              icon="fas fa-user-check"
              iconColor="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            />
            <StatsCard
              title="Total Customers"
              value={stats?.totalCustomers || 0}
              change="Growing customer base"
              changeType="positive"
              icon="fas fa-handshake"
              iconColor="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
            />
            <StatsCard
              title="Total Products"
              value={stats?.totalProducts || 0}
              change="Inventory items"
              changeType="neutral"
              icon="fas fa-boxes"
              iconColor="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            />
            <StatsCard
              title="Monthly Revenue"
              value={`$${stats?.monthlyRevenue || '0.00'}`}
              change="This month's sales"
              changeType="positive"
              icon="fas fa-dollar-sign"
              iconColor="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            />
          </div>

          {/* Recent Activity & User Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Users */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Users</CardTitle>
                    <Button variant="outline" size="sm" data-testid="button-view-all-users">
                      View all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users.slice(0, 5).map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                          data-testid={`user-card-${user.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {user.name?.substring(0, 2).toUpperCase() || "U"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white" data-testid={`user-name-${user.id}`}>
                                {user.name || "Unnamed User"}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400" data-testid={`user-email-${user.id}`}>
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={user.status === "active" ? "default" : "secondary"}
                              data-testid={`user-status-${user.id}`}
                            >
                              {user.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleUserStatus(user.id, user.status)}
                              disabled={updateUserStatusMutation.isPending}
                              data-testid={`button-toggle-status-${user.id}`}
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                    onClick={() => setShowAddUserModal(true)}
                    data-testid="button-add-user"
                  >
                    <i className="fas fa-plus-circle"></i>
                    Add New User
                  </Button>

                  <Button
                    className="w-full justify-start gap-3 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    variant="outline"
                    data-testid="button-send-reminders"
                  >
                    <i className="fas fa-paper-plane"></i>
                    Send Payment Reminders
                  </Button>

                  <Button
                    className="w-full justify-start gap-3"
                    variant="outline"
                    data-testid="button-export-data"
                  >
                    <i className="fas fa-download"></i>
                    Export Data
                  </Button>

                  <Button
                    className="w-full justify-start gap-3"
                    variant="outline"
                    data-testid="button-system-backup"
                  >
                    <i className="fas fa-shield-alt"></i>
                    System Backup
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <AddUserModal
        open={showAddUserModal}
        onOpenChange={setShowAddUserModal}
      />
    </div>
  );
}
