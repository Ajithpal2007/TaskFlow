
"use client";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "We dropped Jira, Notion, and Slack in one sprint. TaskFlow consolidated everything without the migration headache.",
    name: "Sarah Chen",
    role: "Head of Product, Vercel",
  },
  {
    quote: "The WebRTC calls from a task card are a game-changer. Context never gets lost anymore.",
    name: "Marcus Johnson",
    role: "Engineering Lead, Stripe",
  },
  {
    quote: "As a freelancer, TaskFlow keeps my clients, tasks, and docs in one place. It's the only tool I open every morning.",
    name: "Elena Kowalski",
    role: "Independent Product Designer",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Loved by teams who ship.
          </h2>
          <p className="text-muted-foreground text-lg">
            Here's what early adopters are saying.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: [0.2, 0, 0, 1] }}
              className="p-8 rounded-2xl border border-border bg-card shadow-card"
            >
              <p className="text-card-foreground leading-relaxed mb-6">
                "{t.quote}"
              </p>
              <footer>
                <p className="font-bold text-foreground text-sm">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
