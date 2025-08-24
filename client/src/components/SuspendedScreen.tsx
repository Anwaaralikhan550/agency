import { AlertCircle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SuspendedScreenProps {
  reason?: string;
  onLogout?: () => void;
}

export function SuspendedScreen({ reason, onLogout }: SuspendedScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900 p-4">
              <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Account Suspended
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
            Your company account has been temporarily suspended
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              {reason || "Your company account has been suspended. Please contact support to resolve this issue."}
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              To reactivate your account:
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Email Support</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Contact our support team at support@cloudbizpro.com
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Call Support</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monday - Friday, 9AM - 5PM EST
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              If you believe this is a mistake, please contact support immediately.
            </p>
            
            {onLogout && (
              <Button 
                onClick={onLogout}
                variant="outline" 
                className="w-full"
                data-testid="button-logout"
              >
                Switch Account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}