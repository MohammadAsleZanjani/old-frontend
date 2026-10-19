"use client";

import { useI18n } from "@/shared/i18n";
import c1 from "@/shared/assets/clients/client_1716832709.png.asset.json";
import c2 from "@/shared/assets/clients/client_1716832740.png.asset.json";
import c3 from "@/shared/assets/clients/client_1716832751.png.asset.json";
import c4 from "@/shared/assets/clients/client_1716832760.png.asset.json";
import c5 from "@/shared/assets/clients/client_1716832767.png.asset.json";

const CLIENTS = [c1, c2, c3, c4, c5];

export function Clients() {
  const { lang } = useI18n();
  const title =
    lang === "fa" ? "مجوزها و همکاران ما" : lang === "ar" ? "التراخيص والشركاء" : "Licenses & Partners";
  const sub =
    lang === "fa"
      ? "افتخار همکاری با برندها و سازمان‌های پیشرو."
      : lang === "ar"
        ? "نفخر بالتعاون مع علامات تجارية ومؤسسات رائدة."
        : "Trusted by leading brands and organizations.";

  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs font-mono text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            CLIENTS · TRUSTED
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-black text-gradient-gold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CLIENTS.map((c, i) => (
            <div
              key={i}
              className="group flex items-center justify-center rounded-2xl border border-border glass p-5 hover:border-primary/40 hover:bg-foreground/5 transition"
            >
              <img
                src={c.url}
                alt={`Client ${i + 1}`}
                loading="lazy"
                className="max-h-16 w-auto object-contain transition group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
