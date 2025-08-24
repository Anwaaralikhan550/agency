import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("");
  const { login, loginLoading, loginError } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !role) return;
    
    login({ email, password, role });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-4">
              <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            CloudBiz Pro
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Complete Business Management System
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {loginError.message || "Login failed"}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loginLoading}
                required
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loginLoading}
                required
                data-testid="input-password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Login As
              </Label>
              <Select value={role} onValueChange={setRole} disabled={loginLoading}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Company Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loginLoading || !email || !password || !role}
              data-testid="button-login"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Demo Accounts Available:
            </p>
            <div className="mt-2 text-xs space-y-1 text-center text-gray-600 dark:text-gray-400">
              <div>Super Admin: super@admin.com / admin123</div>
              <div>Company Admin: admin@company1.com / admin123</div>
              <div>Employee: employee@company1.com / employee123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}