"use client";

import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/shared/i18n";

function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const [val, setVal] = useState(0);
  const { lang } = useI18n();
  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(mv, to, { duration: 2, ease: [0.22, 1, 0.36, 1], onUpdate: v => setVal(Math.round(v)) });
    return () => ctrl.stop();
  }, [inView, to, mv]);
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar-EG" : "fa-IR";
  return <span ref={ref}>{val.toLocaleString(locale)}+</span>;
}

export function Stats() {
  const { t } = useI18n();
  const items = [
    { v: 6420, l: t.stats.projects },
    { v: 9280, l: t.stats.clients },
    { v: 15, l: t.stats.years },
    { v: 48, l: t.stats.experts },
  ];
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <motion.div
              key={it.l}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="glass glow-ring rounded-2xl p-6 text-center relative overflow-hidden"
            >
              <div className="absolute -inset-px rounded-2xl pointer-events-none" style={{ background: "linear-gradient(180deg, oklch(0.82 0.16 84 / 0.15), transparent 40%)" }} />
              <div className="relative font-display text-4xl md:text-5xl font-black text-gradient-gold">
                <Counter to={it.v} />
              </div>
              <div className="relative mt-2 text-sm text-muted-foreground">{it.l}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
