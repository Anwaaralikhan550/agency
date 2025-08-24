import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["admin", "user"]),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<"admin" | "user">("admin");
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "admin",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (user) => {
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      // Redirect based on role
      if (user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (role: "admin" | "user") => {
    setSelectedRole(role);
    form.setValue("role", role);
    
    // Set demo credentials based on role
    if (role === "admin") {
      form.setValue("email", "admin@system.com");
      form.setValue("password", "admin123");
    } else {
      form.setValue("email", "user@demo.com");
      form.setValue("password", "user123");
    }
  };

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="max-w-md w-full">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <i className="fas fa-chart-line text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">CloudBiz Pro</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Business Management System</p>
        </div>

        <Card className="shadow-xl border border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">Sign In</CardTitle>
            <CardDescription>Access your business dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Login As</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRoleChange("admin")}
                      className={cn(
                        "p-3 border-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all",
                        selectedRole === "admin"
                          ? "border-primary-300 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:border-primary-700 dark:text-primary-300"
                          : "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
                      )}
                      data-testid="button-role-admin"
                    >
                      <i className="fas fa-user-shield text-sm"></i>
                      Admin
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRoleChange("user")}
                      className={cn(
                        "p-3 border-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all",
                        selectedRole === "user"
                          ? "border-primary-300 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:border-primary-700 dark:text-primary-300"
                          : "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
                      )}
                      data-testid="button-role-user"
                    >
                      <i className="fas fa-user text-sm"></i>
                      User
                    </Button>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="email"
                            placeholder="admin@system.com"
                            {...field}
                            className="pr-10"
                            data-testid="input-email"
                          />
                          <i className="fas fa-envelope absolute right-3 top-3.5 text-slate-400"></i>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="password"
                            placeholder="admin123"
                            {...field}
                            className="pr-10"
                            data-testid="input-password"
                          />
                          <i className="fas fa-lock absolute right-3 top-3.5 text-slate-400"></i>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loginMutation.isPending}
                  data-testid="button-sign-in"
                >
                  {loginMutation.isPending ? (
                    "Signing in..."
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Demo Credentials */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Demo Credentials:</h4>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div><strong>Admin:</strong> admin@system.com / admin123</div>
                  <div><strong>User:</strong> user@demo.com / user123</div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
