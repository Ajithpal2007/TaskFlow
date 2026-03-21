import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../app/lib/api-client";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Fetch Current User Session
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      try {
        // Better Auth standard endpoint for getting the session
        const { data } = await apiClient.get("/auth/get-session");
        return data?.user || null;
      } catch (error) {
        return null;
      }
    },
    // Keep the session for 5 minutes before re-checking
    staleTime: 5 * 60 * 1000, 
    retry: false, // Don't retry if 401, it just means they aren't logged in
  });

  // 2. Logout Function
  const logout = async () => {
    try {
      await apiClient.post("/auth/sign-out");
      // Clear all queries from the cache so the next user doesn't see Ajith's tasks
      queryClient.clear();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    isError,
    logout,
  };
};