"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/shared/i18n";

/* ============================================================
   Color tokens (kept literal so syntax theming stays consistent
   across light/dark — these are accents on top of the IDE chrome
   which is driven by design tokens)
   ============================================================ */
const PURPLE = "oklch(0.78 0.14 290)";
const GOLD = "oklch(0.86 0.17 84)";
const GREEN = "oklch(0.78 0.16 150)";
const ORANGE = "oklch(0.78 0.16 60)";
const BLUE = "oklch(0.78 0.13 235)";
const PINK = "oklch(0.78 0.16 350)";
const COMMENT = "oklch(0.62 0.04 80)";

type Tok = { t: string; c?: string };
type LineDef = Tok[];

/* ============================================================
   Sample files
   ============================================================ */
const FILES: { name: string; lang: string; lines: LineDef[] }[] = [
  {
    name: "ai.agent.ts",
    lang: "TypeScript",
    lines: [
      [{ t: "import", c: PURPLE }, { t: " { " }, { t: "createAgent", c: BLUE }, { t: ", " }, { t: "tools", c: BLUE }, { t: " } " }, { t: "from", c: PURPLE }, { t: " " }, { t: "\"@setayesh/ai\"", c: GREEN }, { t: ";" }],
      [{ t: "" }],
      [{ t: "// orchestrate multi-model reasoning", c: COMMENT }],
      [{ t: "export const", c: PURPLE }, { t: " agent = " }, { t: "createAgent", c: GOLD }, { t: "({" }],
      [{ t: "  name: " }, { t: "\"setayesh-copilot\"", c: GREEN }, { t: "," }],
      [{ t: "  model: " }, { t: "\"gpt-5-pro\"", c: GREEN }, { t: "," }],
      [{ t: "  memory: " }, { t: "\"vector\"", c: GREEN }, { t: "," }],
      [{ t: "  tools: [tools." }, { t: "db", c: ORANGE }, { t: ", tools." }, { t: "search", c: ORANGE }, { t: ", tools." }, { t: "rag", c: ORANGE }, { t: "]," }],
      [{ t: "  guardrails: { " }, { t: "pii", c: BLUE }, { t: ": " }, { t: "true", c: ORANGE }, { t: ", " }, { t: "rateLimit", c: BLUE }, { t: ": " }, { t: "200", c: ORANGE }, { t: " }," }],
      [{ t: "});" }],
      [{ t: "" }],
      [{ t: "await", c: PURPLE }, { t: " agent." }, { t: "stream", c: GOLD }, { t: "(prompt, ctx);" }],
    ],
  },
  {
    name: "platform.config.ts",
    lang: "TypeScript",
    lines: [
      [{ t: "import", c: PURPLE }, { t: " { " }, { t: "Platform", c: ORANGE }, { t: " } " }, { t: "from", c: PURPLE }, { t: " " }, { t: "\"@setayesh/core\"", c: GREEN }, { t: ";" }],
      [{ t: "" }],
      [{ t: "export const", c: PURPLE }, { t: " os = " }, { t: "new", c: PURPLE }, { t: " " }, { t: "Platform", c: ORANGE }, { t: "({" }],
      [{ t: "  region: " }, { t: "\"ir-tehran-1\"", c: GREEN }, { t: "," }],
      [{ t: "  runtime: " }, { t: "\"edge\"", c: GREEN }, { t: "," }],
      [{ t: "  modules: [" }, { t: "\"api\"", c: GREEN }, { t: ", " }, { t: "\"auth\"", c: GREEN }, { t: ", " }, { t: "\"erp\"", c: GREEN }, { t: ", " }, { t: "\"ai\"", c: GREEN }, { t: ", " }, { t: "\"blockchain\"", c: GREEN }, { t: "]," }],
      [{ t: "  observability: { " }, { t: "otel", c: BLUE }, { t: ": " }, { t: "true", c: ORANGE }, { t: " }," }],
      [{ t: "  scale: { " }, { t: "min", c: BLUE }, { t: ": " }, { t: "3", c: ORANGE }, { t: ", " }, { t: "max", c: BLUE }, { t: ": " }, { t: "Infinity", c: ORANGE }, { t: " }," }],
      [{ t: "});" }],
      [{ t: "" }],
      [{ t: "// canary deploy to production", c: COMMENT }],
      [{ t: "await", c: PURPLE }, { t: " os." }, { t: "deploy", c: GOLD }, { t: "({ env: " }, { t: "\"prod\"", c: GREEN }, { t: ", strategy: " }, { t: "\"canary\"", c: GREEN }, { t: " });" }],
    ],
  },
  {
    name: "schema.prisma",
    lang: "Prisma",
    lines: [
      [{ t: "model", c: PURPLE }, { t: " " }, { t: "Tenant", c: ORANGE }, { t: " {" }],
      [{ t: "  id        " }, { t: "String", c: BLUE }, { t: "  " }, { t: "@id @default", c: PINK }, { t: "(cuid())" }],
      [{ t: "  name      " }, { t: "String", c: BLUE }],
      [{ t: "  plan      " }, { t: "Plan", c: ORANGE }, { t: "   " }, { t: "@default", c: PINK }, { t: "(PRO)" }],
      [{ t: "  region    " }, { t: "String", c: BLUE }, { t: "  " }, { t: "@default", c: PINK }, { t: "(\"ir-tehran-1\")" }],
      [{ t: "  createdAt " }, { t: "DateTime", c: BLUE }, { t: " " }, { t: "@default", c: PINK }, { t: "(now())" }],
      [{ t: "  users     " }, { t: "User", c: ORANGE }, { t: "[]" }],
      [{ t: "}" }],
    ],
  },
];

