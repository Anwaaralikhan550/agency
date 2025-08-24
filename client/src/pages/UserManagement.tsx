import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AdminSidebar } from "@/components/Layout/AdminSidebar";
import { Header } from "@/components/Layout/Header";
import { AddUserModal } from "@/components/Modals/AddUserModal";
import { EditUserModal } from "@/components/Modals/EditUserModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function UserManagement() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      window.location.href = "/";
      return;
    }
  }, [user]);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.role === "admin",
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: "active" | "inactive" }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "User deactivated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleUserStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    updateUserStatusMutation.mutate({ userId, status: newStatus });
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to deactivate ${userName}? This action will make the user inactive.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Filter users based on search term and status
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AdminSidebar />
      
      <div className="ml-64 min-h-screen">
        <Header
          title="User Management"
          subtitle="Manage system users and their access"
        />

        <main className="p-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
                data-testid="input-search-users"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAddUserModal(true)} data-testid="button-add-new-user">
                <i className="fas fa-plus mr-2"></i>
                Add User
              </Button>
            </div>
          </div>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/3"></div>
                        </div>
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-600 rounded"></div>
                        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-600 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-users text-4xl text-slate-300 dark:text-slate-600 mb-4"></i>
                  <p className="text-slate-500 dark:text-slate-400 mb-2">No users found</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    {searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : "Add your first user to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      data-testid={`user-row-${user.id}`}
                    >
                      <div className="h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-medium">
                          {user.name?.substring(0, 2).toUpperCase() || "U"}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 dark:text-white truncate" data-testid={`user-name-${user.id}`}>
                            {user.name || "Unnamed User"}
                          </p>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate" data-testid={`user-email-${user.id}`}>
                          {user.email}
                        </p>
                        {user.lastLogin && (
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Last login: {new Date(user.lastLogin).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant={user.status === "active" ? "default" : "secondary"}
                          data-testid={`user-status-badge-${user.id}`}
                        >
                          {user.status}
                        </Badge>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <i className="fas fa-edit mr-1"></i>
                            Edit
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.id, user.status)}
                            disabled={updateUserStatusMutation.isPending}
                            className={user.status === "active" ? "text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50" : "text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"}
                            data-testid={`button-toggle-status-${user.id}`}
                          >
                            {user.status === "active" ? (
                              <>
                                <i className="fas fa-pause mr-1"></i>
                                Suspend
                              </>
                            ) : (
                              <>
                                <i className="fas fa-play mr-1"></i>
                                Activate
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <i className="fas fa-trash mr-1"></i>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <AddUserModal
        open={showAddUserModal}
        onOpenChange={setShowAddUserModal}
      />
      
      <EditUserModal
        open={showEditUserModal}
        onOpenChange={setShowEditUserModal}
        user={selectedUser}
      />
    </div>
  );
}
