"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { useI18n } from "@/shared/i18n";

export function Testimonials() {
  const { t } = useI18n();
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t.testimonials.badge}
          </div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl font-black">
            {t.testimonials.title1} <span className="text-gradient-gold">{t.testimonials.title2}</span>
          </h2>
        </motion.div>

        <div className="mt-12 grid md:grid-cols-2 gap-5">
          {t.testimonials.items.map(([name, city, role, text], i) => (
            <motion.figure
              key={name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative glass glow-ring rounded-2xl p-7"
            >
              <Quote className="absolute top-5 start-5 h-7 w-7 text-primary/30" />
              <blockquote className="text-foreground/90 leading-8 mt-6">{text}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-gold font-bold text-primary-foreground">
                  {name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm">{name} — {city}</div>
                  <div className="text-xs text-muted-foreground">{role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
