"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Mail, Phone, MapPin, MessageCircle, Send, Clock, Sparkles,
  CheckCircle2, Instagram, ArrowUpRight,
} from "lucide-react";
import { z } from "zod";
import { Header } from "@/features/silver-platform/components";
import { Footer } from "@/features/public-site/sections/Footer";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { useI18n } from "@/shared/i18n";

const COPY = {
  fa: {
    eyebrow: "تماس با ستایش",
    title1: "بیاید با هم",
    title2: "چیز بزرگی بسازیم",
    lead: "تیم ما در کمتر از ۲۴ ساعت پاسخ‌گو خواهد بود. تماس بگیرید، ایمیل بزنید یا فرم را پر کنید.",
    form: {
      name: "نام شما", namePh: "محمد رضایی",
      email: "ایمیل", emailPh: "you@company.com",
      phone: "شماره تماس", phonePh: "۰۹۱۲۳۴۵۶۷۸۹",
      subject: "موضوع", subjectPh: "همکاری در پروژه‌ی...",
      message: "پیام شما", messagePh: "درباره پروژه‌تان بنویسید...",
      budget: "بودجه تقریبی",
      budgetOptions: ["کمتر از ۱۰۰م", "۱۰۰م تا ۵۰۰م", "۵۰۰م تا ۱ میلیارد", "بیش از ۱ میلیارد"],
      submit: "ارسال پیام", sending: "در حال ارسال...",
      success: "پیام شما با موفقیت ارسال شد. به‌زودی پاسخ خواهیم داد.",
    },
    info: {
      title: "راه‌های ارتباطی",
      email: "ایمیل", phone: "تلفن تماس", address: "دفتر تهران",
      addressVal: "تهران، خیابان ولیعصر، بالاتر از پارک ساعی، نبش کوچه همسایگان، پلاک ۲۴۲۸، طبقه دوم",
      address2: "دفتر تهران", address2Val: "تهران، خیابان ولیعصر، بالاتر از پارک ساعی، نبش کوچه همسایگان، پلاک ۲۴۲۸، طبقه دوم",
      hours: "ساعات کاری", hoursVal: "شنبه تا پنج‌شنبه · ۹ تا ۱۸",
      response: "میانگین پاسخ‌گویی", responseVal: "کمتر از ۲ ساعت",
      social: "شبکه‌های اجتماعی",
    },
    errors: { name: "نام را وارد کنید", email: "ایمیل معتبر وارد کنید", message: "پیام باید حداقل ۱۰ کاراکتر باشد" },
  },
  en: {
    eyebrow: "Contact Setayesh",
    title1: "Let's build",
    title2: "something extraordinary",
    lead: "Our team responds within 24 hours. Call, email, or drop us a message — we'd love to hear from you.",
    form: {
      name: "Your name", namePh: "John Doe",
      email: "Email", emailPh: "you@company.com",
      phone: "Phone", phonePh: "+1 (555) 000-0000",
      subject: "Subject", subjectPh: "Project collaboration...",
      message: "Your message", messagePh: "Tell us about your project...",
      budget: "Estimated budget",
      budgetOptions: ["< $10K", "$10K — $50K", "$50K — $200K", "$200K+"],
      submit: "Send message", sending: "Sending...",
      success: "Message sent! We'll reply within 24 hours.",
    },
    info: {
      title: "Get in touch",
      email: "Email", phone: "Phone", address: "Tehran office",
      addressVal: "تهران، خیابان ولیعصر، بالاتر از پارک ساعی، نبش کوچه همسایگان، پلاک ۲۴۲۸، طبقه دوم",
      address2: "Tehran office", address2Val: "تهران، خیابان ولیعصر، بالاتر از پارک ساعی، نبش کوچه همسایگان، پلاک ۲۴۲۸، طبقه دوم",
      hours: "Working hours", hoursVal: "Sat — Thu · 9 AM to 6 PM",
      response: "Avg. response time", responseVal: "Under 2 hours",
      social: "Follow us",
    },
    errors: { name: "Name is required", email: "Valid email required", message: "Message must be 10+ characters" },
  },
  ar: {
    eyebrow: "تواصل مع ستايش",
    title1: "لنبنِ",
    title2: "شيئاً استثنائياً",
    lead: "فريقنا يرد خلال 24 ساعة. اتصل أو راسل أو املأ النموذج.",
    form: {
      name: "اسمك", namePh: "محمد علي",
      email: "البريد الإلكتروني", emailPh: "you@company.com",
      phone: "الهاتف", phonePh: "+966 5x xxx xxxx",
      subject: "الموضوع", subjectPh: "تعاون في مشروع...",
      message: "رسالتك", messagePh: "أخبرنا عن مشروعك...",
      budget: "الميزانية التقديرية",
      budgetOptions: ["< 10 آلاف", "10 – 50 ألف", "50 – 200 ألف", "+200 ألف"],
      submit: "إرسال", sending: "جاري الإرسال...",
      success: "تم إرسال رسالتك! سنرد خلال 24 ساعة.",
    },
    info: {
      title: "طرق التواصل",
      email: "البريد", phone: "الجوال", address: "المكتب الرئيسي (أصفهان)",
      addressVal: "تهران، خیابان ولیعصر، بالاتر از پارک ساعی، نبش کوچه همسایگان، پلاک ۲۴۲۸، طبقه دوم",
      address2: "مكتب طهران", address2Val: "تهران، خیابان ولیعصر، بالاتر از پارک ساعی، نبش کوچه همسایگان، پلاک ۲۴۲۸، طبقه دوم",
      hours: "ساعات العمل", hoursVal: "السبت – الخميس · 9 ص إلى 6 م",
      response: "متوسط الرد", responseVal: "أقل من ساعتين",
      social: "تابعنا",
    },
    errors: { name: "الاسم مطلوب", email: "بريد صحيح مطلوب", message: "الرسالة 10 أحرف على الأقل" },
  },
};

