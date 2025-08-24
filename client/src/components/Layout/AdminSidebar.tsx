import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: "fas fa-tachometer-alt" },
  { name: "User Management", href: "/admin/users", icon: "fas fa-users" },
  { name: "Company Settings", href: "/admin/company", icon: "fas fa-building" },
  { name: "Billing & Subscription", href: "/admin/billing", icon: "fas fa-credit-card" },
  { name: "Reports & Analytics", href: "/admin/reports", icon: "fas fa-chart-bar" },
  { name: "Notifications", href: "/admin/notifications", icon: "fas fa-bell" },
  { name: "Activity Logs", href: "/admin/activity", icon: "fas fa-history" },
  { name: "Settings", href: "/admin/settings", icon: "fas fa-cog" },
];

export function AdminSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 shadow-lg border-r border-slate-200 dark:border-slate-700">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
          <i className="fas fa-chart-line text-white"></i>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">CloudBiz Pro</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/admin" && location === "/");
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
                  isActive
                    ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <i className={`${item.icon} w-5`}></i>
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-white text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate" data-testid="user-name">
              {user?.name || "Admin User"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate" data-testid="user-email">
              {user?.email || "admin@system.com"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            data-testid="button-logout"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
