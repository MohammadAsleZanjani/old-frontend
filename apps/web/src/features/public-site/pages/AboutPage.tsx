"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Rocket, Users, Trophy, Sparkles, Target, Heart, Zap, Globe2,
  Award, Code2, Shield, TrendingUp, ArrowUpRight,
} from "lucide-react";
import { Header } from "@/features/silver-platform/components";
import { Footer } from "@/features/public-site/sections/Footer";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { useI18n } from "@/shared/i18n";

const COPY = {
  fa: {
    eyebrow: "درباره ستایش",
    title1: "طراحی و برنامه نویسی",
    title2: "وب سایت و اپلیکیشن",
    title3: "با بیش از ۱۵ سال سابقه",
    lead: "تیم ستایش با هدف ایجاد تحول و روندی نو در طراحی وب سایت و اپلیکیشن، به عرصه فعالیت گام نهاد. ما در کنار مشتریان خود هستیم تا با مشاوره، طراحی و پشتیبانی حرفه‌ای، سهم آن‌ها را از بازار ۳۳ میلیونی کاربران اینترنت ایران افزایش دهیم.",
    statsTitle: "اعداد ما",
    stats: [
      { v: "+۱۵", l: "سال سابقه" },
      { v: "+۶٬۴۲۰", l: "پروژه موفق" },
      { v: "+۹٬۲۸۰", l: "مشتری راضی" },
      { v: "۲۴/۷", l: "پشتیبانی" },
    ],
    missionTitle: "ماموریت ما",
    missionDesc: "طراحی و برنامه‌نویسی وب‌سایت و اپلیکیشن — صرافی فیات و رمز ارز، فروشگاهی، آگهی، خبری، طلای آبشده، CMS، CRM و ERP — مطابق آخرین استانداردهای جهانی.",
    visionTitle: "چشم‌انداز",
    visionDesc: "تبدیل شدن به مرجع اصلی توسعه نرم‌افزار سفارشی در ایران با تکیه بر مجوزهای معتبر شورای عالی انفورماتیک، نظام صنفی رایانه‌ای، TUV آلمان، ISO 9001:2008 و اینماد.",
    valuesTitle: "خدمات ما",
    values: [
      { t: "طراحی وب‌سایت", d: "سایت‌های سازمانی، شرکتی، خبری، آگهی، طلای آبشده و فروشگاهی.", i: Trophy },
      { t: "اپلیکیشن اندروید و iOS", d: "نیتیو و کراس‌پلتفرم (Flutter، React Native).", i: Zap },
      { t: "صرافی رمز ارز و فیات", d: "طراحی و پیاده‌سازی پلتفرم‌های صرافی حرفه‌ای.", i: Shield },
      { t: "CRM و ERP", d: "اتوماسیون اداری سفارشی برای سازمان‌های دولتی و خصوصی.", i: Code2 },
      { t: "بهینه‌سازی سئو", d: "تا قرارگیری وب‌سایت شما در صفحات اول گوگل در کنار شما هستیم.", i: TrendingUp },
      { t: "آموزش و پشتیبانی", d: "آموزش برنامه‌نویسی و پشتیبانی پایدار پس از تحویل.", i: Heart },
    ],
    timelineTitle: "مسیر ما",
    timeline: [
      { y: "۱۳۸۸", t: "آغاز ستایش", d: "با یک تیم کوچک و یک رویا." },
      { y: "۱۳۹۳", t: "مجوز TUV آلمان", d: "اخذ گواهی بین‌المللی در حوزه برنامه‌نویسی." },
      { y: "۱۳۹۷", t: "گسترش خدمات", d: "ورود به حوزه صرافی رمز ارز و طلای آبشده." },
      { y: "۱۴۰۰", t: "CRM و ERP سازمانی", d: "همکاری با سازمان‌های دولتی و خصوصی." },
      { y: "۱۴۰۳", t: "+۶٬۴۲۰ پروژه", d: "یکی از بزرگ‌ترین پورتفولیوهای فنی ایران." },
    ],
    teamTitle: "تیم رهبری",
    cta1: "تماس با ما",
    cta2: "مشاهده محصولات",
  },
  en: {
    eyebrow: "About Setayesh",
    title1: "Building the",
    title2: "future of software",
    title3: "since 2009",
    lead: "Setayesh is an international team of engineers, designers, and strategists shipping world-class products for startups, banks and global enterprises.",
    statsTitle: "By the numbers",
    stats: [
      { v: "15+", l: "Years of craft" },
      { v: "6,420+", l: "Projects shipped" },
      { v: "9,280+", l: "Happy clients" },
      { v: "24/7", l: "Support" },
    ],
    missionTitle: "Our mission",
    missionDesc: "Turn bold ideas into scalable, secure, beautiful software systems.",
    visionTitle: "Our vision",
    visionDesc: "Build the digital backbone for the next generation of businesses — where AI, design and engineering converge.",
    valuesTitle: "What we stand for",
    values: [
      { t: "Uncompromised quality", d: "Every line of code. Every pixel. Every interaction.", i: Trophy },
      { t: "Speed × precision", d: "Ship fast without sacrificing detail.", i: Zap },
      { t: "Radical honesty", d: "Full transparency in every decision.", i: Heart },
      { t: "Engineering-first", d: "Decisions backed by data, not vibes.", i: Code2 },
      { t: "Security by default", d: "Built-in from day one, not bolted on.", i: Shield },
      { t: "Shared growth", d: "Your success is our success.", i: TrendingUp },
    ],
    timelineTitle: "Our journey",
    timeline: [
      { y: "2009", t: "Setayesh is born", d: "Four engineers and a dream." },
      { y: "2014", t: "First enterprise deal", d: "Partnership with national banks." },
      { y: "2018", t: "Global expansion", d: "Entering regional markets." },
      { y: "2021", t: "AI-first pivot", d: "Founding the AI/ML division." },
      { y: "2024", t: "6,420 projects", d: "Largest tech portfolio in the region." },
    ],
    teamTitle: "Leadership",
    cta1: "Let's build together",
    cta2: "View products",
  },
  ar: {
    eyebrow: "عن ستايش",
    title1: "نبني",
    title2: "مستقبل البرمجيات",
    title3: "منذ 2009",
    lead: "ستايش فريق دولي من المهندسين والمصممين والاستراتيجيين، يبني منتجات عالمية للشركات الناشئة والبنوك والمؤسسات الكبرى.",
    statsTitle: "بالأرقام",
    stats: [
      { v: "+15", l: "سنوات خبرة" },
      { v: "+6,420", l: "مشروع منجز" },
      { v: "+9,280", l: "عميل سعيد" },
      { v: "24/7", l: "دعم" },
    ],
    missionTitle: "مهمتنا",
    missionDesc: "تحويل الأفكار الجريئة إلى أنظمة برمجية قابلة للتوسع وآمنة وجميلة.",
    visionTitle: "رؤيتنا",
    visionDesc: "بناء البنية التحتية الرقمية للجيل القادم من الأعمال.",
    valuesTitle: "قيمنا",
    values: [
      { t: "جودة بلا تنازل", d: "كل سطر كود وكل بكسل بمعيار عالمي.", i: Trophy },
      { t: "سرعة ودقة", d: "تسليم سريع دون التضحية بالتفاصيل.", i: Zap },
      { t: "شفافية مطلقة", d: "وضوح كامل في كل قرار.", i: Heart },
      { t: "هندسة أولاً", d: "قرارات مبنية على البيانات.", i: Code2 },
      { t: "أمان افتراضي", d: "من اليوم الأول.", i: Shield },
      { t: "نمو مشترك", d: "نجاحك هو نجاحنا.", i: TrendingUp },
    ],
    timelineTitle: "رحلتنا",
    timeline: [
      { y: "2009", t: "ولادة ستايش", d: "أربعة مهندسين وحلم." },
      { y: "2014", t: "أول عقد مؤسسي", d: "شراكة مع البنوك الوطنية." },
      { y: "2018", t: "التوسع الإقليمي", d: "دخول أسواق المنطقة." },
      { y: "2021", t: "تركيز على AI", d: "تأسيس قسم الذكاء الاصطناعي." },
      { y: "2024", t: "6,420 مشروع", d: "أكبر محفظة تقنية في المنطقة." },
    ],
    teamTitle: "القيادة",
    cta1: "لنبنِ معاً",
    cta2: "عرض المنتجات",
  },
};