/* ============================================================
   Typing engine
   ============================================================ */
function useTypeOnView(lines: LineDef[], active: boolean, speed = 38, delay = 0) {
  const total = useMemo(
    () => lines.reduce((a, l) => a + l.reduce((b, t) => b + t.t.length, 0), 0) || 1,
    [lines]
  );
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!active) return;
    setN(0);
    let iv: number | undefined;
    const start = window.setTimeout(() => {
      iv = window.setInterval(() => {
        setN((v) => {
          if (v >= total) {
            if (iv) window.clearInterval(iv);
            return v;
          }
          return v + 1;
        });
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      if (iv) window.clearInterval(iv);
    };
  }, [active, total, speed, delay]);

  let consumed = 0;
  const rendered = lines.map((line) => {
    const parts: { text: string; c?: string }[] = [];
    let done = true;
    for (const tok of line) {
      const remaining = Math.max(0, n - consumed);
      const slice = tok.t.slice(0, Math.min(tok.t.length, remaining));
      parts.push({ text: slice, c: tok.c });
      consumed += tok.t.length;
      if (slice.length < tok.t.length) {
        done = false;
        break;
      }
    }
    return { parts, done, started: parts.some((p) => p.text.length > 0) };
  });

  return { lines: rendered, progress: n / total, complete: n >= total };
}

/* ============================================================
   IDE chrome
   ============================================================ */
function Dots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full bg-destructive/80 shadow-[0_0_8px_oklch(0.7_0.2_25/0.5)]" />
      <span className="h-3 w-3 rounded-full bg-accent/80 shadow-[0_0_8px_oklch(0.8_0.15_70/0.5)]" />
      <span className="h-3 w-3 rounded-full bg-success/80 shadow-[0_0_8px_oklch(0.75_0.18_150/0.5)]" />
    </div>
  );
}

