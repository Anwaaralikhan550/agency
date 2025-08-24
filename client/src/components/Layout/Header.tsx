import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  title: string;
  subtitle: string;
  showSubscriptionStatus?: boolean;
}

export function Header({ title, subtitle, showSubscriptionStatus = false }: HeaderProps) {
  const { user } = useAuth();
  const { toggleTheme } = useTheme();

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="header-title">
            {title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400" data-testid="header-subtitle">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Subscription Status (for user panel) */}
          {showSubscriptionStatus && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              <i className="fas fa-check-circle"></i>
              Active Subscription
            </div>
          )}
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            data-testid="button-theme-toggle"
          >
            <i className="fas fa-moon dark:hidden"></i>
            <i className="fas fa-sun hidden dark:inline"></i>
          </button>
          
          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" data-testid="button-notifications">
            <i className="fas fa-bell"></i>
            {unreadCount?.count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center" data-testid="notification-count">
                {unreadCount.count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
