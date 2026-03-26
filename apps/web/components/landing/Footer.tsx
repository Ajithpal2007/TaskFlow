"use client";
import Link from "next/link";

const footerLinks = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Security", href: "#" },
  { label: "Twitter", href: "https://twitter.com/taskflow" },
];

const Footer = () => {
  return (
    <footer className="border-t border-border py-12" role="contentinfo">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} TaskFlow Inc. Built for the future of work.
        </p>
        <nav aria-label="Footer links" className="flex gap-8 text-sm font-medium text-muted-foreground">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-foreground transition-taskflow"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
