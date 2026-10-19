"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/features/silver-platform/components";
import { Footer } from "@/features/public-site/sections/Footer";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { MediaBackdrop } from "@/features/public-site/components/MediaBackdrop";
import { SERVICES } from "@/domains/services/data";
import { getServices } from "@/domains/services/services-api";
import { useI18n } from "@/shared/i18n";

const COPY = {
  fa: {
    eyebrow: "خدمات ستایش",
    title1: "خدمات تخصصی",
    title2: "تیم ستایش",
    desc: "خدمات برنامه‌نویسی و توسعه نرم‌افزاری با بیش از ۱۵ سال سابقه — از طراحی سایت اختصاصی تا هوش مصنوعی و دیجیتال مارکتینگ.",
    more: "اطلاعات بیشتر",
  },
  en: {
    eyebrow: "Setayesh Services",
    title1: "Specialist services",
    title2: "by Setayesh",
    desc: "Engineering and marketing services backed by 15+ years of experience — from custom websites to AI and digital marketing.",
    more: "Learn more",
  },
  ar: {
    eyebrow: "خدمات ستايش",
    title1: "خدمات متخصصة",
    title2: "من ستايش",
    desc: "خدمات هندسية وتسويقية بخبرة تزيد عن 15 عاماً — من تصميم المواقع المخصصة إلى الذكاء الاصطناعي والتسويق الرقمي.",
    more: "اعرف المزيد",
  },
};

export function ServicesIndexPage() {
  const { lang } = useI18n();
  const builtInLang = (lang === "en" || lang === "ar" || lang === "fa") ? lang : "fa";
  const c = COPY[lang as keyof typeof COPY] ?? COPY.fa;
  const { data: services = SERVICES } = useQuery({
    queryFn: () => getServices(lang),
    queryKey: ["public-services", lang],
    staleTime: 60_000,
  });

  return (
    <main className="relative min-h-screen text-foreground">
      <SiteBackground />
      <Header />

      <section className="relative pt-36 pb-12">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> {c.eyebrow}
            </div>
            <h1 className="mt-4 font-display text-5xl sm:text-6xl font-black tracking-tight">
              {c.title1} <span className="text-gradient-gold">{c.title2}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-8">{c.desc}</p>
          </motion.div>
        </div>
      </section>

      <section className="relative pb-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.article
                  key={s.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                  className="group relative overflow-hidden rounded-2xl border border-border glass hover:border-primary/40 transition"
                >
                  <Link href={`/services/${s.slug}`} className="block">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <MediaBackdrop alt={s.title[builtInLang]} value={s.cover} />
                      <div className="absolute inset-0 dot-grid opacity-40" />
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-background/60 backdrop-blur border border-border group-hover:bg-gradient-gold transition-colors">
                          <Icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition">
                        {s.title[builtInLang]}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-7 line-clamp-3">
                        {s.short[builtInLang]}
                      </p>
                      <div className="mt-5 inline-flex items-center gap-1.5 text-xs text-primary">
                        {c.more} <ArrowUpRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
