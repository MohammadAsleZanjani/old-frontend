"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Tag, Folder, Calendar, Clock, ArrowUpRight, Flame, X } from "lucide-react";
import { Header } from "@/features/silver-platform/components";
import { Footer } from "@/features/public-site/sections/Footer";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { MediaBackdrop } from "@/features/public-site/components/MediaBackdrop";
import { getBlogPosts } from "@/domains/blog/blog-api";
import { POSTS, formatDate } from "@/domains/blog/data";
import { useI18n } from "@/shared/i18n";

const COPY = {
  fa: { title1: "بلاگ", title2: "ستایش", desc: "تجربه‌ها، تحلیل‌ها و راهنمای ساخت محصولات کلاس جهانی.", search: "جستجوی مقاله...", categories: "دسته‌بندی‌ها", tags: "برچسب‌ها", popular: "مقالات داغ", all: "همه", clear: "پاک‌سازی", noResults: "نتیجه‌ای یافت نشد.", min: "دقیقه", read: "مطالعه", featured: "ویژه" },
  en: { title1: "The", title2: "Setayesh Blog", desc: "Experiences, deep-dives and playbooks for shipping world-class products.", search: "Search articles...", categories: "Categories", tags: "Tags", popular: "Trending", all: "All", clear: "Clear", noResults: "No results.", min: "min", read: "read", featured: "Featured" },
  ar: { title1: "مدونة", title2: "ستايش", desc: "تجارب وتحليلات وأدلة لبناء منتجات عالمية.", search: "ابحث في المقالات...", categories: "التصنيفات", tags: "الوسوم", popular: "الأكثر رواجًا", all: "الكل", clear: "مسح", noResults: "لا توجد نتائج.", min: "د", read: "قراءة", featured: "مميز" },
};

