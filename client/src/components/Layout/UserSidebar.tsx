import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: "fas fa-tachometer-alt" },
  { name: "Inventory", href: "/inventory", icon: "fas fa-boxes" },
  { name: "Customers", href: "/customers", icon: "fas fa-users" },
  { name: "Sales", href: "/sales", icon: "fas fa-chart-bar" },
  { name: "Reports", href: "/reports", icon: "fas fa-file-invoice-dollar" },
];

export function UserSidebar() {
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
          <p className="text-xs text-slate-500 dark:text-slate-400">Business Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
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
              {user?.name || "User"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate" data-testid="user-email">
              {user?.email || "user@demo.com"}
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
