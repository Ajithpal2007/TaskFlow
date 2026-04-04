"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button"; 
import { useSession } from "@/app/lib/auth/client"; 

const Navbar = () => {
  const { data: session, isPending } = useSession();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <nav className="h-16 bg-black"></nav>;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md p-4">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="text-xl font-bold text-white">
          TaskFlow
        </Link>

        {/* LINKS (No 'hidden' or 'md:') */}
        <div className="flex gap-6">
          <Link href="#features" className="text-gray-400">Features</Link>
          <Link href="#pricing" className="text-gray-400">Pricing</Link>
          <Link href="#integrations" className="text-gray-400">Integrations</Link>
        </div>

        {/* AUTH BUTTONS (No 'hidden' or 'md:') */}
        <div className="flex gap-4">
          {isPending ? (
            <span className="text-white">Loading Auth...</span>
          ) : session ? (
            <Button asChild className="bg-white text-black">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild className="text-white border-white">
                <Link href="/sign-in">Log in</Link>
              </Button>
              <Button asChild className="bg-blue-600 text-white">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;