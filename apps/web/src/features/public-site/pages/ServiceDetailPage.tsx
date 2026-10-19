"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ChevronRight, ArrowUpRight, Phone, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/features/silver-platform/components";
import { Footer } from "@/features/public-site/sections/Footer";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { MediaBackdrop } from "@/features/public-site/components/MediaBackdrop";
import { getService, SERVICES } from "@/domains/services/data";
import { getServiceFromApi, getServices } from "@/domains/services/services-api";
import { useI18n } from "@/shared/i18n";

const COPY = {
  fa: {
    home: "خانه", services: "خدمات",
    overview: "معرفی خدمت", features: "ویژگی‌ها", process: "فرآیند کار",
    technologies: "تکنولوژی‌ها", deliverables: "خروجی‌های پروژه",
    faq: "سوالات متداول", related: "دیگر خدمات",
    ctaTitle: "آماده شروع پروژه‌اید؟", ctaDesc: "همین حالا با کارشناسان ما در تماس باشید.",
    contact: "تماس بگیرید", call: "تماس تلفنی",
  },
  en: {
    home: "Home", services: "Services",
    overview: "Service overview", features: "Features", process: "Our process",
    technologies: "Technologies", deliverables: "What you receive",
    faq: "Frequently asked", related: "Other services",
    ctaTitle: "Ready to start your project?", ctaDesc: "Get in touch with our specialists today.",
    contact: "Contact us", call: "Call us",
  },
  ar: {
    home: "الرئيسية", services: "الخدمات",
    overview: "نظرة عامة", features: "المميزات", process: "خطوات العمل",
    technologies: "التقنيات", deliverables: "ما ستحصل عليه",
    faq: "الأسئلة الشائعة", related: "خدمات أخرى",
    ctaTitle: "جاهز لبدء مشروعك؟", ctaDesc: "تواصل مع متخصصينا اليوم.",
    contact: "اتصل بنا", call: "اتصال هاتفي",
  },
};

export function ServiceDetailPage({ slug }: { slug: string }) {
  const { lang } = useI18n();
  const builtInLang = (lang === "en" || lang === "ar" || lang === "fa") ? lang : "fa";
  const c = COPY[lang as keyof typeof COPY] ?? COPY.fa;
  const fallbackService = getService(slug) ?? SERVICES[0];
  const { data: apiService } = useQuery({
    queryFn: () => getServiceFromApi(slug, lang),
    queryKey: ["public-service", slug, lang],
    staleTime: 60_000,
  });
  const { data: services = SERVICES } = useQuery({
    queryFn: () => getServices(lang),
    queryKey: ["public-services", lang],
    staleTime: 60_000,
  });
  const s = apiService ?? fallbackService;
  const Icon = s.icon;
  const others = services.filter((x) => x.slug !== s.slug).slice(0, 3);

  return (
    <main className="relative min-h-screen text-foreground">
      <SiteBackground />
      <Header />

      {/* Breadcrumbs */}
      <section className="relative pt-32 pb-4">
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Link href="/" className="hover:text-foreground">{c.home}</Link>
            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            <Link href="/services" className="hover:text-foreground">{c.services}</Link>
            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            <span className="text-foreground truncate">{s.title[builtInLang]}</span>
          </nav>
        </div>
      </section>

      {/* Hero */}
      <section className="relative pb-12">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[1fr_420px] gap-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {c.services}
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-black leading-tight">
              {s.title[builtInLang]}
            </h1>
            <p className="mt-4 text-muted-foreground leading-8 max-w-2xl">{s.short[builtInLang]}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {s.technologies.map((t) => (
                <span key={t} className="rounded-full border border-border bg-foreground/5 px-3 py-1 text-[11px] font-mono text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-border glass aspect-[4/3]"
          >
            <MediaBackdrop alt={s.title[builtInLang]} value={s.cover} />
            <div className="absolute inset-0 dot-grid opacity-40" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="grid h-28 w-28 place-items-center rounded-3xl bg-background/60 backdrop-blur border border-border">
                <Icon className="h-12 w-12 text-primary" />
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Overview */}
      <section className="relative py-10">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-black">{c.overview}</h2>
          <p className="mt-4 max-w-3xl text-muted-foreground leading-8">{s.description[builtInLang]}</p>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-10">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-black">{c.features}</h2>
          <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {s.features[builtInLang].map((f, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4">
                <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-md bg-primary/15 text-primary shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Process */}
      <section className="relative py-10">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-black">{c.process}</h2>
          <ol className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {s.process[builtInLang].map((p, i) => (
              <li key={i} className="relative rounded-2xl border border-border glass p-5">
                <span className="absolute -top-3 start-5 grid h-7 w-7 place-items-center rounded-full bg-gradient-gold text-primary-foreground text-xs font-black font-mono">
                  {i + 1}
                </span>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-6">{p.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Deliverables */}
      <section className="relative py-10">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-black">{c.deliverables}</h2>
          <ul className="mt-6 grid sm:grid-cols-2 gap-3 max-w-3xl">
            {s.deliverables[builtInLang].map((d, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4">
                <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-md bg-primary/15 text-primary shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      {s.faqs.length > 0 && (
        <section className="relative py-10">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="font-display text-2xl sm:text-3xl font-black">{c.faq}</h2>
            <div className="mt-6 space-y-3 max-w-3xl">
              {s.faqs.map((f, i) => (
                <details key={i} className="group rounded-xl border border-border bg-card/40 p-4 open:bg-card/60">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold list-none">
                    {f.q[builtInLang]}
                    <ChevronRight className="h-4 w-4 transition group-open:rotate-90 rtl:rotate-180 rtl:group-open:-rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-7">{f.a[builtInLang]}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-border glass p-8 sm:p-12 text-center">
            <div className="absolute inset-0 opacity-30 dot-grid pointer-events-none" />
            <h2 className="relative font-display text-3xl sm:text-4xl font-black">{c.ctaTitle}</h2>
            <p className="relative mt-3 text-muted-foreground">{c.ctaDesc}</p>
            <div className="relative mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-gold text-primary-foreground px-6 text-sm font-semibold hover:scale-[1.02] transition"
              >
                <Mail className="h-4 w-4" /> {c.contact}
              </Link>
              <a
                href="tel:+982191550859"
                dir="ltr"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border glass px-6 text-sm font-semibold hover:border-primary/40 transition"
              >
                <Phone className="h-4 w-4" /> {c.call} 021-9155-0859
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="relative pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-black">{c.related}</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {others.map((o) => {
              const OIcon = o.icon;
              return (
                <Link
                  key={o.slug} href={`/services/${o.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-border glass hover:border-primary/40 transition"
                >
                  <div className="relative aspect-[16/9]">
                    <MediaBackdrop alt={o.title[builtInLang]} value={o.cover} />
                    <div className="absolute inset-0 dot-grid opacity-40" />
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-background/60 backdrop-blur border border-border group-hover:bg-gradient-gold transition-colors">
                        <OIcon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold group-hover:text-primary transition">{o.title[builtInLang]}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{o.short[builtInLang]}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                      → <ArrowUpRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
