"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/shared/i18n";

export function Process() {
  const { t } = useI18n();
  return (
    <section id="process" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t.process.badge}
          </div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl font-black">
            {t.process.title1} <span className="text-gradient-gold">{t.process.title2}</span>
          </h2>
        </motion.div>

        <div className="mt-14 relative">
          <div className="absolute top-12 right-0 left-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden lg:block" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {t.process.steps.map(([title, desc], i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative glass glow-ring rounded-2xl p-6"
              >
                <div className="absolute -top-4 end-6 grid h-8 w-8 place-items-center rounded-full bg-gradient-gold text-primary-foreground text-xs font-black shadow-[0_0_24px_-4px_var(--glow)]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="font-mono text-xs text-primary/70" dir="ltr">STEP {String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-2 font-bold text-lg">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-7">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
