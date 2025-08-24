import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2
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
      </div>
    </div>
  );
}