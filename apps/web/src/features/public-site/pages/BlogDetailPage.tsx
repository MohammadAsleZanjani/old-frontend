"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, ArrowUpRight, Twitter, Facebook, Linkedin, Send, Link as LinkIcon, Check, MessageCircle, Heart, Bookmark, Share2 } from "lucide-react";
import { Header } from "@/features/silver-platform/components";
import { Footer } from "@/features/public-site/sections/Footer";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { MediaBackdrop } from "@/features/public-site/components/MediaBackdrop";
import { getBlogPost, submitBlogComment } from "@/domains/blog/blog-api";
import { getPost, relatedPosts, formatDate, POSTS } from "@/domains/blog/data";
import { renderMarkdown } from "@/shared/lib/markdown";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { useI18n } from "@/shared/i18n";

const COPY = {
  fa: { back: "بازگشت به بلاگ", min: "دقیقه", toc: "فهرست مطالب", share: "اشتراک‌گذاری", copy: "کپی لینک", copied: "کپی شد!", related: "مقالات مرتبط", comments: "دیدگاه‌ها", leaveComment: "دیدگاه شما", name: "نام شما", email: "ایمیل (نمایش داده نمی‌شود)", message: "متن دیدگاه...", submit: "ارسال دیدگاه", noComments: "اولین نفری باشید که دیدگاه می‌گذارد.", reply: "پاسخ", likes: "پسند", save: "ذخیره", saved: "ذخیره شد" },
  en: { back: "Back to blog", min: "min read", toc: "Table of contents", share: "Share", copy: "Copy link", copied: "Copied!", related: "Related articles", comments: "Comments", leaveComment: "Leave a comment", name: "Your name", email: "Email (not displayed)", message: "Your thoughts...", submit: "Post comment", noComments: "Be the first to comment.", reply: "Reply", likes: "Likes", save: "Save", saved: "Saved" },
  ar: { back: "عودة للمدونة", min: "د قراءة", toc: "جدول المحتويات", share: "مشاركة", copy: "نسخ الرابط", copied: "تم النسخ!", related: "مقالات ذات صلة", comments: "التعليقات", leaveComment: "اترك تعليقًا", name: "اسمك", email: "البريد (غير معروض)", message: "رأيك...", submit: "نشر", noComments: "كن أول من يعلق.", reply: "رد", likes: "إعجاب", save: "حفظ", saved: "محفوظ" },
};

