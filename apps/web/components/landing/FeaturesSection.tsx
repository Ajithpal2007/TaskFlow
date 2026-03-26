"use client";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  MessageCircle,
  Plug,
  Video,
  Workflow,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Boards & Tasks",
    problem: "Context is lost across Jira tickets and sticky notes.",
    outcome: "Real-time sync across Kanban, List, and Timeline views with instant status updates.",
  },
  {
    icon: FileText,
    title: "Docs & Rich Editor",
    problem: "Notion is too slow for engineering documentation.",
    outcome: "Markdown-first editor with integrated task-linking, mentions, and code blocks.",
  },
  {
    icon: MessageCircle,
    title: "Team Chat & Mentions",
    problem: "Slack threads get buried after 24 hours.",
    outcome: "Contextual communication tied to tasks and docs — nothing falls through the cracks.",
  },
  {
    icon: Plug,
    title: "40+ Integrations",
    problem: "Your stack is fragmented across a dozen tools.",
    outcome: "Connect GitHub, Figma, Linear, Slack, and more in two clicks.",
  },
  {
    icon: Video,
    title: "WebRTC Calls",
    problem: "Switching to Zoom for a quick sync kills momentum.",
    outcome: "Start 1:1 or small-group calls directly from any task card or doc comment.",
  },
  {
    icon: Workflow,
    title: "Automation & Workflows",
    problem: "Repetitive status updates eat your afternoon.",
    outcome: "If-this-then-that automations with triggers across boards, docs, and chat.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-surface-elevated">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Built for builders.
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            Everything you need to manage a product lifecycle.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: [0.2, 0, 0, 1] }}
              className="group p-8 bg-card rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-taskflow"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-taskflow">
                <f.icon size={20} />
              </div>
              <h3 className="text-lg font-bold text-card-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground italic mb-3">"{f.problem}"</p>
              <p className="text-sm text-card-foreground/80 leading-relaxed">{f.outcome}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
