"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/shared/i18n";
import { POSTS, formatDate } from "@/domains/blog/data";
import { getBlogPosts } from "@/domains/blog/blog-api";
import { MediaBackdrop } from "@/features/public-site/components/MediaBackdrop";

export function Blog() {
  const { t, lang } = useI18n();
  const { data: allPosts = POSTS } = useQuery({
    queryFn: () => getBlogPosts(lang),
    queryKey: ["landing-blog-posts", lang],
    staleTime: 60_000,
  });
  const posts = allPosts.slice(0, 3);
  return (
    <section id="blog" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t.blog.badge}
            </div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-black">
              {t.blog.title1} <span className="text-gradient-gold">{t.blog.title2}</span>
            </h2>
          </motion.div>
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">{t.blog.all}</Link>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {posts.map((p, i) => (
            <motion.article
              key={p.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group glass rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition"
            >
              <Link href={`/blog/${p.slug}`}>
                <div className="aspect-[16/10] relative overflow-hidden">
                  <MediaBackdrop alt={p.title[lang]} value={p.cover} />
                  <div className="absolute inset-0 dot-grid opacity-40" />
                  <div className="absolute bottom-3 end-3 text-[10px] uppercase tracking-widest font-mono text-primary/80 bg-background/40 px-2 py-1 rounded">{p.category}</div>
                </div>
                <div className="p-5">
                  <div className="text-xs text-muted-foreground">{formatDate(p.date, lang)}</div>
                  <h3 className="mt-2 font-bold text-lg leading-tight group-hover:text-primary transition line-clamp-2">{p.title[lang]}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-7 line-clamp-2">{p.excerpt[lang]}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs text-primary">{t.blog.more} <span>→</span></div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
