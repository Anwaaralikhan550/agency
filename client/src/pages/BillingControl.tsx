import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AdminSidebar } from "@/components/Layout/AdminSidebar";
import { Header } from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Company, type User } from "@shared/schema";

interface BillingInfo {
  companyStatus: string;
  subscriptionPlan: string;
  billingCycle: string;
  nextBillingDate?: string;
  trialEndsAt?: string;
  featuresUsed: {
    users: { current: number; limit: number };
    storage: { current: number; limit: number };
    apiCalls: { current: number; limit: number };
  };
  paymentMethod?: {
    type: string;
    last4: string;
    expiry: string;
  };
}

export default function BillingControl() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);

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

  // Fetch company and billing data
  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: ["/api/admin/company"],
    enabled: !!user && user.role === "admin",
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.role === "admin",
  });

  // Calculate billing info from available data
  useEffect(() => {
    if (company && users) {
      const isTrialAccount = company.trialEndsAt && new Date(company.trialEndsAt) > new Date();
      const trialDaysLeft = isTrialAccount && company.trialEndsAt ? 
        Math.ceil((new Date(company.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

      setBillingInfo({
        companyStatus: company.status,
        subscriptionPlan: isTrialAccount ? "Trial" : "Enterprise",
        billingCycle: "monthly",
        trialEndsAt: company.trialEndsAt ? company.trialEndsAt.toString() : undefined,
        featuresUsed: {
          users: { current: users.length, limit: isTrialAccount ? 5 : 100 },
          storage: { current: 2.5, limit: isTrialAccount ? 5 : 100 }, // GB
          apiCalls: { current: 1250, limit: isTrialAccount ? 5000 : 50000 },
        }
      });
    }
  }, [company, users]);

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

  const isTrialAccount = billingInfo?.trialEndsAt && new Date(billingInfo.trialEndsAt) > new Date();
  const trialDaysLeft = isTrialAccount ? 
    Math.ceil((new Date(billingInfo.trialEndsAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  const isAccountSuspended = billingInfo?.companyStatus === "inactive";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AdminSidebar />
      
      <div className="ml-64 min-h-screen">
        <Header
          title="Billing & Subscription"
          subtitle="Manage your subscription and billing information"
        />

        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Account Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      Account Status
                      <Badge
                        variant={isAccountSuspended ? "destructive" : "default"}
                        className="text-sm px-3 py-1"
                        data-testid="account-status-badge"
                      >
                        {isAccountSuspended ? "Suspended" : "Active"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Current subscription and billing status
                    </CardDescription>
                  </div>
                  {!isAccountSuspended && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {isTrialAccount ? "FREE TRIAL" : "$29.99/mo"}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isTrialAccount ? `${trialDaysLeft} days remaining` : "Enterprise Plan"}
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isAccountSuspended ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-xl"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                          Account Suspended
                        </h3>
                        <p className="text-red-700 dark:text-red-300 mb-4">
                          Your account has been suspended by the system administrator. Please contact support to reactivate your account.
                        </p>
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white"
                          data-testid="button-contact-support"
                        >
                          <i className="fas fa-headset mr-2"></i>
                          Contact Support
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : isTrialAccount ? (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <i className="fas fa-clock text-amber-600 dark:text-amber-400 text-xl"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                          Free Trial Active
                        </h3>
                        <p className="text-amber-700 dark:text-amber-300 mb-4">
                          Your free trial expires in {trialDaysLeft} days ({new Date(billingInfo.trialEndsAt!).toLocaleDateString()}). 
                          Upgrade now to continue using all features.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            data-testid="button-upgrade-now"
                          >
                            <i className="fas fa-rocket mr-2"></i>
                            Upgrade Now
                          </Button>
                          <Button
                            variant="outline"
                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            data-testid="button-compare-plans"
                          >
                            Compare Plans
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <i className="fas fa-check-circle text-green-600 dark:text-green-400 text-xl"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                          Enterprise Plan Active
                        </h3>
                        <p className="text-green-700 dark:text-green-300 mb-4">
                          Your subscription is active and all features are available. Next billing date: March 15, 2025.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="border-green-200 text-green-700 hover:bg-green-50"
                            data-testid="button-manage-subscription"
                          >
                            <i className="fas fa-cog mr-2"></i>
                            Manage Subscription
                          </Button>
                          <Button
                            variant="outline"
                            className="border-green-200 text-green-700 hover:bg-green-50"
                            data-testid="button-billing-history"
                          >
                            <i className="fas fa-file-invoice mr-2"></i>
                            Billing History
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            {!isAccountSuspended && billingInfo && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used</span>
                        <span>{billingInfo.featuresUsed.users.current} / {billingInfo.featuresUsed.users.limit}</span>
                      </div>
                      <Progress 
                        value={(billingInfo.featuresUsed.users.current / billingInfo.featuresUsed.users.limit) * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {billingInfo.featuresUsed.users.limit - billingInfo.featuresUsed.users.current} users remaining
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Storage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used</span>
                        <span>{billingInfo.featuresUsed.storage.current} GB / {billingInfo.featuresUsed.storage.limit} GB</span>
                      </div>
                      <Progress 
                        value={(billingInfo.featuresUsed.storage.current / billingInfo.featuresUsed.storage.limit) * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {(billingInfo.featuresUsed.storage.limit - billingInfo.featuresUsed.storage.current).toFixed(1)} GB remaining
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">API Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>This month</span>
                        <span>{billingInfo.featuresUsed.apiCalls.current.toLocaleString()} / {billingInfo.featuresUsed.apiCalls.limit.toLocaleString()}</span>
                      </div>
                      <Progress 
                        value={(billingInfo.featuresUsed.apiCalls.current / billingInfo.featuresUsed.apiCalls.limit) * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {(billingInfo.featuresUsed.apiCalls.limit - billingInfo.featuresUsed.apiCalls.current).toLocaleString()} calls remaining
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Billing History */}
            {!isAccountSuspended && !isTrialAccount && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Billing History</CardTitle>
                  <CardDescription>
                    Your recent invoices and payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { date: "Feb 15, 2025", amount: "$29.99", status: "paid", invoice: "INV-2025-002" },
                      { date: "Jan 15, 2025", amount: "$29.99", status: "paid", invoice: "INV-2025-001" },
                      { date: "Dec 15, 2024", amount: "$29.99", status: "paid", invoice: "INV-2024-012" },
                    ].map((payment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <i className="fas fa-check text-green-600 dark:text-green-400"></i>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {payment.invoice}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {payment.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {payment.amount}
                            </p>
                            <Badge variant="default" className="text-xs">
                              Paid
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <i className="fas fa-download"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}