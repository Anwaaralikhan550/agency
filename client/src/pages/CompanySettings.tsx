import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AdminSidebar } from "@/components/Layout/AdminSidebar";
import { Header } from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Company } from "@shared/schema";

const CURRENCIES = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "PKR", label: "Pakistani Rupee (₨)" },
  { value: "SAR", label: "Saudi Riyal (﷼)" },
  { value: "AED", label: "UAE Dirham (د.إ)" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ur", label: "اردو (Urdu)" },
  { value: "ar", label: "العربية (Arabic)" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Karachi", label: "Pakistan (PKT)" },
  { value: "Asia/Dubai", label: "UAE (GST)" },
  { value: "Asia/Riyadh", label: "Saudi Arabia (AST)" },
];

interface CompanyData {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  currency: string;
  language: string;
  timezone: string;
  status: string;
  logo?: string;
  trialEndsAt?: string;
}

export default function CompanySettings() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CompanyData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    currency: "USD",
    language: "en",
    timezone: "UTC",
    status: "active",
    logo: ""
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

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

  // Fetch company data
  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: ["/api/admin/company"],
    enabled: !!user && user.role === "admin",
  });

  // Update form data when company data is loaded
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        website: company.website || "",
        currency: company.currency || "USD",
        language: company.language || "en",
        timezone: company.timezone || "UTC",
        status: company.status || "active",
        logo: company.logo || "",
        trialEndsAt: company.trialEndsAt ? company.trialEndsAt.toString() : undefined
      });
      setLogoPreview(company.logo || "");
    }
  }, [company]);

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: Partial<CompanyData>) => {
      const response = await apiRequest("PATCH", "/api/admin/company", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Company settings updated successfully",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { status, trialEndsAt, ...updateData } = formData;
    updateCompanyMutation.mutate(updateData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "File too large",
          description: "Logo file size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setFormData(prev => ({ ...prev, logo: "" }));
  };

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

  const isTrialAccount = formData.trialEndsAt && new Date(formData.trialEndsAt) > new Date();
  const trialDaysLeft = isTrialAccount ? 
    Math.ceil((new Date(formData.trialEndsAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AdminSidebar />
      
      <div className="ml-64 min-h-screen">
        <Header
          title="Company Settings"
          subtitle="Manage your company profile and preferences"
        />

        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Company Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Account Status</CardTitle>
                    <CardDescription>
                      Current subscription and account information
                    </CardDescription>
                  </div>
                  <Badge
                    variant={formData.status === "active" ? "default" : "destructive"}
                    className="text-sm px-4 py-2"
                    data-testid="company-status-badge"
                  >
                    {formData.status === "active" ? "Active" : "Suspended"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isTrialAccount && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-clock text-amber-600 dark:text-amber-400"></i>
                        <div>
                          <p className="font-medium text-amber-900 dark:text-amber-100">
                            Trial Account
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            Your trial expires in {trialDaysLeft} days ({new Date(formData.trialEndsAt!).toLocaleDateString()})
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400">Plan Type</Label>
                      <p className="font-medium">{isTrialAccount ? "Trial" : "Enterprise"}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400">Company Slug</Label>
                      <p className="font-medium font-mono">{company?.slug}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400">Created</Label>
                      <p className="font-medium">{company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : "-"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information Form */}
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Update your company details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Logo Upload Section */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Company Logo</Label>
                    <div className="flex items-start gap-6">
                      {/* Logo Preview */}
                      <div className="flex-shrink-0">
                        <div className="h-24 w-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                          {logoPreview ? (
                            <img 
                              src={logoPreview} 
                              alt="Company logo" 
                              className="h-full w-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-center">
                              <i className="fas fa-building text-2xl text-slate-400 dark:text-slate-500 mb-1"></i>
                              <p className="text-xs text-slate-500 dark:text-slate-400">No logo</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Upload Controls */}
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                            data-testid="button-upload-logo"
                          >
                            <i className="fas fa-upload mr-2"></i>
                            Upload Logo
                          </Button>
                          {logoPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={removeLogo}
                              data-testid="button-remove-logo"
                            >
                              <i className="fas fa-trash mr-2"></i>
                              Remove
                            </Button>
                          )}
                        </div>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Recommended size: 200x200px. Max file size: 2MB. Supported formats: JPG, PNG, SVG
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter company name"
                        required
                        data-testid="input-company-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Company Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="company@example.com"
                        required
                        data-testid="input-company-email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        data-testid="input-company-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="https://company.com"
                        data-testid="input-company-website"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Enter company address"
                      rows={3}
                      data-testid="input-company-address"
                    />
                  </div>

                  <Separator />

                  {/* Preferences */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Regional Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => handleInputChange("currency", value)}
                        >
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={formData.language}
                          onValueChange={(value) => handleInputChange("language", value)}
                        >
                          <SelectTrigger data-testid="select-language">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map((language) => (
                              <SelectItem key={language.value} value={language.value}>
                                {language.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                          value={formData.timezone}
                          onValueChange={(value) => handleInputChange("timezone", value)}
                        >
                          <SelectTrigger data-testid="select-timezone">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map((timezone) => (
                              <SelectItem key={timezone.value} value={timezone.value}>
                                {timezone.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (company) {
                          setFormData({
                            name: company.name || "",
                            email: company.email || "",
                            phone: company.phone || "",
                            address: company.address || "",
                            website: company.website || "",
                            currency: company.currency || "USD",
                            language: company.language || "en",
                            timezone: company.timezone || "UTC",
                            status: company.status || "active",
                            logo: company.logo || "",
                            trialEndsAt: company.trialEndsAt ? company.trialEndsAt.toString() : undefined
                          });
                          setLogoPreview(company.logo || "");
                          setLogoFile(null);
                        }
                      }}
                      data-testid="button-reset"
                    >
                      Reset Changes
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateCompanyMutation.isPending || companyLoading}
                      data-testid="button-save-company"
                    >
                      {updateCompanyMutation.isPending ? (
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
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}