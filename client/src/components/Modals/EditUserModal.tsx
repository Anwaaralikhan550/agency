import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

const editUserFormSchema = updateUserSchema.extend({
  id: z.string(),
  resetPassword: z.boolean().optional(),
  newPassword: z.string().optional(),
});

type EditUserForm = z.infer<typeof editUserFormSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  firstName?: string;
  lastName?: string;
  lastLogin?: string;
  createdAt: string;
}

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function EditUserModal({ open, onOpenChange, user }: EditUserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [resetPassword, setResetPassword] = useState(false);

  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "employee",
      status: "active",
      resetPassword: false,
      newPassword: "",
    },
  });

  // Update form when user changes
  useEffect(() => {
    if (user && open) {
      form.reset({
        id: user.id,
        name: user.name,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role,
        status: user.status,
        resetPassword: false,
        newPassword: "",
      });
      setResetPassword(false);
    }
  }, [user, open, form]);

  const updateUserMutation = useMutation({
    mutationFn: async (userData: EditUserForm) => {
      const { id, resetPassword: reset, ...updateData } = userData;
      
      // If resetting password, include it in the update
      if (reset && userData.newPassword) {
        updateData.password = userData.newPassword;
      }
      
      const response = await apiRequest("PATCH", `/api/admin/users/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: resetPassword ? "User updated and password reset successfully" : "User updated successfully",
      });
      form.reset();
      setResetPassword(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditUserForm) => {
    if (resetPassword && !data.newPassword) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }
    updateUserMutation.mutate({ ...data, resetPassword });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="modal-edit-user">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-lg">
                  {user.name?.substring(0, 2).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={user.status === "active" ? "default" : "secondary"}>
                    {user.status}
                  </Badge>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="First name" data-testid="input-first-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Last name" data-testid="input-last-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter display name" required data-testid="input-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="user@company.com" required data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Password Reset Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Password Reset</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Force a password reset for this user
                  </p>
                </div>
                <Button
                  type="button"
                  variant={resetPassword ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResetPassword(!resetPassword)}
                  data-testid="button-toggle-password-reset"
                >
                  {resetPassword ? "Cancel Reset" : "Reset Password"}
                </Button>
              </div>

              {resetPassword && (
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="Enter new password"
                          data-testid="input-new-password"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Minimum 8 characters required. User will be required to change on next login.
                      </p>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* User Statistics */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <Label className="text-sm font-medium mb-2 block">User Statistics</Label>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Created:</span>
                  <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Last Login:</span>
                  <p className="font-medium">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateUserMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
                data-testid="button-save-user"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}