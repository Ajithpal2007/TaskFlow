

"use client"

import { useParams, notFound } from "next/navigation";
import { AuthView } from "@daveyplate/better-auth-ui"; 
import "@daveyplate/better-auth-ui/css";

export default function AuthPage() {
    const params = useParams();
    const path = params.path as string;

    // 1. Create a mapper to satisfy the strict TypeScript type
    const viewMap: Record<string, any> = {
        "sign-in": "SIGN_IN",
        "sign-up": "SIGN_UP",
        "forgot-password": "FORGOT_PASSWORD",
        "reset-password": "RESET_PASSWORD",
    };

    const view = viewMap[path];

    // 2. If the path isn't in our map, show 404
    if (!view) {
        return notFound();
    }

    return (
        <main className="flex items-center justify-center min-h-screen p-4">
            {/* 3. Pass the mapped 'view' to satisfy the type requirement */}
            <AuthView view={view} 
           
                
            
            
            /> 
        </main>
    );
}
