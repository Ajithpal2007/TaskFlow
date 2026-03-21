// apps/web/app/(auth)/layout.tsx
import { getUserSession } from "~/lib/auth/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUserSession();

  // Redirect if already authenticated
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Shared UI like your TaskFlow Logo */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            TaskFlow
          </h2>
        </div>
        
        {children}
      </div>
    </div>
  );
}