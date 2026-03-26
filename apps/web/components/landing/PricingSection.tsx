"use client";
import { Button } from "@repo/ui/components/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "For individuals and small side-projects.",
    features: ["Up to 5 members", "Unlimited tasks", "Basic docs editor", "Community support"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/user/mo",
    desc: "For growing teams that need full power.",
    features: ["Unlimited members", "WebRTC calls", "40+ integrations", "Automation workflows", "Priority support"],
    cta: "Get Early Access",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For orgs with compliance and scale needs.",
    features: ["Everything in Pro", "SSO & SCIM", "Audit logs", "Custom SLAs", "Dedicated CSM"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-surface-elevated">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Simple, transparent pricing.
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Start free. Scale as your team grows. No surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: [0.2, 0, 0, 1] }}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "border-primary bg-card shadow-card-hover ring-1 ring-primary/20"
                  : "border-border bg-card shadow-card"
              }`}
            >
              <h3 className="text-lg font-bold text-card-foreground">{plan.name}</h3>
              <div className="mt-3 mb-2">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-card-foreground">
                    <Check size={16} className="text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "default" : "outline"}
                size="lg"
                className="w-full"
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
