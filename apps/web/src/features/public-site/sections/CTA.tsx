"use client";

import { motion } from "framer-motion";
import { Mail, PhoneCall } from "lucide-react";
import { useI18n } from "@/shared/i18n";

export function CTA() {
  const { t } = useI18n();
  return (
    <section id="contact" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl glass glow-ring p-10 sm:p-16"
        >
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, oklch(0.82 0.16 84 / 0.30), transparent 70%)" }} />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, oklch(0.42 0.14 330 / 0.25), transparent 70%)" }} />
          <div className="absolute inset-0 dot-grid opacity-30" />

          <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/30 px-3 py-1 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span>{t.cta.badge}</span>
              </div>
              <h2 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
                {t.cta.title1} <span className="text-gradient-gold">{t.cta.title2}</span>{t.cta.title3}
              </h2>
              <p className="mt-5 text-muted-foreground leading-8 max-w-xl">{t.cta.desc}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="mailto:info@noghre.land" className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-xl bg-gradient-gold px-6 text-sm font-bold text-primary-foreground shadow-[0_0_50px_-10px_var(--glow)] transition-transform hover:scale-[1.04]">
                  <span className="relative z-10">{t.cta.primary}</span>
                  <span className="absolute inset-0 animate-shimmer opacity-60" />
                </a>
                <a href="tel:+982191550859" className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-background/30 px-6 text-sm font-semibold hover:border-primary/40 transition">
                  <PhoneCall className="h-4 w-4" /> {t.cta.secondary}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: Mail, label: t.cta.email, value: "info@noghre.land", href: "mailto:info@noghre.land" },
                { icon: PhoneCall, label: t.cta.phone, value: "021-9155-0859", href: "tel:+982191550859" },
              ].map(c => {
                const inner = (
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-background/30 p-4 hover:bg-background/50 transition">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground/5 border border-border">
                      <c.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{c.label}</div>
                      <div className="font-mono text-sm" dir="ltr">{c.value}</div>
                    </div>
                  </div>
                );
                return c.href ? (
                  <a key={c.label} href={c.href}>{inner}</a>
                ) : (
                  <div key={c.label}>{inner}</div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
