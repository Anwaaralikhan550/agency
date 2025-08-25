import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserSidebar } from "@/components/Layout/UserSidebar";
import { Header } from "@/components/Layout/Header";
import { AddProductModal } from "@/components/Modals/AddProductModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { type Inventory } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateInventorySchema, type UpdateInventory } from "@shared/schema";

export default function Inventory() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

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

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
    enabled: !!user && (user.role === "employee" || user.role === "manager"),
  });

  const form = useForm<UpdateInventory>({
    resolver: zodResolver(updateInventorySchema),
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInventory }) => {
      const response = await apiRequest("PATCH", `/api/inventory/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setEditingProduct(null);
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

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/inventory/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
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

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    form.reset({
      productName: product.productName,
      category: product.category,
      stock: product.stock,
      minStock: product.minStock,
      price: product.price,
    });
  };

  const handleUpdateProduct = (data: UpdateInventory) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    }
  };

  const handleDeleteProduct = (id: string, productName: string) => {
    if (confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      deleteProductMutation.mutate(id);
    }
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(inventory.map((item: any) => item.category)));

  // Filter inventory based on search term and category
  const filteredInventory = inventory.filter((item: any) => {
    const matchesSearch = item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
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

  if (user.role === "admin" || user.role === "super_admin") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <UserSidebar />
      
      <div className="ml-64 min-h-screen">
        <Header
          title="Inventory Management"
          subtitle="Manage your products and stock levels"
          showSubscriptionStatus={true}
        />

        <main className="p-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
                data-testid="input-search-products"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-category-filter">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAddProductModal(true)} data-testid="button-add-product">
                <i className="fas fa-plus mr-2"></i>
                Add Product
              </Button>
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventoryLoading ? (
              // Loading skeletons
              [...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3"></div>
                      <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded w-full mt-4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredInventory.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <i className="fas fa-boxes text-4xl text-slate-300 dark:text-slate-600 mb-4"></i>
                <p className="text-slate-500 dark:text-slate-400 mb-2">No products found</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  {searchTerm || categoryFilter !== "all" ? "Try adjusting your filters" : "Add your first product to get started"}
                </p>
              </div>
            ) : (
              filteredInventory.map((product: any) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow" data-testid={`product-card-${product.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg" data-testid={`product-name-${product.id}`}>
                          {product.productName}
                        </CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-400" data-testid={`product-category-${product.id}`}>
                          {product.category}
                        </p>
                      </div>
                      {product.stock <= product.minStock && (
                        <Badge variant="destructive" className="ml-2">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Price:</span>
                        <span className="font-medium" data-testid={`product-price-${product.id}`}>
                          ${product.price}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Stock:</span>
                        <span className={`font-medium ${product.stock <= product.minStock ? 'text-red-600 dark:text-red-400' : ''}`} data-testid={`product-stock-${product.id}`}>
                          {product.stock}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Min Stock:</span>
                        <span data-testid={`product-min-stock-${product.id}`}>
                          {product.minStock}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditProduct(product)}
                          data-testid={`button-edit-${product.id}`}
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteProduct(product.id, product.productName)}
                          disabled={deleteProductMutation.isPending}
                          data-testid={`button-delete-${product.id}`}
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>

      <AddProductModal
        open={showAddProductModal}
        onOpenChange={setShowAddProductModal}
      />

      {/* Edit Product Modal */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-[425px]" data-testid="modal-edit-product">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information and stock levels.
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdateProduct)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} data-testid="input-edit-product-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category" {...field} data-testid="input-edit-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-edit-stock"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Stock Alert</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-edit-min-stock"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-edit-price"
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
                    onClick={() => setEditingProduct(null)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProductMutation.isPending}
                    data-testid="button-update-product"
                  >
                    {updateProductMutation.isPending ? "Updating..." : "Update Product"}
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
