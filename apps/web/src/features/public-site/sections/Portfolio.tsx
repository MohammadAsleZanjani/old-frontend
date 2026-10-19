"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/shared/i18n";
import { PRODUCTS, type Product } from "@/domains/catalog/products-data";
import { getProducts } from "@/domains/catalog/products-api";
import { MediaBackdrop } from "@/features/public-site/components/MediaBackdrop";

const colors = [
  "from-yellow-500/40 to-amber-700/20",
  "from-amber-400/40 to-orange-700/20",
  "from-rose-400/30 to-fuchsia-700/20",
  "from-sky-400/30 to-indigo-700/20",
  "from-emerald-400/30 to-teal-700/20",
  "from-violet-400/30 to-purple-700/20",
];

export function Portfolio() {
  const { t, lang } = useI18n();
  const { data: products = PRODUCTS } = useQuery({
    queryFn: () => getProducts(lang),
    queryKey: ["landing-products", lang],
    staleTime: 60_000,
  });
  return (
    <section id="portfolio" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t.portfolio.badge}
            </div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-black">
              {t.portfolio.title1} <span className="text-gradient-gold">{t.portfolio.title2}</span>
            </h2>
          </motion.div>
          <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground">{t.portfolio.all}</a>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.portfolio.items.map(([title, tag], i) => {
            const product = products[i];
            const previewImage = product ? productPreviewImage(product) : undefined;
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: (i % 3) * 0.08 }}
                className="group relative overflow-hidden rounded-3xl glass cursor-pointer p-5"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${colors[i]} opacity-90`} />
                <div className="absolute inset-0 dot-grid opacity-40" />
                <div className="relative rounded-2xl border border-border bg-background/40 backdrop-blur-md p-3 transition-transform duration-700 group-hover:-translate-y-2 group-hover:rotate-[-1deg]" dir="ltr">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="h-2 w-2 rounded-full bg-destructive/70" />
                    <span className="h-2 w-2 rounded-full bg-accent/70" />
                    <span className="h-2 w-2 rounded-full bg-success/70" />
                  </div>
                  {previewImage ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border bg-background/30">
                      <MediaBackdrop alt={product.title[lang]} className="p-2 transition duration-700 group-hover:scale-[1.04]" fit="contain" value={previewImage} />
                    </div>
                  ) : (
                    <>
                      <div className="h-3 w-2/3 rounded-full bg-foreground/20 mb-2" />
                      <div className="h-3 w-1/2 rounded-full bg-foreground/10 mb-4" />
                      <div className="grid aspect-[16/9] w-full grid-cols-4 gap-1.5">
                        {Array.from({ length: 9 }).map((_, k) => (
                          <div key={k} className="rounded-md bg-foreground/5 border border-border" />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="relative mt-5">
                  <div className="text-[11px] uppercase tracking-wider text-primary/90 font-mono">{tag}</div>
                  <h3 className="mt-1 font-bold text-lg">{title}</h3>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function productPreviewImage(product: Product) {
  return [product.gallery[0], product.cover].find((value) => value?.startsWith("/assets/legacy/setayeshco/"));
}
