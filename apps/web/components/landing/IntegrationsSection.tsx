"use client";
import { motion } from "framer-motion";

const integrations = [
  "GitHub", "GitLab", "Figma", "Slack", "Linear", "Notion",
  "Jira", "Zoom", "Google Drive", "Dropbox", "Stripe", "Zapier",
];

const IntegrationsSection = () => {
  return (
    <section id="integrations" className="py-24">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
          Plays well with your stack.
        </h2>
        <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
          40+ integrations out of the box. Connect the tools your team already loves.
        </p>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {integrations.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="px-5 py-2.5 rounded-full border border-border bg-card text-sm font-medium text-card-foreground hover:border-primary/40 hover:shadow-card transition-taskflow"
            >
              {name}
            </motion.div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          …and 28 more. <a href="#" className="text-primary hover:underline font-medium">View all integrations →</a>
        </p>
      </div>
    </section>
  );
};

export default IntegrationsSection;
