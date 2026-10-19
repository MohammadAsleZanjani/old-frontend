"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/shared/i18n";

const techs = [
  "Next.js", "React", "TypeScript", "NestJS", "Node.js", "Laravel", "PHP",
  "Flutter", "Swift", "Kotlin", "PostgreSQL", "MySQL", "Redis", "MongoDB",
  "Docker", "Kubernetes", "AWS", "Nginx", "TensorFlow", "PyTorch",
  "OpenAI", "Solidity", "Web3.js", "Ethers.js",
];

export function TechStack() {
  const { t } = useI18n();
  return (
    <section id="tech" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t.tech.badge}
          </div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl font-black">
            {t.tech.title1} <span className="text-gradient-gold">{t.tech.title2}</span>
          </h2>
          <p className="mt-3 text-muted-foreground">{t.tech.desc}</p>
        </motion.div>

        <div className="mt-12 flex flex-wrap justify-center gap-2.5" dir="ltr">
          {techs.map((tech, i) => (
            <motion.span
              key={tech}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.025 }}
              className="font-mono text-xs px-3 py-1.5 rounded-lg glass border-border hover:border-primary/40 hover:text-primary transition cursor-default"
            >
              {tech}
            </motion.span>
          ))}
        </div>

        <div className="mt-14 relative overflow-hidden" dir="ltr">
          <div className="absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-background to-transparent" />
          <div className="absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-background to-transparent" />
          <div className="flex gap-12" style={{ animation: "marquee 40s linear infinite" }}>
            {[...techs, ...techs].map((tech, i) => (
              <div key={i} className="text-2xl font-display font-bold text-muted-foreground/40 whitespace-nowrap">
                {tech} <span className="text-primary/40">✦</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </section>
  );
}
