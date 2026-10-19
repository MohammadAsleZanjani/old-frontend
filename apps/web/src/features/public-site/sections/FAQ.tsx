"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@/shared/i18n";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const { t } = useI18n();
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t.faq.badge}
          </div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl font-black">
            {t.faq.title1} <span className="text-gradient-gold">{t.faq.title2}</span>
          </h2>
        </motion.div>

        <div className="mt-12 space-y-3">
          {t.faq.items.map(([q, a], i) => (
            <div key={q} className="glass rounded-2xl border border-border overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-start hover:bg-foreground/[0.02] transition">
                <span className="font-semibold">{q}</span>
                <Plus className={`h-5 w-5 text-primary transition-transform shrink-0 ${open === i ? "rotate-45" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-8">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
