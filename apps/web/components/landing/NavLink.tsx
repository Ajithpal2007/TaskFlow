"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
// Make sure this points to your actual 'cn' utility path!
import { cn } from "@repo/ui/lib/utils"; 

interface NavLinkCompatProps extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> {
  to: string; // 🟢 We keep 'to' instead of 'href' so it works perfectly with your existing Navbar code
  className?: string;
  activeClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, to, ...props }, ref) => {
    const pathname = usePathname();
    
    // Check if the current URL matches this link's destination
    const isActive = pathname === to;

    return (
      <Link
        ref={ref}
        href={to}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };