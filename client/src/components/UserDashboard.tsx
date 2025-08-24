import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Package, 
  ShoppingCart, 
  Bell,
  LogOut,
  Settings,
  BarChart3
} from "lucide-react";

export function UserDashboard() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'manager':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'employee':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getFeaturesByRole = (role: string) => {
    const baseFeatures = [
      { icon: Bell, title: "Notifications", description: "View system notifications", path: "/notifications" },
      { icon: Settings, title: "Settings", description: "Account settings", path: "/settings" },
    ];

    const employeeFeatures = [
      { icon: ShoppingCart, title: "Sales", description: "View and create sales", path: "/sales" },
      { icon: Package, title: "Inventory", description: "View inventory items", path: "/inventory" },
      { icon: Users, title: "Customers", description: "View customer information", path: "/customers" },
    ];

    const managerFeatures = [
      ...employeeFeatures,
      { icon: BarChart3, title: "Analytics", description: "View reports and analytics", path: "/analytics" },
    ];

    const adminFeatures = [
      ...managerFeatures,
      { icon: Users, title: "User Management", description: "Manage company users", path: "/admin/users" },
      { icon: Settings, title: "Admin Panel", description: "Company administration", path: "/admin" },
    ];

    switch (role) {
      case 'admin':
        return [...adminFeatures, ...baseFeatures];
      case 'manager':
        return [...managerFeatures, ...baseFeatures];
      case 'employee':
        return [...employeeFeatures, ...baseFeatures];
      default:
        return baseFeatures;
    }
  };

  const features = getFeaturesByRole(user.role);

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
                  CloudBiz Pro
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-gray-600 dark:text-gray-400">
                    Welcome back, {user.name}
                  </p>
                  <Badge className={getRoleColor(user.role)}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user.company && (
                <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                  <div className="font-medium">{user.company.name}</div>
                  <Badge 
                    variant={user.company.status === 'active' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {user.company.status}
                  </Badge>
                </div>
              )}
              <Button
                onClick={() => logout()}
                variant="outline"
                size="sm"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your business operations and data
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.title} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                data-testid={`feature-card-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <IconComponent className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    data-testid={`button-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    Open {feature.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Quick Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">--</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Sales</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">--</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Customers</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">--</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Inventory Items</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">--</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Notifications</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}