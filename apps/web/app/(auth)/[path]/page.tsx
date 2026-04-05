"use client"

import { useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter, notFound } from "next/navigation";
import { AuthView } from "@daveyplate/better-auth-ui";
import { authClient } from "@/app/lib/auth/client"; 
import { Loader2 } from "lucide-react";
import "@daveyplate/better-auth-ui/css"; 


function AuthContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const path = params.path as string;
    const callbackUrl = searchParams.get("callbackUrl");

    // 🟢 1. Watch the user's session state
    const { data: session, isPending } = authClient.useSession();

    // 🟢 2. The Redirect Interceptor
    useEffect(() => {
        // If the library successfully logs them in (or signs them up), 
        // a session is created. Let's redirect them instantly!
        if (!isPending && session) {
            if (callbackUrl) {
                router.push(callbackUrl); // Send them back to the invite!
            } else {
                router.push("/dashboard"); // Default fallback for normal logins
            }
        }
    }, [session, isPending, callbackUrl, router]);

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
            {/* 3. Render the UI form */}
            <AuthView view={view} /> 
        </main>
    );
}

// 🟢 3. Next.js requires useSearchParams to be wrapped in a Suspense boundary
export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}