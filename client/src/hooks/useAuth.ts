import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";

interface LoginCredentials {
  email: string;
  password: string;
  role: string;
}

interface AuthError {
  message: string;
  suspended?: boolean;
  reason?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      if (res.status === 401) {
        return null; // User not authenticated
      }

      if (res.status === 403) {
        // Check for company suspension
        const errorData = await res.json();
        if (errorData.suspended) {
          throw new Error(JSON.stringify(errorData));
        }
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(JSON.stringify(errorData));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });

  // Check for suspension errors
  let authError: AuthError | null = null;
  if (error) {
    try {
      authError = JSON.parse(error.message);
    } catch {
      authError = { message: error.message };
    }
  }

  // Parse login error for suspension status
  let loginError: AuthError | null = null;
  if (loginMutation.error) {
    try {
      loginError = JSON.parse(loginMutation.error.message);
    } catch {
      loginError = { message: loginMutation.error.message };
    }
  }

  const isSuspended = authError?.suspended || loginError?.suspended;

  return {
    user: user || undefined,
    isLoading,
    isAuthenticated: !!user,
    isSuspended,
    suspensionReason: authError?.reason || loginError?.reason,
    error: authError,
    login: loginMutation.mutate,
    loginError,
    loginLoading: loginMutation.isPending,
    logout: logoutMutation.mutate,
    logoutLoading: logoutMutation.isPending,
  };
}
