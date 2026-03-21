

import { headers } from "next/headers";
// 1. CRITICAL: We import the authClient, NOT the backend auth engine
import { authClient } from "./client"; 

export async function getUserSession() {
    try {
        const session = await authClient.getSession({
            fetchOptions: {
                // 2. Pass headers synchronously (No 'await' needed in Next 14)
                headers: headers(), 
            },
        });
        
        return session?.data;
    } catch (error) {
        console.error("Failed to fetch session from API:", error);
        return null;
    }
}