export function BlogIndexPage() {
  const { lang } = useI18n();
  const c = COPY[lang as keyof typeof COPY] ?? COPY.fa;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const { data: posts = POSTS } = useQuery({
    queryFn: () => getBlogPosts(lang),
    queryKey: ["public-blog-posts", lang],
    staleTime: 60_000,
  });
  const categories = useMemo(() => Array.from(new Set(posts.map((p) => p.category))), [posts]);
  const allTags = useMemo(() => Array.from(new Set(posts.flatMap((p) => p.tags))), [posts]);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (cat && p.category !== cat) return false;
      if (tag && !p.tags.includes(tag)) return false;
      if (q) {
        const hay = (p.title[lang] + " " + p.excerpt[lang] + " " + p.tags.join(" ")).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [q, cat, tag, lang, posts]);

  const featured = filtered[0];
  const rest = filtered.slice(1);
  const popular = [...posts].sort((a, b) => b.readMin - a.readMin).slice(0, 4);

  return (
    <main className="relative min-h-screen text-foreground">
      <SiteBackground />
      <Header />

      {/* Header */}
      <section className="relative pt-36 pb-12">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> {c.title1}
            </div>
            <h1 className="mt-4 font-display text-5xl sm:text-6xl font-black leading-[1.05]">
              {c.title1} <span className="text-gradient-gold">{c.title2}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-8">{c.desc}</p>
          </motion.div>
        </div>
      </section>

      <section className="relative pb-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 lg:grid-cols-[1fr_320px]">
          {/* Main */}
          <div>
            {/* Search bar */}
            <div className="glass flex items-center gap-2 rounded-2xl border border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={c.search}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {(q || cat || tag) && (
                <button onClick={() => { setQ(""); setCat(null); setTag(null); }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" /> {c.clear}
                </button>
              )}
            </div>

            {/* Active filters */}
            {(cat || tag) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {cat && <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary">{cat}<button onClick={() => setCat(null)}>×</button></span>}
                {tag && <span className="inline-flex items-center gap-1 rounded-full border border-border bg-foreground/5 px-3 py-1">{tag}<button onClick={() => setTag(null)}>×</button></span>}
              </div>
            )}

            {/* Featured */}
            {featured && (
              <motion.article
                key={featured.slug}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="group relative mt-8 overflow-hidden rounded-3xl border border-border glass"
              >
                <Link href={`/blog/${featured.slug}`} className="grid md:grid-cols-2">
                  <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto">
                    <MediaBackdrop alt={featured.title[lang]} value={featured.cover} />
                    <div className="absolute inset-0 dot-grid opacity-40" />
                    <div className="absolute top-4 start-4 inline-flex items-center gap-1 rounded-full bg-background/60 px-3 py-1 text-[10px] uppercase tracking-widest font-mono text-primary backdrop-blur">
                      <Flame className="h-3 w-3" /> {c.featured}
                    </div>
                  </div>
                  <div className="p-7 md:p-10">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Folder className="h-3.5 w-3.5" />{featured.category}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(featured.date, lang)}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{featured.readMin} {c.min}</span>
                    </div>
                    <h2 className="mt-3 font-display text-2xl sm:text-3xl font-black leading-tight group-hover:text-primary transition">
                      {featured.title[lang]}
                    </h2>
                    <p className="mt-3 text-muted-foreground leading-8 line-clamp-3">{featured.excerpt[lang]}</p>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm text-primary">{c.read} <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 transition" /></div>
                  </div>
                </Link>
              </motion.article>
            )}

            {/* Grid */}
            <div className="mt-8 grid sm:grid-cols-2 gap-5">
              {rest.map((p, i) => (
                <motion.article
                  key={p.slug}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="group glass rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition"
                >
                  <Link href={`/blog/${p.slug}`}>
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <MediaBackdrop alt={p.title[lang]} value={p.cover} />
                      <div className="absolute inset-0 dot-grid opacity-40" />
                      <div className="absolute bottom-3 end-3 text-[10px] uppercase tracking-widest font-mono text-primary bg-background/50 backdrop-blur px-2 py-1 rounded">{p.category}</div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(p.date, lang)}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{p.readMin} {c.min}</span>
                      </div>
                      <h3 className="mt-2 font-bold text-lg leading-snug group-hover:text-primary transition line-clamp-2">{p.title[lang]}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-7 line-clamp-2">{p.excerpt[lang]}</p>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="mt-12 glass rounded-2xl border border-border p-12 text-center text-muted-foreground">{c.noResults}</div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="glass rounded-2xl border border-border p-5">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-mono text-muted-foreground"><Folder className="h-3.5 w-3.5 text-primary" /> {c.categories}</div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setCat(null)} className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition ${!cat ? "bg-primary/10 text-primary" : "hover:bg-foreground/5 text-foreground/80"}`}>
                  <span>{c.all}</span>
                  <span className="text-xs text-muted-foreground">{posts.length}</span>
                </button>
                {categories.map(k => {
                  const n = posts.filter(p => p.category === k).length;
                  return (
                    <button key={k} onClick={() => setCat(k === cat ? null : k)} className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition ${cat === k ? "bg-primary/10 text-primary" : "hover:bg-foreground/5 text-foreground/80"}`}>
                      <span>{k}</span>
                      <span className="text-xs text-muted-foreground">{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass rounded-2xl border border-border p-5">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-mono text-muted-foreground"><Tag className="h-3.5 w-3.5 text-primary" /> {c.tags}</div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(t => (
                  <button key={t} onClick={() => setTag(t === tag ? null : t)} className={`rounded-full border px-3 py-1 text-xs transition ${tag === t ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}>
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl border border-border p-5">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-mono text-muted-foreground"><Flame className="h-3.5 w-3.5 text-primary" /> {c.popular}</div>
              <ul className="space-y-3">
                {popular.map((p, i) => (
                  <li key={p.slug}>
                    <Link href={`/blog/${p.slug}`} className="group flex gap-3">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-gradient-gold/20 font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                      <span>
                        <span className="block text-sm leading-snug text-foreground/90 group-hover:text-primary transition line-clamp-2">{p.title[lang]}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">{p.readMin} {c.min}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
