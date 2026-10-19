"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Wand2, Copy, Check, ArrowRight, Gift, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useI18n } from "@/shared/i18n";
import { toast } from "@/shared/ui/sonner";

type BuiltInLang = "fa" | "en" | "ar";

const COPY: Record<BuiltInLang, {
  badge: string; title1: string; title2: string; desc: string;
  step: (n: number, total: number) => string;
  q1: string; q2: string; q3: string;
  industries: string[]; budgets: string[]; goals: string[];
  custom: string; next: string; back: string; generate: string; generating: string;
  blueprintTitle: string; rewardTitle: string; rewardDesc: string;
  copy: string; copied: string; tryAgain: string; ctaContact: string;
  failed: string; placeholder: string;
}> = {
  en: {
    badge: "AI BLUEPRINT GENERATOR",
    title1: "Tell us your dream.",
    title2: "We'll architect it in seconds.",
    desc: "Answer 3 quick questions and our AI will design a custom product blueprint for you — plus unlock a 10% off coupon.",
    step: (n, t) => `Step ${n} of ${t}`,
    q1: "What industry are you in?",
    q2: "What's your budget range?",
    q3: "What's your main goal?",
    industries: ["Crypto Exchange / OTC", "Blockchain & Smart Contracts", "Token & Wallet", "AI Trading Bot", "Melted Gold Script", "Multi-vendor Shop Script", "News / Magazine CMS", "FinTech", "E-commerce", "Healthcare", "Education", "Logistics", "Real Estate", "Enterprise ERP / CRM"],
    budgets: ["< $5k", "$5k – $20k", "$20k – $100k", "$100k+"],
    goals: ["Launch an MVP", "Buy a ready script", "Scale existing product", "Automate operations", "Add AI capabilities", "Integrate blockchain / crypto"],
    custom: "Or write your own…",
    next: "Next",
    back: "Back",
    generate: "Generate my blueprint",
    generating: "Designing your blueprint…",
    blueprintTitle: "Your custom blueprint",
    rewardTitle: "🎉 You earned a 10% discount!",
    rewardDesc: "Use this code on your first project with Setayesh.",
    copy: "Copy code",
    copied: "Copied!",
    tryAgain: "Try another",
    ctaContact: "Claim my discount",
    failed: "Generation failed. Please try again.",
    placeholder: "Type here…",
  },
  fa: {
    badge: "تولیدکننده‌ی هوشمند ایده",
    title1: "ایده‌ی خود را بگویید.",
    title2: "تا چند ثانیه دیگر طرحش را می‌سازیم.",
    desc: "به ۳ سوال کوتاه پاسخ دهید تا هوش مصنوعی ستایش، طرح اختصاصی محصول‌تان را طراحی کند و یک کد تخفیف ۱۰٪ هدیه بگیرید.",
    step: (n, t) => `مرحله ${n} از ${t}`,
    q1: "در چه صنعتی فعالیت می‌کنید؟",
    q2: "بازه‌ی بودجه‌ی شما چقدر است؟",
    q3: "هدف اصلی پروژه چیست؟",
    industries: ["صرافی رمزارز / OTC", "بلاکچین و قرارداد هوشمند", "توکن و کیف‌پول", "ربات معامله‌گر هوشمند", "اسکریپت طلای آبشده", "اسکریپت چندفروشگاهی", "CMS خبری و مجله", "مالی و فین‌تک", "فروشگاهی", "سلامت و درمان", "آموزش", "لجستیک و حمل‌ونقل", "املاک", "ERP / CRM سازمانی"],
    budgets: ["زیر ۲۰۰ میلیون", "۲۰۰ تا ۸۰۰ میلیون", "۸۰۰ میلیون تا ۴ میلیارد", "بیش از ۴ میلیارد"],
    goals: ["راه‌اندازی MVP", "خرید اسکریپت آماده", "توسعه محصول فعلی", "اتوماسیون فرآیندها", "افزودن قابلیت‌های AI", "ادغام بلاکچین / رمزارز"],
    custom: "یا خودتان بنویسید…",
    next: "بعدی",
    back: "قبلی",
    generate: "طرح من را بساز",
    generating: "در حال طراحی…",
    blueprintTitle: "طرح اختصاصی شما",
    rewardTitle: "🎉 کد تخفیف ۱۰٪ شما فعال شد!",
    rewardDesc: "این کد را در اولین پروژه‌تان با ستایش استفاده کنید.",
    copy: "کپی کد",
    copied: "کپی شد!",
    tryAgain: "یک‌بار دیگر",
    ctaContact: "دریافت تخفیف",
    failed: "خطا در تولید. لطفاً دوباره تلاش کنید.",
    placeholder: "اینجا بنویسید…",
  },
  ar: {
    badge: "مولّد المخططات بالذكاء الاصطناعي",
    title1: "أخبرنا بحلمك.",
    title2: "وسنصمّمه في ثوانٍ.",
    desc: "أجب عن ٣ أسئلة سريعة وسيصمّم الذكاء الاصطناعي مخطط منتجك المخصص — مع كوبون خصم ١٠٪.",
    step: (n, t) => `الخطوة ${n} من ${t}`,
    q1: "ما هي صناعتك؟",
    q2: "ما هو نطاق ميزانيتك؟",
    q3: "ما هو هدفك الرئيسي؟",
    industries: ["منصة عملات رقمية / OTC", "بلوكتشين وعقود ذكية", "توكن ومحفظة", "روبوت تداول بالذكاء الاصطناعي", "سكربت الذهب المذاب", "سكربت متعدد البائعين", "نظام إدارة محتوى إخباري", "التكنولوجيا المالية", "التجارة الإلكترونية", "الرعاية الصحية", "التعليم", "اللوجستيات", "العقارات", "ERP / CRM للمؤسسات"],
    budgets: ["< 5,000$", "5,000$ – 20,000$", "20,000$ – 100,000$", "100,000$+"],
    goals: ["إطلاق MVP", "شراء سكربت جاهز", "توسيع منتج قائم", "أتمتة العمليات", "إضافة قدرات الذكاء الاصطناعي", "دمج البلوكتشين / العملات الرقمية"],
    custom: "أو اكتب بنفسك…",
    next: "التالي",
    back: "السابق",
    generate: "أنشئ مخططي",
    generating: "جاري التصميم…",
    blueprintTitle: "مخططك المخصص",
    rewardTitle: "🎉 حصلت على خصم ١٠٪!",
    rewardDesc: "استخدم هذا الكود في مشروعك الأول مع ستايش.",
    copy: "نسخ الكود",
    copied: "تم النسخ!",
    tryAgain: "حاول مرة أخرى",
    ctaContact: "احصل على الخصم",
    failed: "فشل التوليد. حاول مرة أخرى.",
    placeholder: "اكتب هنا…",
  },
};

