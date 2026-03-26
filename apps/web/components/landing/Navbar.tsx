"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, CheckSquare, Loader2 } from "lucide-react";
// 🟢 1. Import your Better Auth session hook
import { useSession } from "@/app/lib/auth/client"; 

import { Button } from "@repo/ui/components/button";
import { NavLink } from "./NavLink"; // Ensure this points to the new NavLink we just made!

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🟢 2. Check if the user is logged in!
  const { data: session, isPending } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-border py-3 shadow-sm"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:scale-105 transition-transform">
              <CheckSquare size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight">TaskFlow</span>
          </Link>

          {/* DESKTOP LINKS */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </NavLink>
            <NavLink to="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </NavLink>
            <NavLink to="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </NavLink>
          </div>

          {/* 🟢 3. THE AUTH BUTTONS (DESKTOP) */}
          <div className="hidden md:flex items-center space-x-4">
            {isPending ? (
              // Show a tiny spinner while Better Auth checks the session
              <div className="h-9 w-20 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : session ? (
              // IF LOGGED IN: Show Dashboard Button
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              // IF LOGGED OUT: Show Login & Signup
              <>
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU CONTENT */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg py-4 px-4 flex flex-col space-y-4 animate-in slide-in-from-top-2">
          <Link href="#features" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Features</Link>
          <Link href="#testimonials" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Testimonials</Link>
          <Link href="#pricing" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
          
          <div className="h-px bg-border my-2" />
          
          {/* 🟢 4. THE AUTH BUTTONS (MOBILE) */}
          {session ? (
            <Button asChild className="w-full justify-center">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild className="w-full justify-center">
                <Link href="/sign-in">Log in</Link>
              </Button>
              <Button asChild className="w-full justify-center">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
export default Navbar;
