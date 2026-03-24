import { createAuthClient } from "better-auth/react";



export const authClient =  createAuthClient({

  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
   withCredentials: true,
   fetchOptions: {
        credentials: "include" // This allows cookies to pass between 3000 and 4000
    }
   
});

export const { useSession, signIn, signUp, signOut } = authClient;