export function IdeaGenerator() {
  const { lang } = useI18n();
  const t = COPY[lang as BuiltInLang] ?? COPY.fa;

  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState("");
  const [budget, setBudget] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ blueprint: string; coupon: string; discountPct: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const values = [industry, budget, goal];
  const setters = [setIndustry, setBudget, setGoal];
  const options = [t.industries, t.budgets, t.goals];
  const questions = [t.q1, t.q2, t.q3];
  const total = 3;
  const current = values[step] ?? "";

  const reset = () => {
    setStep(0); setIndustry(""); setBudget(""); setGoal(""); setResult(null); setCopied(false);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, budget, goal, lang }),
      });
      if (!response.ok) throw new Error(t.failed);
      const r = (await response.json()) as {
        blueprint: string;
        coupon: string;
        discountPct: number;
      };
      setResult(r);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.failed);
    } finally {
      setLoading(false);
    }
  };

  const copyCoupon = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.coupon);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* noop */ }
  };

  return (
    <section id="ai-blueprint" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-60" style={{
        background: "radial-gradient(60% 50% at 50% 0%, oklch(0.82 0.18 84 / 0.10), transparent 70%)",
      }} />
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1.5 text-xs font-mono">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary">{t.badge}</span>
          </div>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl font-black tracking-tight">
            <span className="text-gradient-gold">{t.title1}</span>
            <br />
            <span>{t.title2}</span>
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-muted-foreground">{t.desc}</p>
        </div>

        <div className="mt-12 relative">
          <div className="absolute -inset-8 -z-10 rounded-[2.5rem] opacity-70" style={{
            background: "radial-gradient(closest-side, oklch(0.82 0.16 84 / 0.15), transparent 70%)",
            filter: "blur(40px)",
          }} />
          <div className="rounded-3xl border border-border glass p-6 sm:p-10 min-h-[420px]">
            <AnimatePresence mode="wait">
              {!result && !loading && (
                <motion.div
                  key={`step-${step}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-6">
                    <span>{t.step(step + 1, total)}</span>
                    <div className="flex gap-1.5">
                      {Array.from({ length: total }).map((_, i) => (
                        <span key={i} className={`h-1.5 w-8 rounded-full transition ${i <= step ? "bg-primary" : "bg-foreground/10"}`} />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl font-bold">{questions[step]}</h3>

                  <div className="mt-6 grid sm:grid-cols-2 gap-3">
                    {options[step].map((opt) => {
                      const active = current === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setters[step](opt)}
                          className={`text-start rounded-xl border px-4 py-3 text-sm font-medium transition ${
                            active
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border hover:border-primary/40 hover:bg-foreground/5"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    <input
                      type="text"
                      value={options[step].includes(current) ? "" : current}
                      onChange={(e) => setters[step](e.target.value)}
                      placeholder={t.custom}
                      className="w-full rounded-xl border border-border bg-foreground/[0.02] px-4 py-3 text-sm outline-none focus:border-primary/60 transition"
                    />
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                      disabled={step === 0}
                      className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold disabled:opacity-30 hover:bg-foreground/5 transition"
                    >
                      {t.back}
                    </button>

                    {step < total - 1 ? (
                      <button
                        onClick={() => setStep((s) => s + 1)}
                        disabled={!current.trim()}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-gold px-6 text-sm font-bold text-primary-foreground disabled:opacity-40 hover:scale-[1.03] transition"
                      >
                        {t.next}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </button>
                    ) : (
                      <button
                        onClick={submit}
                        disabled={!current.trim()}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-gold px-6 text-sm font-bold text-primary-foreground disabled:opacity-40 hover:scale-[1.03] transition"
                      >
                        <Wand2 className="h-4 w-4" />
                        {t.generate}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="relative">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/20 blur-2xl" />
                  </div>
                  <p className="mt-6 font-mono text-sm text-muted-foreground">{t.generating}</p>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.blueprintTitle}
                  </div>
                  <div className="prose prose-invert prose-sm sm:prose-base max-w-none mt-3 prose-headings:text-gradient-gold prose-headings:font-display prose-strong:text-foreground prose-li:marker:text-primary">
                    <ReactMarkdown>{result.blueprint}</ReactMarkdown>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-8 relative overflow-hidden rounded-2xl border border-primary/40 p-6"
                    style={{ background: "linear-gradient(135deg, oklch(0.82 0.18 84 / 0.18), oklch(0.42 0.14 330 / 0.18))" }}
                  >
                    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                      <div>
                        <div className="flex items-center gap-2 font-bold text-lg">
                          <Gift className="h-5 w-5 text-primary" />
                          {t.rewardTitle}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{t.rewardDesc}</p>
                      </div>
                      <div className="flex items-center gap-2" dir="ltr">
                        <code className="px-4 py-2.5 rounded-lg bg-background/60 border border-primary/40 font-mono font-bold text-primary text-sm sm:text-base tracking-wider">
                          {result.coupon}
                        </code>
                        <button
                          onClick={copyCoupon}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-gold text-primary-foreground hover:scale-105 transition"
                          aria-label={t.copy}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <a
                      href="#contact"
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-gold px-6 text-sm font-bold text-primary-foreground hover:scale-[1.03] transition"
                    >
                      {t.ctaContact}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </a>
                    <button
                      onClick={reset}
                      className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold hover:bg-foreground/5 transition"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {t.tryAgain}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default IdeaGenerator;
