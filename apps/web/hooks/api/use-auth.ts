import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authClient } from "@/app/lib/auth/client"; 

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 🟢 2. Use Better Auth's native hook instead of manual TanStack Query
  const { data: session, isPending: isLoading, error } = authClient.useSession();

  // 3. Logout Function
  const logout = async () => {
    try {
      // 🟢 4. Use Better Auth's native sign-out method
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Clear all queries from the cache so the next user doesn't see old tasks
            queryClient.clear();
            
            // 🟢 5. Redirect to the Landing Page!
            router.push("/");
          }
        }
      });
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return {
    user: session?.user || null,
    session, // Exposing session just in case you need it later
    isAuthenticated: !!session?.user,
    isLoading,
    isError: !!error,
    logout,
  };
};