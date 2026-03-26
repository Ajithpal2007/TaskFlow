"use client";
import { motion } from "framer-motion";
import { Button } from "@repo/ui/components/button";
import heroDashboard from "@/assets/hero-dashboard.webp";
import Link from "next/dist/client/link";

const stats = [
  { label: "Faster Sync", desc: "Real-time WebRTC backbone for instant updates" },
  { label: "Zero Fatigue", desc: "One interface replaces four separate tools" },
  { label: "Enterprise Ready", desc: "SSO, audit logs & 40+ integrations built in" },
];

const HeroSection = () => {
  return (
    <section className="relative pt-16 pb-20 overflow-hidden lg:pt-24">
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="max-w-3xl"
        >
          {/* Badge */}
          {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-mono mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
            Now in Private Beta
          </div> */}

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.08]">
            One tab for your{" "}
            <br className="hidden sm:block" />
            <span className="text-gradient-hero">entire workflow.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl">
            TaskFlow unifies tasks, docs, and chat into a single, high-performance
            command center. Stop tool-switching and start shipping.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form
              className="flex-1 flex gap-2 max-w-md"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="work@company.com"
                aria-label="Email address"
                required
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-taskflow"
              />
              <Button variant="default" size="lg" type="submit">
                Get Early Access
              </Button>
            </form>
            <Button variant="outline" size="lg" asChild>
              <Link href="#pricing">See Pricing</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-border pt-8">
            {stats.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease: [0.2, 0, 0, 1] }}
              >
                <p className="font-bold text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Hero image - desktop */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.2, 0, 0, 1] }}
        className="absolute right-0 top-16 w-[55%] hidden lg:block"
      >
        <img 
          src="/hero-dashboard.webp" width={1200} height={800}
          alt="TaskFlow dashboard showing Kanban board, document editor, and video call interface"
          className="w-full rounded-l-3xl border-l border-y border-border shadow-2xl"
          loading="eager"
         
        />
      </motion.div>

      {/* Hero image - mobile */}
      <div className="lg:hidden mt-12 px-6">
        <img 
          src="/hero-dashboard.webp"
          alt="TaskFlow dashboard showing Kanban board, document editor, and video call interface"
          className="w-full rounded-2xl border border-border shadow-card"
          loading="eager"
          width={1920}
          height={1080}
        />
      </div>
    </section>
  );
};

export default HeroSection;