export function ContactPage() {
  const { lang } = useI18n();
  const c = COPY[lang as keyof typeof COPY] ?? COPY.fa;

  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "", budget: c.form.budgetOptions[1] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(1, c.errors.name).max(100),
    email: z.string().trim().email(c.errors.email).max(255),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    subject: z.string().trim().max(200).optional().or(z.literal("")),
    message: z.string().trim().min(10, c.errors.message).max(2000),
    budget: z.string().max(50),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach(i => { e[String(i.path[0])] = i.message; });
      setErrors(e);
      return;
    }
    setErrors({});
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 900);
  };

  const channels = [
    { i: Mail, l: c.info.email, v: "info@noghre.land", href: "mailto:info@noghre.land", ltr: true },
    { i: Phone, l: c.info.phone, v: "021-9155-0859", href: "tel:+982191550859", ltr: true },
    { i: MapPin, l: c.info.address, v: c.info.addressVal },
    { i: MapPin, l: c.info.address2, v: c.info.address2Val },
    { i: Clock, l: c.info.hours, v: c.info.hoursVal },
  ];
  const socials = [
    { i: Instagram, href: "https://www.instagram.com/setayesh.app" },
    { i: Phone, href: "tel:+982191550859" },
    { i: Mail, href: "mailto:info@noghre.land" },
  ];

  return (
    <main className="relative min-h-screen text-foreground">
      <SiteBackground />
      <Header />

      <section className="relative pt-40 pb-12 px-4">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-10 start-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-gold opacity-20 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/5 px-3 py-1 text-xs text-muted-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            {c.eyebrow}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]"
          >
            {c.title1}{" "}
            <span className="bg-gradient-gold bg-clip-text text-transparent">{c.title2}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground"
          >{c.lead}</motion.p>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-5 gap-4">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="lg:col-span-3 relative overflow-hidden rounded-3xl border border-border bg-foreground/[0.02] p-6 sm:p-10"
          >
            <div className="absolute -top-32 -end-20 h-72 w-72 rounded-full bg-gradient-gold opacity-10 blur-3xl pointer-events-none" />

            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="grid place-items-center py-20 text-center"
              >
                <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-gold shadow-[0_0_40px_-8px_var(--glow)]">
                  <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="mt-6 text-2xl font-bold">{c.form.success}</h3>
              </motion.div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={c.form.name} error={errors.name}>
                    <input
                      type="text" value={form.name} maxLength={100}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder={c.form.namePh}
                      className="w-full h-12 rounded-xl border border-border bg-background/40 px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </Field>
                  <Field label={c.form.email} error={errors.email}>
                    <input
                      type="email" value={form.email} maxLength={255}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder={c.form.emailPh}
                      className="w-full h-12 rounded-xl border border-border bg-background/40 px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={c.form.phone}>
                    <input
                      type="tel" value={form.phone} maxLength={40}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder={c.form.phonePh}
                      className="w-full h-12 rounded-xl border border-border bg-background/40 px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </Field>
                  <Field label={c.form.subject}>
                    <input
                      type="text" value={form.subject} maxLength={200}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder={c.form.subjectPh}
                      className="w-full h-12 rounded-xl border border-border bg-background/40 px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </Field>
                </div>
                <Field label={c.form.budget}>
                  <div className="flex flex-wrap gap-2">
                    {c.form.budgetOptions.map(o => (
                      <button
                        key={o} type="button"
                        onClick={() => setForm({ ...form, budget: o })}
                        className={`rounded-full border px-4 h-9 text-xs transition ${
                          form.budget === o
                            ? "bg-gradient-gold border-transparent text-primary-foreground shadow-[0_0_20px_-6px_var(--glow)]"
                            : "border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                        }`}
                      >{o}</button>
                    ))}
                  </div>
                </Field>
                <Field label={c.form.message} error={errors.message}>
                  <textarea
                    value={form.message} maxLength={2000} rows={5}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder={c.form.messagePh}
                    className="w-full rounded-xl border border-border bg-background/40 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
                  />
                </Field>
                <button
                  type="submit" disabled={sending}
                  className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-gold px-6 font-semibold text-primary-foreground shadow-[0_0_40px_-10px_var(--glow)] hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-60"
                >
                  <span className="relative z-10">{sending ? c.form.sending : c.form.submit}</span>
                  <Send className="relative z-10 h-4 w-4" />
                  <span className="absolute inset-0 animate-shimmer opacity-40" />
                </button>
              </form>
            )}
          </motion.div>

          {/* Info */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 grid gap-4"
          >
            <div className="rounded-3xl border border-border bg-foreground/[0.02] p-6">
              <div className="flex items-center gap-2 text-xs text-primary">
                <Sparkles className="h-3.5 w-3.5" /> {c.info.title}
              </div>
              <div className="mt-5 grid gap-4">
                {channels.map((ch, i) => {
                  const inner = (
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background/40 text-primary shrink-0">
                        <ch.i className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{ch.l}</div>
                        <div className="mt-0.5 text-sm font-medium break-words" dir={ch.ltr ? "ltr" : undefined} style={ch.ltr ? { unicodeBidi: "embed" } : undefined}>{ch.v}</div>
                      </div>
                    </div>
                  );
                  return ch.href ? (
                    <a key={i} href={ch.href} className="block rounded-xl p-2 -m-2 hover:bg-foreground/5 transition">{inner}</a>
                  ) : (
                    <div key={i} className="rounded-xl p-2 -m-2">{inner}</div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-foreground/[0.02] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.info.response}</div>
                  <div className="mt-1 text-xl font-bold bg-gradient-gold bg-clip-text text-transparent">{c.info.responseVal}</div>
                </div>
                <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-gold shadow-[0_0_30px_-8px_var(--glow)]">
                  <Clock className="h-5 w-5 text-primary-foreground" />
                  <span className="absolute -top-1 -end-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-foreground/[0.02] p-6">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.info.social}</div>
              <div className="mt-4 flex gap-2">
                {socials.map((s, i) => (
                  <a
                    key={i} href={s.href} target="_blank" rel="noreferrer"
                    className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/40 text-muted-foreground hover:text-primary hover:border-primary/40 hover:scale-110 transition"
                  >
                    <s.i className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <a
              href="tel:+982191550859"
              className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 p-6 hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">تماس تلفنی</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">021-9155-0859</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition" />
              </div>
            </a>
          </motion.aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
      {error && <div className="mt-1.5 text-xs text-destructive">{error}</div>}
    </label>
  );
}