function FileTree({ activeIndex, onPick }: { activeIndex: number; onPick: (i: number) => void }) {
  return (
    <div className="hidden md:flex flex-col w-[180px] shrink-0 border-e border-border bg-foreground/[0.015] py-3 text-[11.5px] font-mono">
      <div className="px-3 pb-2 text-[10px] tracking-[0.22em] text-muted-foreground/80">EXPLORER</div>
      <div className="px-2 space-y-0.5">
        <div className="px-2 py-1 text-muted-foreground flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
          setayesh-os
        </div>
        <div className="ps-4 space-y-0.5">
          <div className="px-2 py-0.5 text-muted-foreground/80">📁 src</div>
          {FILES.map((f, i) => (
            <button
              key={f.name}
              onClick={() => onPick(i)}
              className={`w-full text-start px-2 py-1 rounded-md flex items-center gap-2 transition ${
                i === activeIndex
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/80 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: i === activeIndex ? GOLD : "oklch(0.6 0.02 80 / 0.6)" }} />
              {f.name}
            </button>
          ))}
          <div className="px-2 py-0.5 text-muted-foreground/80">📁 infra</div>
          <div className="ps-3 px-2 py-0.5 text-muted-foreground/60">docker-compose.yml</div>
          <div className="ps-3 px-2 py-0.5 text-muted-foreground/60">k8s.yaml</div>
        </div>
      </div>
      <div className="mt-auto px-3 pt-4 text-[10px] tracking-[0.22em] text-muted-foreground/80">GIT</div>
      <div className="px-3 mt-1 text-[10px] font-mono text-muted-foreground/80 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        main · synced
      </div>
    </div>
  );
}

function Tabs({ files, active, onPick }: { files: typeof FILES; active: number; onPick: (i: number) => void }) {
  return (
    <div className="flex items-stretch border-b border-border bg-foreground/[0.02] overflow-x-auto">
      {files.map((f, i) => (
        <button
          key={f.name}
          onClick={() => onPick(i)}
          className={`group relative px-4 py-2 text-[11.5px] font-mono flex items-center gap-2 border-e border-border transition ${
            i === active ? "text-primary bg-background/40" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: i === active ? GOLD : "oklch(0.6 0.02 80 / 0.5)" }}
          />
          {f.name}
          {i === active && (
            <motion.span
              layoutId="tab-underline"
              className="absolute inset-x-2 -bottom-px h-[2px] rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }}
            />
          )}
        </button>
      ))}
      <div className="ms-auto flex items-center gap-3 px-3 text-[10px] font-mono text-muted-foreground/80">
        <span className="hidden lg:inline">UTF-8 · LF</span>
        <span>TS 5.6</span>
      </div>
    </div>
  );
}

/* ============================================================
   Editor body
   ============================================================ */