export function BlogDetailPage({ slug }: { slug: string }) {
  const { lang } = useI18n();
  const c = COPY[lang as keyof typeof COPY] ?? COPY.fa;
  const fallbackPost = useMemo(() => getPost(slug)!, [slug]);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryFn: () => getBlogPost(slug, lang),
    queryKey: ["public-blog-post", slug, lang],
    staleTime: 60_000,
  });
  const post = useMemo(
    () => data ?? { ...fallbackPost, comments: [], related: relatedPosts(slug, 3) },
    [data, fallbackPost, slug],
  );
  const { nodes, toc } = useMemo(() => renderMarkdown(post.content[lang]), [post, lang]);
  const related = post.related?.length ? post.related : relatedPosts(slug, 3);
  const comments = post.comments ?? [];
  const commentMutation = useMutation({
    mutationFn: submitBlogComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["public-blog-post", slug, lang] });
    },
  });

  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0);
      // active heading
      for (const t of toc) {
        const el = document.getElementById(t.id);
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.top < 160) setActiveId(t.id);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [toc]);

  const url = typeof window !== "undefined" ? window.location.href : `https://noghre.land/blog/${slug}`;
  const text = post.title[lang];

  const shareLinks = [
    { name: "Twitter", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { name: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { name: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: "Telegram", icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { name: "WhatsApp", icon: MessageCircle, href: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}` },
  ];

  const onCopy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    commentMutation.mutate({
      authorEmail: email.trim(),
      authorName: name.trim().slice(0, 60),
      body: body.trim().slice(0, 1000),
      slug,
    });
    setName(""); setEmail(""); setBody("");
  };

  return (
    <main className="relative min-h-screen text-foreground">
      <SiteBackground />
      <Header />

      {/* Reading progress */}
      <div className="fixed left-0 right-0 top-0 z-40 h-0.5 bg-foreground/5">
        <div className="h-full bg-gradient-gold transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      {/* Hero */}
      <section className="relative pt-32 pb-10">
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {c.back}
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary font-mono uppercase tracking-widest">{post.category}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(post.date, lang)}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{post.readMin} {c.min}</span>
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-black leading-[1.1]">{post.title[lang]}</h1>
            <p className="mt-4 text-lg text-muted-foreground leading-8">{post.excerpt[lang]}</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-gold text-primary-foreground font-bold">{post.author.avatar}</span>
              <div>
                <div className="text-sm font-semibold">{post.author.name[lang]}</div>
                <div className="text-xs text-muted-foreground">{post.author.role[lang]}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative aspect-[21/9] mx-auto max-w-6xl rounded-3xl border border-border overflow-hidden">
        <MediaBackdrop alt={post.title[lang]} value={post.cover} />
        <div className="absolute inset-0 dot-grid opacity-40" />
      </section>

      {/* Body + TOC */}
      <section className="relative py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 lg:grid-cols-[1fr_260px]">
          <article className="min-w-0">
            <div className="prose-content">{nodes}</div>

            {/* Tags */}
            <div className="mt-10 flex flex-wrap gap-2">
              {post.tags.map(t => (
                <span key={t} className="rounded-full border border-border bg-foreground/5 px-3 py-1 text-xs text-muted-foreground">#{t}</span>
              ))}
            </div>

            {/* Engagement bar */}
            <div className="mt-8 glass flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setLiked(v => !v)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${liked ? "border-primary/40 bg-primary/10 text-primary" : "border-border hover:bg-foreground/5"}`}>
                  <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {c.likes}
                </button>
                <button onClick={() => setSaved(v => !v)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border hover:bg-foreground/5"}`}>
                  <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} /> {saved ? c.saved : c.save}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="me-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><Share2 className="h-3.5 w-3.5" /> {c.share}</span>
                {shareLinks.map(s => (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition">
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
                <button onClick={onCopy} aria-label={c.copy} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition">
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <LinkIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Comments */}
            <div id="comments" className="mt-14">
              <h3 className="font-display text-2xl font-black inline-flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" /> {c.comments}
                <span className="text-sm text-muted-foreground font-normal">({comments.length})</span>
              </h3>

              <form onSubmit={submit} className="mt-5 glass rounded-2xl border border-border p-5 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={name} onChange={e => setName(e.target.value)} required maxLength={60} placeholder={c.name}
                    className="w-full rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" maxLength={120} placeholder={c.email}
                    className="w-full rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
                </div>
                <textarea value={body} onChange={e => setBody(e.target.value)} required maxLength={1000} rows={4} placeholder={c.message}
                  className="w-full rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50 resize-none" />
                <div className="flex justify-end">
                  <button type="submit" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gradient-gold px-5 text-sm font-semibold text-primary-foreground shadow-[0_0_30px_-8px_var(--glow)] hover:scale-[1.02] active:scale-95 transition">
                    {c.submit}
                  </button>
                </div>
              </form>

              <div className="mt-6 space-y-4">
                {comments.length === 0 && (
                  <div className="glass rounded-2xl border border-border border-dashed p-8 text-center text-sm text-muted-foreground">{c.noComments}</div>
                )}
                {comments.map(cm => (
                  <motion.div key={cm.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-border p-5">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-gold text-primary-foreground font-bold text-sm">
                        {cm.authorName.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-foreground">{cm.authorName}</span>
                          <span className="text-muted-foreground">· {formatPlatformDate(cm.createdAt, { dateStyle: "medium", timeStyle: "short" }, lang)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-foreground/90 whitespace-pre-wrap">{cm.body}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {cm.likes}</span>
                          <button className="hover:text-foreground transition">{c.reply}</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </article>

          {/* TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              {toc.length > 0 && (
                <div className="glass rounded-2xl border border-border p-5">
                  <div className="mb-3 text-xs font-mono text-muted-foreground">{c.toc}</div>
                  <ul className="space-y-1.5 text-sm">
                    {toc.map(t => (
                      <li key={t.id}>
                        <a href={`#${t.id}`} className={`block rounded-md px-2 py-1.5 transition ${activeId === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"}`}>
                          {t.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="glass rounded-2xl border border-border p-5">
                <div className="mb-3 text-xs font-mono text-muted-foreground">{c.share}</div>
                <div className="flex flex-wrap gap-2">
                  {shareLinks.map(s => (
                    <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition">
                      <s.icon className="h-4 w-4" />
                    </a>
                  ))}
                  <button onClick={onCopy} aria-label={c.copy} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition">
                    {copied ? <Check className="h-4 w-4 text-primary" /> : <LinkIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="relative pb-24">
          <div className="mx-auto max-w-6xl px-6">
            <h3 className="font-display text-3xl font-black">{c.related}</h3>
            <div className="mt-6 grid sm:grid-cols-3 gap-5">
              {related.map(p => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="group glass rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <MediaBackdrop alt={p.title[lang]} value={p.cover} />
                    <div className="absolute inset-0 dot-grid opacity-40" />
                  </div>
                  <div className="p-5">
                    <div className="text-[11px] text-muted-foreground">{formatDate(p.date, lang)} · {p.readMin} {c.min}</div>
                    <h4 className="mt-2 font-bold text-base leading-snug group-hover:text-primary transition line-clamp-2">{p.title[lang]}</h4>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary">{c.share === "اشتراک‌گذاری" ? "ادامه" : c.share === "مشاركة" ? "متابعة" : "Read"} <ArrowUpRight className="h-3.5 w-3.5" /></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}

// keep POSTS import used (silences unused warnings in some setups)
void POSTS;
