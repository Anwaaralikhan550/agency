import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NotificationCenter() {
  const [isVisible, setIsVisible] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const recentNotifications = notifications.slice(0, 3);

  if (!recentNotifications.length || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {recentNotifications.map((notification: any) => (
        <Card
          key={notification.id}
          className="transform transition-all duration-300 ease-in-out shadow-lg"
          data-testid={`notification-${notification.id}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-bell text-primary-600 dark:text-primary-400 text-sm"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white" data-testid={`notification-title-${notification.id}`}>
                  {notification.type === "payment_reminder" ? "Payment Reminder" :
                   notification.type === "stock_alert" ? "Stock Alert" : "Notification"}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1" data-testid={`notification-message-${notification.id}`}>
                  {notification.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                data-testid={`button-dismiss-${notification.id}`}
              >
                <i className="fas fa-times text-xs"></i>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