function Editor({ active }: { active: boolean }) {
  const [fileIdx, setFileIdx] = useState(0);
  // auto-cycle through files
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setFileIdx((i) => (i + 1) % FILES.length), 9000);
    return () => window.clearInterval(id);
  }, [active]);

  const file = FILES[fileIdx];
  const typed = useTypeOnView(file.lines, active, 38, 250);
  const completedLines = typed.lines.filter((l) => l.done && l.started).length;
  const totalChars = file.lines.reduce((a, l) => a + l.reduce((b, t) => b + t.t.length, 0), 0);
  const typedChars = Math.round(typed.progress * totalChars);

  // active line = first line not done, else last
  const activeLine = typed.lines.findIndex((l) => l.started && !l.done);
  const highlightLine = activeLine === -1 ? typed.lines.length - 1 : activeLine;

  return (
    <div className="flex" dir="ltr">
      <FileTree activeIndex={fileIdx} onPick={setFileIdx} />
      <div className="flex-1 min-w-0">
        <Tabs files={FILES} active={fileIdx} onPick={setFileIdx} />

        {/* code area */}
        <div className="relative px-0 py-3 font-mono text-[12.5px] leading-[1.85] min-h-[340px]">
          {/* active line highlight */}
          <motion.div
            aria-hidden
            className="absolute inset-x-0 pointer-events-none"
            style={{
              top: `${12 + highlightLine * 23.275}px`,
              height: "23.275px",
              background:
                "linear-gradient(90deg, oklch(0.82 0.18 84 / 0.10), oklch(0.82 0.18 84 / 0.02) 70%, transparent)",
              borderLeft: "2px solid var(--primary)",
            }}
            initial={false}
            animate={{ opacity: 1 }}
          />

          {typed.lines.map((line, i) => (
            <div key={i} className="flex items-start gap-3 px-4 relative">
              <div className="w-7 text-end text-[11px] text-muted-foreground/55 font-mono select-none pt-[1px]">
                {i + 1}
              </div>
              <div className="flex-1 text-foreground/90 whitespace-pre">
                {line.parts.map((p, j) => (
                  <span key={j} style={p.c ? { color: p.c, textShadow: `0 0 14px ${p.c}33` } : undefined}>
                    {p.text}
                  </span>
                ))}
                {!line.done && line.started && (
                  <span className="inline-block w-[7px] h-[14px] align-middle bg-primary animate-blink ms-0.5 shadow-[0_0_10px_var(--primary)]" />
                )}
                {line.parts.every((p) => p.text.length === 0) && <span>&nbsp;</span>}
              </div>
            </div>
          ))}

          {/* mini-map */}
          <div className="absolute top-2 right-2 bottom-2 w-[42px] rounded-md border border-border/60 bg-foreground/[0.02] p-1 hidden md:flex flex-col gap-[2px] overflow-hidden">
            {file.lines.map((l, i) => {
              const charCount = l.reduce((a, t) => a + t.t.length, 0);
              const w = Math.min(100, 18 + charCount * 1.4);
              const isActive = i === highlightLine;
              return (
                <div
                  key={i}
                  className="h-[6px] rounded-sm"
                  style={{
                    width: `${w}%`,
                    background: isActive
                      ? "linear-gradient(90deg, var(--primary), transparent)"
                      : "oklch(0.6 0.02 80 / 0.25)",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* status bar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-foreground/[0.025] text-[10px] font-mono tracking-[0.18em] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> COMPILED
            </span>
            <span>0 ERRORS</span>
            <span className="hidden sm:inline">0 WARNINGS</span>
          </div>
          <div className="flex items-center gap-4">
            <span>LN {completedLines}/{file.lines.length}</span>
            <span className="hidden sm:inline">{typedChars}B</span>
            <span className="hidden md:inline">{file.lang.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Console / terminal panel (right side)
   ============================================================ */
type LogLine = { tag: string; tagColor: string; msg: string };

const LOG_FEED: LogLine[] = [
  { tag: "BUILD", tagColor: BLUE, msg: "compiling 412 modules ..." },
  { tag: "BUILD", tagColor: GREEN, msg: "compiled ✓  1.84s" },
  { tag: "INFRA", tagColor: PURPLE, msg: "provisioning fra-1.k8s.cluster" },
  { tag: "DB   ", tagColor: GOLD, msg: "migrations applied: 0028_add_tenants.sql" },
  { tag: "AI   ", tagColor: PINK, msg: "loading model setayesh-gpt · 12.4GB" },
  { tag: "AI   ", tagColor: GREEN, msg: "warm pool ready · p95 84ms" },
  { tag: "EDGE ", tagColor: ORANGE, msg: "deploying 14 regions · canary 5%" },
  { tag: "OK   ", tagColor: GREEN, msg: "deploy succeeded · v15.0.241" },
];

function LiveConsole({ active }: { active: boolean }) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const tick = () => {
      setLogs((prev) => {
        const next = [...prev, LOG_FEED[i % LOG_FEED.length]];
        return next.slice(-9);
      });
      i++;
    };
    tick();
    const iv = window.setInterval(tick, 2400);
    return () => window.clearInterval(iv);
  }, [active]);

  return (
    <div className="rounded-2xl border border-border glass overflow-hidden" dir="ltr">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-foreground/[0.025]">
        <div className="flex items-center gap-3">
          <Dots />
          <span className="text-[10px] font-mono tracking-[0.22em] text-muted-foreground">CONSOLE · LIVE</span>
        </div>
        <span className="text-[10px] font-mono text-primary flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> streaming
        </span>
      </div>
      <div className="px-4 py-3 font-mono text-[11.5px] leading-[1.85] min-h-[220px] max-h-[220px] overflow-hidden">
        {logs.map((l, i) => (
          <motion.div
            key={`${i}-${l.msg}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: i < logs.length - 6 ? 0.35 : 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <span className="text-muted-foreground/60">{new Date().toLocaleTimeString("en-US", { hour12: false })}</span>
            <span style={{ color: l.tagColor }} className="font-bold">[{l.tag.trim()}]</span>
            <span className="text-foreground/85">{l.msg}</span>
          </motion.div>
        ))}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-primary">›</span>
          <span className="inline-block w-[7px] h-[14px] align-middle bg-primary animate-blink shadow-[0_0_10px_var(--primary)]" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Metric stripe (bottom)
   ============================================================ */
function useAnimNumber(target: number, active: boolean, duration = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setV(target * ease);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return v;
}

function Spark({ active, seed = 1 }: { active: boolean; seed?: number }) {
  const bars = useMemo(
    () => Array.from({ length: 28 }, (_, i) => 30 + Math.abs(Math.sin(i * 0.7 + seed) * 60) + Math.random() * 12),
    [seed]
  );
  return (
    <div className="flex items-end gap-[3px] h-10">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          initial={{ height: 0 }}
          animate={active ? { height: `${h}%` } : { height: 0 }}
          transition={{ duration: 0.7, delay: i * 0.02, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 rounded-sm"
          style={{ background: "linear-gradient(180deg, var(--primary), transparent)" }}
        />
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix = "",
  delta,
  active,
  seed,
}: {
  label: string;
  value: number;
  suffix?: string;
  delta: string;
  active: boolean;
  seed: number;
}) {
  const n = useAnimNumber(value, active);
  return (
    <div className="rounded-2xl border border-border glass p-4">
      <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.22em] text-muted-foreground">
        <span>{label}</span>
        <span className="text-success">{delta}</span>
      </div>
      <div className="mt-1 font-display text-2xl font-black text-gradient-gold">
        {value >= 100 ? Math.round(n).toLocaleString() : n.toFixed(2)}
        <span className="text-base text-muted-foreground ms-1">{suffix}</span>
      </div>
      <Spark active={active} seed={seed} />
    </div>
  );
}

/* ============================================================
   Main section
   ============================================================ */
export function CodeShowcase() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12%" });
  const c = t.codeShowcase;

  return (
    <section id="os-console" className="relative py-28 overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full opacity-50"
          style={{ background: "radial-gradient(closest-side, oklch(0.82 0.18 84 / 0.18), transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute -top-10 left-10 w-[200px] h-[200px] rounded-3xl border border-primary/20 animate-spin-slow" style={{ transform: "rotate(20deg)" }} />
        <div className="absolute bottom-10 right-16 w-[140px] h-[140px] rounded-2xl border border-primary/15 animate-spin-slow" style={{ animationDirection: "reverse", transform: "rotate(-15deg)" }} />
      </div>

      <div ref={ref} className="mx-auto max-w-7xl px-6">
        {/* header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1.5 text-xs font-mono"
            dir="ltr"
          >
            <span className="text-primary">// {c.badge}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gradient-gold"
          >
            {c.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground leading-8"
          >
            {c.desc}
          </motion.p>
        </div>

        {/* IDE shell */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 8 }}
          animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl border border-border overflow-hidden glass shadow-[0_50px_140px_-40px_var(--glow)]"
          style={{ transformStyle: "preserve-3d", transformPerspective: 1800 }}
        >
          {/* window chrome */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-foreground/[0.025]">
            <div className="flex items-center gap-3">
              <Dots />
              <span className="text-[10px] font-mono tracking-[0.22em] text-muted-foreground hidden sm:inline">
                SETAYESH.OS — workspace
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="rounded-md border border-border px-2 py-0.5 text-muted-foreground hidden sm:inline">
                ⌘K · search
              </span>
              <span className="rounded-md border border-primary/30 text-primary px-2 py-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                LIVE
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.55fr_1fr]">
            {/* Editor */}
            <div className="border-b lg:border-b-0 lg:border-e border-border">
              <Editor active={inView} />
            </div>

            {/* Side console + metrics */}
            <div className="p-4 lg:p-5 space-y-4 bg-foreground/[0.015]">
              <LiveConsole active={inView} />

              <div className="grid sm:grid-cols-2 gap-3">
                <MetricCard label="REQ/S" value={42318} delta="+3.1%" active={inView} seed={1} />
                <MetricCard label="P95 (ms)" value={84} delta="-9%" active={inView} seed={2} />
                <MetricCard label="UPTIME" value={99.99} suffix="%" delta="30d" active={inView} seed={3} />
                <MetricCard label="REGIONS" value={14} delta="active" active={inView} seed={4} />
              </div>
            </div>
          </div>

          {/* bottom global status bar */}
          <div className="flex flex-wrap items-center justify-between gap-y-1 px-4 py-2 border-t border-border bg-foreground/[0.035] text-[10px] font-mono tracking-[0.18em] text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> main
              </span>
              <span>↑ 0  ↓ 0</span>
              <span className="hidden sm:inline">setayesh-os</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> ALL SYSTEMS NOMINAL
              </span>
              <span className="hidden md:inline">v15.0.241</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
