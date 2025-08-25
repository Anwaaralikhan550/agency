import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
  Monitor,
  BarChart3,
  Activity,
  Clock,
  Zap
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Company {
  id: string;
  name: string;
  slug: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  trialEndsAt?: string;
}

interface SuperAdminStats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalUsers: number;
}

interface GlobalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  companyName: string;
  lastLogin: string | null;
  createdAt: string;
}

interface SystemMonitoring {
  activeUsersToday: number;
  activeUsersWeek: number;
  totalUsers: number;
  totalCompanies: number;
  activeCompanies: number;
  systemUptime: number;
  avgResponseTime: number;
  errorRate: number;
}

interface SystemAnalytics {
  revenueThisMonth: string;
  revenueLastMonth: string;
  monthlyGrowth: string;
  newCompaniesThisMonth: number;
  newUsersThisMonth: number;
  avgRevenuePerCompany: string;
}

export function SuperAdminPanel() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // Fetch companies
  const { data: companies, isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ['/api/super-admin/companies'],
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<SuperAdminStats>({
    queryKey: ['/api/super-admin/stats'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch global users
  const { data: globalUsers, isLoading: usersLoading } = useQuery<GlobalUser[]>({
    queryKey: ['/api/super-admin/users'],
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch system monitoring
  const { data: monitoring, isLoading: monitoringLoading } = useQuery<SystemMonitoring>({
    queryKey: ['/api/super-admin/system-monitoring'],
    staleTime: 10 * 1000, // 10 seconds
  });

  // Fetch system analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<SystemAnalytics>({
    queryKey: ['/api/super-admin/analytics'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Company status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ companyId, status }: { companyId: string; status: 'active' | 'inactive' }) => {
      const response = await fetch(`/api/super-admin/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update company status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/stats'] });
    },
  });

  const handleStatusChange = (companyId: string, newStatus: 'active' | 'inactive') => {
    statusMutation.mutate({ companyId, status: newStatus });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  CloudBiz Pro - Super Admin
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            <Button
              onClick={() => logout()}
              variant="outline"
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabbed Interface */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Companies
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalCompanies || 0}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Companies
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.activeCompanies || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Suspended Companies
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.inactiveCompanies || 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalUsers || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Companies Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Company Management</span>
                </CardTitle>
                <CardDescription>
                  Manage company accounts and billing status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {companiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {companies?.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    data-testid={`company-card-${company.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Building2 className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {company.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {company.email} • Created {new Date(company.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={company.status === 'active' ? 'default' : 'destructive'}
                        data-testid={`company-status-${company.id}`}
                      >
                        {company.status === 'active' ? 'Active' : 'Suspended'}
                      </Badge>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant={company.status === 'active' ? 'destructive' : 'default'}
                            disabled={statusMutation.isPending}
                            data-testid={`button-toggle-status-${company.id}`}
                          >
                            {statusMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              company.status === 'active' ? 'Suspend' : 'Activate'
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {company.status === 'active' ? 'Suspend Company' : 'Activate Company'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {company.status === 'active'
                                ? `Are you sure you want to suspend ${company.name}? All users will be logged out and unable to access the system.`
                                : `Are you sure you want to activate ${company.name}? Users will be able to log in and access the system again.`
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleStatusChange(company.id, company.status === 'active' ? 'inactive' : 'active')}
                              data-testid={`button-confirm-${company.id}`}
                            >
                              {company.status === 'active' ? 'Suspend' : 'Activate'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Uptime</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {monitoringLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${monitoring?.systemUptime || 0}%`}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {monitoringLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${monitoring?.avgResponseTime || 0}ms`}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users Today</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {monitoringLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : monitoring?.activeUsersToday || 0}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {monitoringLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${monitoring?.errorRate || 0}%`}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Global Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Global User Management</CardTitle>
                <CardDescription>View and manage users across all companies</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {globalUsers?.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {user.name?.substring(0, 2).toUpperCase() || "U"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Company: {user.companyName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                            {user.status}
                          </Badge>
                          <Badge variant="outline">{user.role}</Badge>
                          <p className="text-xs text-gray-500">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue This Month</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {analyticsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `$${analytics?.revenueThisMonth || '0'}`}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Growth</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {analyticsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${analytics?.monthlyGrowth || '0'}%`}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Companies</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {analyticsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : analytics?.newCompaniesThisMonth || 0}
                      </p>
                    </div>
                    <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Monthly revenue comparison and growth metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${analytics?.revenueThisMonth || '0'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${analytics?.revenueLastMonth || '0'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${analytics?.avgRevenuePerCompany || '0'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg per Company</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}