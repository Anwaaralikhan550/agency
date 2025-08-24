import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { NotificationCenter } from "@/components/NotificationCenter";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import UserDashboard from "@/pages/UserDashboard";
import UserManagement from "@/pages/UserManagement";
import Inventory from "@/pages/Inventory";
import Customers from "@/pages/Customers";
import Sales from "@/pages/Sales";
import CompanySettings from "@/pages/CompanySettings";
import BillingControl from "@/pages/BillingControl";
import Reports from "@/pages/Reports";
import { SuperAdminPanel } from "@/components/SuperAdminPanel";

function Router() {
  const { isAuthenticated, isLoading, user, isSuspended, suspensionReason, logout } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Login} />
        <Route path="*" component={Login} />
      </Switch>
    );
  }

  // Check for company suspension (except super admin)
  if (isSuspended && user?.role !== 'super_admin') {
    const SuspendedScreen = () => (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto shadow-lg bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="text-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900 p-4 mx-auto mb-4 w-fit">
              <svg className="h-12 w-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Account Suspended</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {suspensionReason || "Your company account has been suspended. Please contact support to resolve this issue."}
            </p>
            <button 
              onClick={() => logout && logout()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
    return <SuspendedScreen />;
  }

  // Super admin gets special panel
  if (user?.role === "super_admin") {
    return <SuperAdminPanel />;
  }

  // Routes for authenticated admin users
  if (user?.role === "admin") {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users" component={UserManagement} />
        <Route path="/admin/company" component={CompanySettings} />
        <Route path="/admin/billing" component={BillingControl} />
        <Route path="/admin/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Routes for authenticated regular users
  return (
    <Switch>
      <Route path="/" component={UserDashboard} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/customers" component={Customers} />
      <Route path="/sales" component={Sales} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <NotificationCenter />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
