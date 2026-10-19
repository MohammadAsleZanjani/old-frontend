"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/shared/i18n";

function MockWindow({ title, lang, children }: { title: string; lang: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border glass overflow-hidden" dir="ltr">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-foreground/[0.02]">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
        <div className="text-[11px] font-mono text-muted-foreground">{title}</div>
        <div className="text-[11px] font-mono text-primary">{lang}</div>
      </div>
      <div className="p-4 font-mono text-[12.5px] leading-relaxed">{children}</div>
    </div>
  );
}

function Bars() {
  const bars = [38, 62, 48, 78, 56, 70, 84, 52, 90, 64, 76, 58, 70, 48, 80];
  return (
    <div className="flex items-end gap-1.5 h-24">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{ background: "linear-gradient(180deg, oklch(0.86 0.17 84), oklch(0.62 0.16 50))", boxShadow: "0 0 12px oklch(0.82 0.18 84 / 0.35)", height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-full glass border border-border px-4 py-2 text-xs font-medium"
    >
      {children}
    </div>
  );
}

// Typewriter that types tokens (preserves JSX coloring) sequentially
type Token = { t: string; c?: string };
type Line = Token[];

function HeroCode() {
  const lines: Line[] = [
    [
      { t: "import", c: "oklch(0.78 0.14 290)" },
      { t: " { Setayesh } " },
      { t: "from", c: "oklch(0.78 0.14 290)" },
      { t: " " },
      { t: "'@/os'", c: "oklch(0.86 0.17 84)" },
    ],
    [
      { t: "export const", c: "oklch(0.78 0.14 290)" },
      { t: " app = " },
      { t: "await", c: "oklch(0.78 0.14 290)" },
      { t: " " },
      { t: "Setayesh.spawn", c: "oklch(0.86 0.17 84)" },
      { t: "({" },
    ],
    [
      { t: "  modules: [" },
      { t: "'ai'", c: "oklch(0.86 0.17 84)" },
      { t: ", " },
      { t: "'erp'", c: "oklch(0.86 0.17 84)" },
      { t: ", " },
      { t: "'blockchain'", c: "oklch(0.86 0.17 84)" },
      { t: "]," },
    ],
    [{ t: "})" }],
  ];
  return (
    <div className="text-muted-foreground space-y-1 min-h-[112px]">
      {lines.map((parts, li) => (
        <div key={li}>
          {parts.map((p, i) => (
            <span key={i} style={p.c ? { color: p.c } : undefined}>{p.t}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Hero() {
  const { t, lang } = useI18n();
  const Arrow = lang === "en" ? ArrowRight : ArrowLeft;
  const dirIsRtl = lang !== "en";

  return (
    <section id="top" className="relative pt-32 pb-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[1fr_1.05fr] gap-12 items-center">
        {/* Text side — LEFT in grid (right in RTL) */}
        <div className="relative order-1">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1.5 text-xs font-mono"
            dir="ltr"
          >
            <span className="text-primary">{t.hero.tag}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
          </div>

          <h1
            className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-gradient-gold"
          >
            {t.hero.title1}
            <br />
            {t.hero.title2}
            <br />
            {t.hero.title3}
          </h1>

          <p
            className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-8"
          >
            {t.hero.desc}
          </p>

          <div
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a href="#contact" className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-xl bg-gradient-gold px-6 text-sm font-bold text-primary-foreground shadow-[0_0_50px_-10px_var(--glow)] transition-transform hover:scale-[1.04] active:scale-95">
              <span className="relative z-10">{t.hero.ctaPrimary}</span>
              <Arrow className="h-4 w-4 relative z-10 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </a>
            <a href="#services" className="inline-flex h-12 items-center gap-2 rounded-xl border border-border glass px-6 text-sm font-semibold hover:border-primary/40 hover:bg-foreground/5 transition">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {t.hero.ctaSecondary}
            </a>
          </div>

          <div
            className="mt-10 flex flex-wrap gap-2"
            dir={dirIsRtl ? "rtl" : "ltr"}
          >
            {t.hero.stats.map((s, i) => (
              <Pill key={i}>{s.v}</Pill>
            ))}
          </div>
        </div>

        {/* Visual side — RIGHT in grid (left in RTL) */}
        <div
          className="relative order-2 space-y-4"
        >
          <div className="absolute -inset-10 -z-10 rounded-[3rem] opacity-80" style={{
            background: "radial-gradient(closest-side, oklch(0.82 0.16 84 / 0.18), transparent 70%)",
            filter: "blur(40px)",
          }} />

          <MockWindow title="setayesh.os · bootstrap.ts" lang="TypeScript">
            <HeroCode />
          </MockWindow>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border glass p-4" dir="ltr">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground">{t.hero.opsLive}</span>
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {t.hero.streaming}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { l: t.hero.mrr, v: "$184k", d: "+12.4%", up: true },
                  { l: t.hero.latency, v: "84ms", d: "-9%", up: true },
                  { l: t.hero.throughput, v: "42k/s", d: "+3.1%", up: true },
                  { l: t.hero.error, v: "0.02%", d: "-0.4%", up: true },
                ].map(s => (
                  <div key={s.l} className="rounded-lg border border-border bg-foreground/[0.03] p-2.5">
                    <div className="text-[9px] font-mono text-muted-foreground tracking-widest">{s.l}</div>
                    <div className="font-bold text-sm mt-0.5">{s.v}</div>
                    <div className={`text-[10px] ${s.up ? "text-success" : "text-destructive"}`}>{s.d}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Bars />
              </div>
            </div>

            <MockWindow title={t.hero.terminal} lang="zsh">
              <div><span className="text-primary">$</span> setayesh init enterprise-app</div>
              <div className="text-muted-foreground">{">"} bootstrapping monorepo <span className="text-success">✓</span></div>
              <div className="text-muted-foreground">{">"} provisioning k8s cluster <span className="text-success">✓</span></div>
              <div className="text-muted-foreground">{">"} wiring ERP · CRM · AI <span className="text-success">✓</span></div>
              <div><span className="text-primary">$</span> deploy --region=fra-1 --strategy=canary<span className="inline-block w-2 h-4 align-middle bg-primary animate-blink ms-1" /></div>
            </MockWindow>
          </div>
        </div>
      </div>

      <div
        className="mt-20 border-t border-border"
      >
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-around gap-x-10 gap-y-3 text-xs font-mono text-muted-foreground" dir="ltr">
          {["FASTAPI", "GRPC", "GRAPHQL", "OAUTH 2.1", "OPENTELEMETRY", "ARGOCD"].map(x => (
            <div key={x} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {x}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
