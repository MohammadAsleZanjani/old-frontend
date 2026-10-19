"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, Tag, Folder, Star, ShoppingCart, ArrowUpRight, Flame, X, Eye, Download, ChevronDown, Loader2, Minus, Plus,
} from "lucide-react";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { ProductImage } from "@/domains/catalog/ProductImage";
import {
  PRODUCTS, formatPrice, productCategoryLabel, type Product,
} from "@/domains/catalog/products-data";
import { getProducts } from "@/domains/catalog/products-api";
import { addCartItem, getCart, updateCartItem, type CartSummary } from "@/domains/commerce/commerce-api";
import { useAuth } from "@/shared/auth/AuthProvider";
import { platformAuth } from "@/shared/auth/platform-auth-client";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { toast } from "@/shared/ui/sonner";

const COPY = {
  fa: {
    eyebrow: "محصولات نقره", title1: "فروشگاه", title2: "نقره ممتاز",
    desc: "شمش، ساچمه و محصولات کلکسیونی نقره با وزن و عیار شفاف، بسته‌بندی پلمب و گواهی اصالت.",
    search: "جستجوی محصول…", categories: "دسته‌ها", tags: "برچسب‌ها", popular: "پرفروش‌ترین‌ها",
    all: "همه", clear: "پاک‌سازی", noResults: "محصولی یافت نشد.", sort: "مرتب‌سازی",
    sortBest: "پرفروش‌ترین", sortNew: "جدیدترین", sortPriceA: "ارزان‌ترین", sortPriceD: "گران‌ترین", sortRating: "بالاترین امتیاز",
    stock: "موجودی", stockUnit: "عدد", outOfStock: "ناموجود", reviews: "نظر", view: "مشاهده", addCart: "افزودن", featured: "محصول ویژه",
    items: "محصول", priceRange: "محدوده قیمت",
  },
  en: {
    eyebrow: "Silver Products", title1: "The", title2: "Premium Silver Shop",
    desc: "Silver bars, granules and collectible capsules with verified weight, purity, sealed packaging and authenticity certificates.",
    search: "Search products…", categories: "Categories", tags: "Tags", popular: "Best Sellers",
    all: "All", clear: "Clear", noResults: "No products found.", sort: "Sort",
    sortBest: "Best selling", sortNew: "Newest", sortPriceA: "Price: Low → High", sortPriceD: "Price: High → Low", sortRating: "Top rated",
    stock: "Stock", stockUnit: "items", outOfStock: "Out of stock", reviews: "reviews", view: "View", addCart: "Add", featured: "Featured product",
    items: "items", priceRange: "Price range",
  },
  ar: {
    eyebrow: "منتجات الفضة", title1: "متجر", title2: "الفضة الفاخرة",
    desc: "سبائك وحبيبات وكبسولات فضية بوزن ونقاوة موثقين وتغليف مختوم وشهادة أصالة.",
    search: "ابحث في المنتجات…", categories: "التصنيفات", tags: "الوسوم", popular: "الأكثر مبيعًا",
    all: "الكل", clear: "مسح", noResults: "لا توجد منتجات.", sort: "ترتيب",
    sortBest: "الأكثر مبيعًا", sortNew: "الأحدث", sortPriceA: "السعر: من الأقل", sortPriceD: "السعر: من الأعلى", sortRating: "الأعلى تقييمًا",
    stock: "المخزون", stockUnit: "قطعة", outOfStock: "غير متوفر", reviews: "تقييم", view: "عرض", addCart: "أضف", featured: "منتج مميز",
    items: "منتج", priceRange: "نطاق السعر",
  },
};

type Sort = "best" | "new" | "priceA" | "priceD" | "rating";

