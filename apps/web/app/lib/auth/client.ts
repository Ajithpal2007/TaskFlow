import { createAuthClient } from "better-auth/react";



export const authClient =  createAuthClient({

   baseURL:  "http://localhost:4000",
   fetchOptions: {
        credentials: "include" // This allows cookies to pass between 3000 and 4000
    }
   
});

export const { useSession, signIn, signUp, signOut } = authClient;