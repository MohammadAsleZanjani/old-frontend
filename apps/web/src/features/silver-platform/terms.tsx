import { BookOpenCheck, Scale, ShieldCheck, Sparkles } from "lucide-react";

import { SilverShell } from "./components";
import { referralTerms, termsIntroduction, termsSections } from "./terms-content";

export function TermsPage() {
  return (
    <SilverShell>
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--gold)/0.13),transparent_66%)]" />
        <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20">
          <header className="mx-auto max-w-4xl text-center">
            <span className="silver-eyebrow">
              <Scale className="h-3.5 w-3.5" /> سند حقوقی نقره‌لند
            </span>
            <h1 className="mt-6 text-3xl font-black leading-[1.35] sm:text-4xl md:text-5xl">
              قوانین و مقررات استفاده از خدمات نقره‌لند
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-muted-foreground sm:text-base">
              لطفاً پیش از ثبت‌نام، معامله یا استفاده از خدمات، این مقررات را به‌دقت مطالعه کنید.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2">
                <BookOpenCheck className="h-4 w-4 text-gold" /> شامل ۲۶ ماده
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-gold" /> نسخه جاری و لازم‌الاجرا
              </span>
            </div>
          </header>

          <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
            <aside className="hidden rounded-3xl border border-border bg-card/75 p-4 shadow-elegant backdrop-blur lg:sticky lg:top-24 lg:block">
              <div className="px-2 pb-3 text-sm font-black">فهرست مواد</div>
              <nav aria-label="فهرست قوانین" className="max-h-[calc(100vh-10rem)] space-y-1 overflow-y-auto pl-1">
                {termsSections.map((section) => (
                  <a
                    className="block rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-gold/10 hover:text-foreground"
                    href={`#${section.id}`}
                    key={section.id}
                  >
                    {section.title}
                  </a>
                ))}
                <a className="block rounded-xl px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10" href="#referral-terms">
                  شرایط ویژه پاداش معرفی
                </a>
              </nav>
            </aside>

            <article className="min-w-0 rounded-[2rem] border border-border bg-card/80 p-5 shadow-premium backdrop-blur sm:p-8 md:p-10">
              <div className="rounded-3xl border border-gold/20 bg-gold/[0.06] p-5 sm:p-7">
                {termsIntroduction.map((paragraph) => (
                  <p className="text-sm leading-8 text-foreground/85 sm:text-base sm:leading-9" key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-10 space-y-10">
                {termsSections.map((section) => (
                  <section className="scroll-mt-28 border-b border-border/70 pb-10 last:border-0" id={section.id} key={section.id}>
                    <h2 className="flex items-center gap-3 text-xl font-black sm:text-2xl">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                        <Scale className="size-4" />
                      </span>
                      {section.title}
                    </h2>
                    {section.items?.length ? (
                      <div className="mt-5 space-y-3">
                        {section.items.map((item) => (
                          <p className="text-sm leading-8 text-muted-foreground sm:text-[15px] sm:leading-9" key={item}>{item}</p>
                        ))}
                      </div>
                    ) : null}
                    {section.bullets?.length ? (
                      <ul className="mt-5 space-y-3">
                        {section.bullets.map((item) => (
                          <li className="flex items-start gap-3 text-sm leading-8 text-muted-foreground sm:text-[15px]" key={item}>
                            <span className="mt-3 size-1.5 shrink-0 rounded-full bg-gold" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {section.closing ? <p className="mt-5 text-sm leading-8 text-muted-foreground sm:text-[15px] sm:leading-9">{section.closing}</p> : null}
                  </section>
                ))}
              </div>

              <section className="scroll-mt-28 rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/15 via-card to-card p-5 shadow-elegant sm:p-8" id="referral-terms">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground shadow-glow">
                    <Sparkles className="size-5" />
                  </span>
                  <h2 className="text-xl font-black sm:text-2xl">شرایط ویژه پاداش معرفی</h2>
                </div>
                <div className="mt-5 space-y-3">
                  {referralTerms.map((paragraph) => (
                    <p className="text-sm leading-8 text-foreground/80 sm:text-[15px] sm:leading-9" key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                وب‌سایت رسمی نقره‌لند:{" "}
                <a className="font-black text-gold transition hover:text-foreground" dir="ltr" href="https://noghre.land">Noghre.land</a>
              </div>
            </article>
          </div>
        </section>
      </main>
    </SilverShell>
  );
}
