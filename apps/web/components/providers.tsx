

"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "@/app/lib/auth/client"; // Path to your authClient
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Providers({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    // Create a simple wrapper component to satisfy the type checker for the Link prop.
    const CustomLink = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => {
        return (
            <Link href={href} className={className}>
                {children}
            </Link>
        );
    };
    
    return (
        <AuthUIProvider 
            authClient={authClient} 
            navigate={router.push} 
            replace={router.replace} 
            onSessionChange={() => router.refresh()} 
            Link={CustomLink} // Use the wrapper component
            // THIS IS THE MISSING PIECE: You must explicitly enable the social buttons
            social={{ providers: ["google", "github"] }} 
        >
            {children}
        </AuthUIProvider>
    );
}