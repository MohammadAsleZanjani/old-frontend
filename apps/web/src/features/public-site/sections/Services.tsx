"use client";

import { motion } from "framer-motion";
import { Brain, Code2, Smartphone, Apple, Database, Layers, Search, Boxes, Server, Cpu, Rocket, Globe2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/shared/i18n";
import { SERVICES } from "@/domains/services/data";
import { getServices } from "@/domains/services/services-api";

const icons = [Brain, Code2, Globe2, Smartphone, Apple, Layers, Boxes, Server, Cpu, Search, Database, Rocket];

export function Services() {
  const { lang, t } = useI18n();
  const { data: services = SERVICES } = useQuery({
    queryFn: () => getServices(lang),
    queryKey: ["public-services", lang],
    staleTime: 60_000,
  });
  return (
    <section id="services" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t.services.badge}
          </div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl font-black leading-tight">
            {t.services.title1} <span className="text-gradient-gold">{t.services.title2}</span>
            <br /> {t.services.title3}
          </h2>
          <p className="mt-4 text-muted-foreground leading-8">{t.services.desc}</p>
        </motion.div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {t.services.list.map(([title, desc], i) => {
            const Icon = icons[i] || Code2;
            const target = services[i];
            const card = (
              <>
                <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition group-hover:opacity-100" style={{
                  background: "radial-gradient(40rem 10rem at 50% 0%, oklch(0.82 0.16 84 / 0.18), transparent 60%)"
                }} />
                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-foreground/5 border border-border group-hover:bg-gradient-gold transition-colors">
                    <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="mt-5 font-bold text-lg">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-7">{desc}</p>
                  <div className="mt-5 inline-flex items-center gap-1 text-xs text-primary opacity-70 group-hover:opacity-100 transition">
                    {t.services.cta} <span>→</span>
                  </div>
                </div>
              </>
            );
            return (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
                className="group relative rounded-2xl glass p-6 transition-all hover:-translate-y-1 hover:border-primary/30"
              >
                {target ? (
                  <Link href={`/services/${target.slug}`} className="block">{card}</Link>
                ) : card}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
