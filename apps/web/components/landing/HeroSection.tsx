"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import heroDashboard from "../../public/hero-dashboard.webp";
import { Button } from "@repo/ui/components/button";
import { useRouter } from "next/navigation";

const stats = [
  { label: "Faster Sync", desc: "Real-time WebRTC backbone for instant updates" },
  { label: "Zero Fatigue", desc: "One interface replaces four separate tools" },
  { label: "Enterprise Ready", desc: "SSO, audit logs & 40+ integrations built in" },
];

const HeroSection = () => {
  const router = useRouter();
  return (
    <section className="relative pt-16 pb-20 lg:pt-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          >


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
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push("/sign-up");
                }}

              >
                <input
                  type="email"
                  placeholder="work@company.com"
                  aria-label="Email address"
                  required
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-taskflow"
                />
                <Button variant="outline" size="lg" type="submit">
                  Get Early Access
                </Button>
              </form>
              <Button variant="outline" size="lg" asChild>
                <a href="#pricing">See Pricing</a>
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

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.2, 0, 0, 1] }}
            className="mt-12 lg:mt-0"
          >
            <Image
              src={heroDashboard}
              alt="TaskFlow dashboard showing Kanban board, document editor, and video call interface"
              className="w-full rounded-2xl border border-border shadow-2xl"
              priority
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;