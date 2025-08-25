import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserSidebar } from "@/components/Layout/UserSidebar";
import { Header } from "@/components/Layout/Header";
import { AddCustomerModal } from "@/components/Modals/AddCustomerModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateCustomerSchema, type UpdateCustomer } from "@shared/schema";

export default function Customers() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      window.location.href = "/admin";
      return;
    }
  }, [user]);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    enabled: !!user && (user.role === "employee" || user.role === "manager"),
  });

  const form = useForm<UpdateCustomer>({
    resolver: zodResolver(updateCustomerSchema),
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomer }) => {
      const response = await apiRequest("PATCH", `/api/customers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      setEditingCustomer(null);
      form.reset();
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

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/customers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
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

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
  };

  const handleUpdateCustomer = (data: UpdateCustomer) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data });
    }
  };

  const handleDeleteCustomer = (id: string, customerName: string) => {
    if (confirm(`Are you sure you want to delete "${customerName}"? This action cannot be undone.`)) {
      deleteCustomerMutation.mutate(id);
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer: any) => {
    return customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.phone?.includes(searchTerm);
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

  if (user.role !== "user") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <UserSidebar />
      
      <div className="ml-64 min-h-screen">
        <Header
          title="Customer Management"
          subtitle="Manage your customer database"
          showSubscriptionStatus={true}
        />

        <main className="p-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
                data-testid="input-search-customers"
              />
            </div>
            <div>
              <Button onClick={() => setShowAddCustomerModal(true)} data-testid="button-add-customer">
                <i className="fas fa-plus mr-2"></i>
                Add Customer
              </Button>
            </div>
          </div>

          {/* Customers List */}
          <Card>
            <CardHeader>
              <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/3 mb-1"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
                        </div>
                        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-600 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-users text-4xl text-slate-300 dark:text-slate-600 mb-4"></i>
                  <p className="text-slate-500 dark:text-slate-400 mb-2">No customers found</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    {searchTerm ? "Try adjusting your search" : "Add your first customer to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCustomers.map((customer: any) => (
                    <div
                      key={customer.id}
                      className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      data-testid={`customer-row-${customer.id}`}
                    >
                      <div className="h-12 w-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-medium">
                          {customer.name?.substring(0, 2).toUpperCase() || "C"}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate" data-testid={`customer-name-${customer.id}`}>
                          {customer.name}
                        </p>
                        {customer.email && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate" data-testid={`customer-email-${customer.id}`}>
                            <i className="fas fa-envelope mr-1"></i>
                            {customer.email}
                          </p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-slate-600 dark:text-slate-400" data-testid={`customer-phone-${customer.id}`}>
                            <i className="fas fa-phone mr-1"></i>
                            {customer.phone}
                          </p>
                        )}
                        {customer.address && (
                          <p className="text-xs text-slate-500 dark:text-slate-500 truncate" data-testid={`customer-address-${customer.id}`}>
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {customer.address}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                          data-testid={`button-edit-customer-${customer.id}`}
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                          disabled={deleteCustomerMutation.isPending}
                          data-testid={`button-delete-customer-${customer.id}`}
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <AddCustomerModal
        open={showAddCustomerModal}
        onOpenChange={setShowAddCustomerModal}
      />

      {/* Edit Customer Modal */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="sm:max-w-[425px]" data-testid="modal-edit-customer">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information.
            </DialogDescription>
          </DialogHeader>
          
          {editingCustomer && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdateCustomer)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} data-testid="input-edit-customer-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} data-testid="input-edit-phone" />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} data-testid="input-edit-customer-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter address"
                          {...field}
                          data-testid="input-edit-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingCustomer(null)}
                    data-testid="button-cancel-edit-customer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateCustomerMutation.isPending}
                    data-testid="button-update-customer"
                  >
                    {updateCustomerMutation.isPending ? "Updating..." : "Update Customer"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