export function AboutPage() {
  const { lang } = useI18n();
  const c = COPY[lang as keyof typeof COPY] ?? COPY.fa;

  return (
    <main className="relative min-h-screen text-foreground">
      <SiteBackground />
      <Header />

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-4">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 start-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-gold opacity-20 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/5 px-3 py-1 text-xs text-muted-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {c.eyebrow}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]"
          >
            {c.title1}{" "}
            <span className="bg-gradient-gold bg-clip-text text-transparent">
              {c.title2}
            </span>
            <br />
            <span className="text-muted-foreground font-bold">{c.title3}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground"
          >
            {c.lead}
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-3">
          {c.stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-foreground/[0.02] p-6 hover:border-primary/40 transition-colors group"
            >
              <div className="absolute -top-12 -end-12 h-32 w-32 rounded-full bg-gradient-gold opacity-0 group-hover:opacity-20 blur-2xl transition-opacity" />
              <div className="text-3xl sm:text-4xl font-black bg-gradient-gold bg-clip-text text-transparent">{s.v}</div>
              <div className="mt-2 text-xs text-muted-foreground">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-4">
          {[
            { i: Target, t: c.missionTitle, d: c.missionDesc },
            { i: Rocket, t: c.visionTitle, d: c.visionDesc },
          ].map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-3xl border border-border bg-foreground/[0.02] p-8 sm:p-10"
            >
              <div className="absolute -top-20 -end-20 h-60 w-60 rounded-full bg-gradient-gold opacity-10 blur-3xl" />
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-gold shadow-[0_0_30px_-8px_var(--glow)]">
                <b.i className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-5 text-2xl font-bold">{b.t}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{b.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{c.valuesTitle}</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {c.values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="group rounded-2xl border border-border bg-foreground/[0.02] p-6 hover:border-primary/40 hover:bg-foreground/[0.04] transition-all"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background/40 text-primary group-hover:scale-110 transition-transform">
                  <v.i className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold">{v.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center">{c.timelineTitle}</h2>
          <div className="relative mt-12">
            <div className="absolute start-4 sm:start-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="space-y-8">
              {c.timeline.map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative flex items-start gap-4 sm:gap-8 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}
                >
                  <div className="hidden sm:block flex-1" />
                  <div className="absolute start-4 sm:start-1/2 -translate-x-1/2 mt-3 grid h-3 w-3 place-items-center rounded-full bg-gradient-gold shadow-[0_0_20px_var(--glow)]" />
                  <div className="flex-1 ps-12 sm:ps-0">
                    <div className="rounded-2xl border border-border bg-foreground/[0.02] p-5 hover:border-primary/40 transition-colors">
                      <div className="text-xs font-mono text-primary">{e.y}</div>
                      <div className="mt-1 font-bold text-lg">{e.t}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{e.d}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-5xl relative overflow-hidden rounded-3xl border border-border bg-foreground/[0.02] p-10 sm:p-14 text-center">
          <div className="absolute inset-0 -z-10 bg-gradient-gold opacity-10" />
          <div className="absolute -top-32 start-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-gradient-gold opacity-30 blur-3xl" />
          <Award className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight">
            <span className="bg-gradient-gold bg-clip-text text-transparent">Setayesh</span>
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-gold px-6 font-semibold text-primary-foreground shadow-[0_0_40px_-10px_var(--glow)] hover:scale-[1.03] transition"
            >
              {c.cta1} <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/products"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-background/40 px-6 font-semibold hover:bg-foreground/5 transition"
            >
              {c.cta2}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