export function ProductsIndexPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const c = COPY[lang as keyof typeof COPY] ?? COPY.fa;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("best");
  const [sortOpen, setSortOpen] = useState(false);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [addedCounts, setAddedCounts] = useState<Record<string, number>>({});
  const [cartItemIds, setCartItemIds] = useState<Record<string, string>>({});
  const { data: products = PRODUCTS } = useQuery({
    queryFn: () => getProducts(lang),
    queryKey: ["public-products", lang],
    staleTime: 60_000,
  });
  const cart = useQuery({
    enabled: Boolean(user),
    queryFn: () => getCart(),
    queryKey: ["commerce-cart"],
    retry: 1,
  });
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const tags = useMemo(() => Array.from(new Set(products.flatMap((p) => p.tags))), [products]);
  const catalogMaxPrice = useMemo(
    () => Math.max(1, ...products.map((product) => product.salePrice ?? product.price)),
    [products],
  );

  // Pre-select category from URL hash (e.g. #cat=FinTech) — set by Nav dropdown
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = () => {
      const m = window.location.hash.match(/cat=([^&]+)/);
      if (m) {
        const value = decodeURIComponent(m[1]);
        if (categories.includes(value as never)) setCat(value);
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [categories]);

  useEffect(() => {
    if (!cart.data) return;
    setAddedCounts(Object.fromEntries(cart.data.items.map((item) => [item.product.slug, item.quantity])));
    setCartItemIds(Object.fromEntries(cart.data.items.map((item) => [item.product.slug, item.id])));
  }, [cart.data]);


  const filtered = useMemo(() => {
    let arr = products.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (tag && !p.tags.includes(tag)) return false;
      if (maxPrice !== null && (p.salePrice ?? p.price) > maxPrice) return false;
      if (q) {
        const hay = (p.title[lang] + " " + p.short[lang] + " " + p.tags.join(" ")).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    arr.sort((a, b) => {
      switch (sort) {
        case "new": return +new Date(b.lastUpdate) - +new Date(a.lastUpdate);
        case "priceA": return (a.salePrice ?? a.price) - (b.salePrice ?? b.price);
        case "priceD": return (b.salePrice ?? b.price) - (a.salePrice ?? a.price);
        case "rating": return b.rating - a.rating;
        default: return b.sales - a.sales;
      }
    });
    return arr;
  }, [q, cat, tag, maxPrice, sort, lang, products]);

  const featured = [...products].sort((a, b) => b.sales - a.sales)[0];
  const sortLabel: Record<Sort, string> = {
    best: c.sortBest, new: c.sortNew, priceA: c.sortPriceA, priceD: c.sortPriceD, rating: c.sortRating,
  };

  async function ensureSignedIn(slug: string) {
    if (platformAuth.getAccessToken() || user) return true;
    toast.info(t("Please sign in to continue."));
    router.push(`/auth?redirect=${encodeURIComponent(`/products/${slug}`)}`);
    return false;
  }

  async function addToCart(product: Product) {
    if (!product.id) {
      toast.error(t("This product cannot be added right now."));
      return;
    }
    if (productStockLimit(product) <= 0) {
      toast.error(t("This product is out of stock."));
      return;
    }
    if (!(await ensureSignedIn(product.slug))) return;
    setBusySlug(product.slug);
    try {
      const cart = await addCartItem({ productId: product.id, productSlug: product.slug, quantity: 1 });
      toast.success(t("Added to cart."));
      syncProductCartState(product, cart);
      void queryClient.invalidateQueries({ queryKey: ["commerce-cart"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not add the product to your cart."));
    } finally {
      setBusySlug(null);
    }
  }

  async function updateProductQuantity(product: Product, quantity: number) {
    if (!product.id) {
      toast.error(t("This product cannot be updated right now."));
      return;
    }
    if (!(await ensureSignedIn(product.slug))) return;
    const itemId = cartItemIds[product.slug];
    setBusySlug(product.slug);
    try {
      const cart = itemId
        ? await updateCartItem(itemId, quantity)
        : await addCartItem({ productId: product.id, productSlug: product.slug, quantity: Math.max(quantity, 1) });
      syncProductCartState(product, cart);
      void queryClient.invalidateQueries({ queryKey: ["commerce-cart"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not update the product quantity."));
    } finally {
      setBusySlug(null);
    }
  }

  function syncProductCartState(product: Product, cart: CartSummary) {
    const item = cart.items.find((cartItem) => cartItem.product.slug === product.slug || cartItem.productId === product.id);
    setAddedCounts((current) => {
      const next = { ...current };
      if (item?.quantity) next[product.slug] = item.quantity;
      else delete next[product.slug];
      return next;
    });
    setCartItemIds((current) => {
      const next = { ...current };
      if (item?.id) next[product.slug] = item.id;
      else delete next[product.slug];
      return next;
    });
  }

  return (
    <main className="relative min-h-screen text-foreground">
      <SiteBackground />

      {/* Header */}
      <section className="relative pt-36 pb-12">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> {c.eyebrow}
            </div>
            <h1 className="mt-4 font-display text-5xl sm:text-6xl font-black tracking-tight">
              {c.title1} <span className="text-gradient-gold">{c.title2}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-8">{c.desc}</p>
          </motion.div>

          {/* Featured product */}
          {featured && (
            <FeaturedHero p={featured} addedCount={addedCounts[featured.slug] ?? 0} label={c.featured} reviewsLabel={c.reviews} stockLabel={c.stock} stockUnit={c.stockUnit} outOfStockLabel={c.outOfStock} viewLabel={c.view} onAddToCart={addToCart} busySlug={busySlug} />
          )}
        </div>
      </section>

      {/* Body */}
      <section className="relative pb-28">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-28 self-start">
            <div className="glass rounded-2xl border border-border p-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={c.search}
                  className="w-full rounded-xl bg-background/40 border border-border ps-9 pe-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <SidebarSection icon={<Folder className="h-4 w-4" />} title={c.categories}>
              <button
                onClick={() => setCat(null)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${!cat ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-foreground/5"}`}
              >
                <span>{c.all}</span>
                <span className="font-mono opacity-70">{products.length}</span>
              </button>
              {categories.map((k) => {
                const n = products.filter((p) => p.category === k).length;
                const active = cat === k;
                return (
                  <button
                    key={k}
                    onClick={() => setCat(active ? null : k)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-foreground/5"}`}
                  >
                    <span>{productCategoryLabel(products.find((product) => product.category === k) ?? { category: k }, "fa")}</span>
                    <span className="font-mono opacity-70">{n}</span>
                  </button>
                );
              })}
            </SidebarSection>

            <SidebarSection icon={<span className="text-xs font-mono">$</span>} title={c.priceRange}>
              <div className="px-1 py-2">
                <input
                  type="range" min={0} max={catalogMaxPrice} step={Math.max(1, Math.round(catalogMaxPrice / 100))}
                  value={maxPrice ?? catalogMaxPrice}
                  onChange={(e) => setMaxPrice(+e.target.value)}
                  className="w-full accent-primary"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>۰</span>
                  <span className="text-primary">≤ {(maxPrice ?? catalogMaxPrice).toLocaleString("fa-IR")}</span>
                  <span>{catalogMaxPrice.toLocaleString("fa-IR")}</span>
                </div>
              </div>
            </SidebarSection>

            <SidebarSection icon={<Tag className="h-4 w-4" />} title={c.tags}>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tg) => {
                  const active = tag === tg;
                  return (
                    <button
                      key={tg}
                      onClick={() => setTag(active ? null : tg)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] transition ${active ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}
                    >
                      #{tg}
                    </button>
                  );
                })}
              </div>
            </SidebarSection>

            <SidebarSection icon={<Flame className="h-4 w-4 text-primary" />} title={c.popular}>
              <ul className="space-y-2">
                {[...products].sort((a, b) => b.sales - a.sales).slice(0, 4).map((p) => (
                  <li key={p.slug}>
                    <Link href={`/products/${p.slug}`} className="group flex items-start gap-3 rounded-lg p-2 hover:bg-foreground/5 transition">
                      <span className="relative h-10 w-10 overflow-hidden rounded-md border border-border shrink-0">
                        <ProductImage alt={p.title[lang]} src={p.cover} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate group-hover:text-primary transition">{p.title[lang]}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground font-mono">
                          ★ {p.rating.toFixed(2)} · {formatProductStock(p, lang, c.stock, c.stockUnit, c.outOfStock)}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </SidebarSection>

            {(cat || tag || q || maxPrice !== null) && (
              <button
                onClick={() => { setCat(null); setTag(null); setQ(""); setMaxPrice(null); }}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> {c.clear}
              </button>
            )}
          </aside>

          {/* Main grid */}
          <div>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-bold">{filtered.length}</span> {c.items}
              </div>
              <div className="relative">
                <button
                  onClick={() => setSortOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-xs hover:bg-foreground/5"
                >
                  {c.sort}: <span className="text-primary font-mono">{sortLabel[sort]}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {sortOpen && (
                  <div onMouseLeave={() => setSortOpen(false)} className="absolute end-0 mt-2 w-56 glass rounded-lg border border-border p-1 z-20">
                    {(Object.keys(sortLabel) as Sort[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setSort(s); setSortOpen(false); }}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs hover:bg-foreground/5 ${s === sort ? "text-primary" : "text-foreground"}`}
                      >
                        {sortLabel[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-border glass p-16 text-center text-muted-foreground">{c.noResults}</div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((p, i) => (
                  <ProductCard key={p.slug} addedCount={addedCounts[p.slug] ?? 0} p={p} i={i} stockLabel={c.stock} stockUnit={c.stockUnit} outOfStockLabel={c.outOfStock} onAddToCart={addToCart} onQuantityChange={updateProductQuantity} busySlug={busySlug} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

    </main>
  );
}

function SidebarSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span>
        <span className="font-mono">{title}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ProductCard({
  addedCount,
  busySlug,
  i,
  onAddToCart,
  onQuantityChange,
  p,
  outOfStockLabel,
  stockLabel,
  stockUnit,
}: {
  addedCount: number;
  busySlug: string | null;
  i: number;
  onAddToCart: (product: Product) => Promise<void>;
  onQuantityChange: (product: Product, quantity: number) => Promise<void>;
  p: Product;
  outOfStockLabel: string;
  stockLabel: string;
  stockUnit: string;
}) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const hasSale = p.salePrice && p.salePrice < p.price;
  const previewImage = productPreviewImage(p);
  const stockLimit = productStockLimit(p);
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border border-border glass hover:border-primary/40 transition"
    >
      <Link href={`/products/${p.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <ProductImage alt={p.title[lang]} imageClassName="p-3 transition duration-700 group-hover:scale-[1.04]" src={previewImage} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent" />
          {p.silver?.weightGrams ? <span className="absolute top-3 end-3 rounded-full border border-white/30 bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">{p.silver.weightGrams.toLocaleString(lang)} گرم · عیار {p.silver.purity ?? 999}</span> : null}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5">{productCategoryLabel(p, "fa")}</span>
            {p.framework[0] ? <><span>·</span><span>{p.framework[0]}</span></> : null}
          </div>
          <h3 className="mt-2 font-bold text-base leading-snug group-hover:text-primary transition line-clamp-2">{p.title[lang]}</h3>
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{p.short[lang]}</p>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex min-w-0 items-center gap-2 text-[10px] text-muted-foreground font-mono">
              <span className="inline-flex items-center gap-1 text-primary">
                <Star className="h-3 w-3 fill-primary" /> {p.rating.toFixed(2)}
              </span>
              <span>{formatProductStock(p, lang, stockLabel, stockUnit, outOfStockLabel)}</span>
            </div>
            <div className="text-end">
              {hasSale && <div className="text-[10px] text-muted-foreground line-through">${p.price}</div>}
              <div className="font-display text-lg font-black text-gradient-gold leading-none">{formatPrice(p)}</div>
            </div>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-[1fr_2.5rem] gap-2">
          {addedCount > 0 ? (
            <div className="grid h-9 grid-cols-[2.25rem_1fr_2.25rem] overflow-hidden rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <button
                disabled={busySlug === p.slug}
                onClick={() => void onQuantityChange(p, Math.max(addedCount - 1, 0))}
                className="grid place-items-center border-e border-primary/20 transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                aria-label={t("Cart quantity")}
                className="h-full w-full bg-transparent text-center text-xs font-black text-primary outline-none"
                readOnly
                type="number"
                value={addedCount}
              />
              <button
                disabled={busySlug === p.slug || addedCount >= stockLimit}
                onClick={() => void onQuantityChange(p, Math.min(addedCount + 1, stockLimit))}
                className="grid place-items-center border-s border-primary/20 transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
              >
                {busySlug === p.slug ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>
          ) : (
            <button
              disabled={busySlug === p.slug || !p.id || stockLimit <= 0}
              onClick={() => void onAddToCart(p)}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background/40 px-3 text-xs font-semibold hover:bg-foreground/5 transition disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
            >
              {busySlug === p.slug ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
              {p.id ? t("Add to cart") : t("Not available")}
            </button>
          )}
          <Link aria-label={t("View product")} href={`/products/${p.slug}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-card text-sm text-foreground shadow-sm transition hover:border-primary/40 hover:bg-accent hover:text-primary">
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function FeaturedHero({ addedCount, p, label, reviewsLabel, stockLabel, stockUnit, outOfStockLabel, viewLabel, onAddToCart, busySlug }: { addedCount: number; p: Product; label: string; reviewsLabel: string; stockLabel: string; stockUnit: string; outOfStockLabel: string; viewLabel: string; onAddToCart: (product: Product) => Promise<void>; busySlug: string | null }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const previewImage = productPreviewImage(p);
  const stockLimit = productStockLimit(p);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="mt-10 relative overflow-hidden rounded-3xl border border-border glass"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background/5 to-secondary/10 opacity-90" />
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="relative grid md:grid-cols-2 gap-6 p-8 md:p-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/40 backdrop-blur px-3 py-1 text-[11px] text-primary font-mono uppercase">
            <Flame className="h-3 w-3" /> {label}
          </span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl font-black leading-tight">{p.title[lang]}</h2>
          <p className="mt-3 text-foreground/80 max-w-lg leading-7">{p.short[lang]}</p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-foreground/70 font-mono">
            <span className="inline-flex items-center gap-1 text-primary"><Star className="h-3 w-3 fill-primary" /> {p.rating.toFixed(2)} ({p.reviews} {reviewsLabel})</span>
            <span>· {formatProductStock(p, lang, stockLabel, stockUnit, outOfStockLabel)}</span>
            <span>· v{p.version}</span>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <Link href={`/products/${p.slug}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-gold px-6 text-sm font-semibold text-primary-foreground shadow-[0_0_30px_-8px_var(--glow)] hover:scale-[1.03] transition"
            >
              {viewLabel} <ArrowUpRight className="h-4 w-4" />
            </Link>
            {addedCount > 0 ? <span className="grid h-11 min-w-12 place-items-center rounded-xl border border-primary/30 bg-primary/10 px-2 text-sm font-black text-primary">+{addedCount}</span> : null}
            <button
              disabled={busySlug === p.slug || !p.id || addedCount >= stockLimit}
              onClick={() => void onAddToCart(p)}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-background/40 px-4 text-xs font-semibold hover:bg-foreground/5 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busySlug === p.slug ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />} {t("Add to cart")}
            </button>
            <div className="font-display text-2xl font-black text-gradient-gold">{formatPrice(p)}</div>
          </div>
        </div>
        <div className="relative hidden min-h-80 overflow-hidden rounded-3xl border border-white/15 bg-white md:block">
          <ProductImage alt={p.title[lang]} imageClassName="p-4 transition duration-700 group-hover:scale-[1.03]" src={previewImage} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/25 to-transparent" />
          {p.silver?.weightGrams ? <span className="absolute bottom-4 start-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{p.silver.weightGrams.toLocaleString(lang)} گرم نقره · عیار {p.silver.purity ?? 999}</span> : null}
        </div>
      </div>
    </motion.div>
  );
}

function productPreviewImage(product: Product) {
  return product.gallery[0] || product.cover || undefined;
}

function productStockLimit(product: Product) {
  return Math.max(0, Math.trunc(Number(product.silver?.stockQuantity ?? 0)));
}

function formatProductStock(product: Product, lang: string, stockLabel: string, stockUnit: string, outOfStockLabel: string) {
  const quantity = productStockLimit(product);
  return quantity > 0 ? `${stockLabel}: ${quantity.toLocaleString(lang)} ${stockUnit}` : outOfStockLabel;
}
