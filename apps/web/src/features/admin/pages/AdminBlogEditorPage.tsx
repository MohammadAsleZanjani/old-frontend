"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, Save } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { BlogTiptapEditor } from "@/domains/blog/components/BlogTiptapEditor";
import { getAdminBlogPost, upsertAdminBlogPost, type AdminBlogPostDetail, type BlogContentStatus } from "@/features/admin/api/admin-blog-api";
import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { languageLabel, useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Textarea } from "@/shared/ui/textarea";

type BlogForm = {
  canonicalUrl: string;
  categorySlug: string;
  commentsEnabled: boolean;
  excerpt: string;
  featured: boolean;
  featuredImageUrl: string;
  keywords: string;
  languageCode: string;
  ogImage: string;
  publishedAt: string;
  readMinutes: string;
  scheduledAt: string;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  sortOrder: string;
  status: BlogContentStatus;
  tagSlugs: string;
  title: string;
};

const emptyContent = { content: [{ type: "paragraph" }], type: "doc" };
const defaultForm: BlogForm = {
  canonicalUrl: "",
  categorySlug: "",
  commentsEnabled: true,
  excerpt: "",
  featured: false,
  featuredImageUrl: "",
  keywords: "",
  languageCode: "fa",
  ogImage: "",
  publishedAt: "",
  readMinutes: "",
  scheduledAt: "",
  seoDescription: "",
  seoTitle: "",
  slug: "",
  sortOrder: "0",
  status: "DRAFT",
  tagSlugs: "",
  title: "",
};

export function AdminBlogEditorPage({ mode, postId }: { mode: "create" | "edit" | "view"; postId?: string }) {
  const { dir, lang, languages } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const router = useRouter();
  const [form, setForm] = useState<BlogForm>(defaultForm);
  const [content, setContent] = useState<Record<string, unknown>>(emptyContent);
  const [contentMarkdown, setContentMarkdown] = useState("");
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const canView = !!access && (access.isSuperAdmin || access.permissions.includes("blog.view"));
  const canSave = !!access && (access.isSuperAdmin || access.permissions.includes("blog.create"));
  const readOnly = mode === "view" || !canSave;
  const post = useQuery({
    enabled: mode !== "create" && !!postId && canView,
    queryFn: () => getAdminBlogPost(postId ?? ""),
    queryKey: ["admin-blog-post", postId],
    retry: 1,
  });

  useEffect(() => {
    if (!post.data) return;
    setForm(postToForm(post.data));
    setContent(isRecord(post.data.content) ? post.data.content : emptyContent);
    setContentMarkdown(readString(post.data.contentMarkdown) ?? "");
  }, [post.data]);

  const editorKey = useMemo(() => `${postId ?? "create"}-${post.data?.updatedAt ?? "new"}`, [post.data?.updatedAt, postId]);
  const save = useMutation({
    mutationFn: () => {
      if (!form.title.trim() || !form.slug.trim() || !form.excerpt.trim()) {
        throw new Error(t("Title, slug, and excerpt are required."));
      }
      const body = contentMarkdown.trim() || form.excerpt.trim();
      return upsertAdminBlogPost({
        categorySlug: form.categorySlug.trim() || undefined,
        commentsEnabled: form.commentsEnabled,
        content,
        contentMarkdown: body,
        excerpt: form.excerpt.trim(),
        featured: form.featured,
        featuredImageUrl: form.featuredImageUrl.trim() || undefined,
        languageCode: form.languageCode,
        publishedAt: form.publishedAt || undefined,
        readMinutes: numberOrUndefined(form.readMinutes),
        scheduledAt: form.scheduledAt || undefined,
        seo: {
          canonicalUrl: form.canonicalUrl.trim() || undefined,
          description: form.seoDescription.trim() || undefined,
          keywords: parseCsv(form.keywords),
          ogImage: form.ogImage.trim() || undefined,
          title: form.seoTitle.trim() || undefined,
        },
        slug: form.slug.trim(),
        sortOrder: numberOrUndefined(form.sortOrder) ?? 0,
        status: form.status,
        tagSlugs: parseCsv(form.tagSlugs),
        title: form.title.trim(),
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Blog post could not be saved")),
    onSuccess: (saved) => {
      toast.success(t("Blog post saved."));
      router.replace(`/admin/content/blog/${saved.id}/edit`);
    },
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <EditorSkeleton />
      </AdminShell>
    );
  }

  if (overview.isError) {
    return (
      <AdminShell>
        <Alert variant="destructive">
          <AlertTitle>{t("Admin page unavailable")}</AlertTitle>
          <AlertDescription>{overview.error.message}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  if (!canView && mode !== "create") {
    return <PermissionNotice access={access} message={t("Your account cannot use this section. Ask a senior administrator to review your role.")} />;
  }

  if (!canSave && mode === "create") {
    return <PermissionNotice access={access} message={t("Your account cannot use this section. Ask a senior administrator to review your role.")} />;
  }

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("Content / Blog")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{mode === "create" ? t("Create blog post") : form.title || t("Blog post editor")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Write and publish educational articles, organize categories, review comments, and improve how each article appears in search results.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={"/admin/content/blog" as never}>
                <ArrowRight className="size-4" />
                {t("Back to posts")}
              </Link>
            </Button>
            <Button disabled={readOnly || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {t("Save post")}
            </Button>
          </div>
        </section>

        {post.isLoading ? <EditorSkeleton /> : null}
        {post.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("Blog post unavailable")}</AlertTitle>
            <AlertDescription>{post.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle>{t("Article")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("Title")} name="title" readOnly={readOnly} setForm={setForm} value={form.title} />
                <Field label={t("Slug")} name="slug" readOnly={readOnly} setForm={setForm} value={form.slug} />
              </div>
              <FieldArea label={t("Excerpt")} name="excerpt" readOnly={readOnly} setForm={setForm} value={form.excerpt} />
              <BlogTiptapEditor
                disabled={readOnly}
                initialContent={content}
                key={editorKey}
                onChange={(json, text) => {
                  setContent(json);
                  setContentMarkdown(text);
                }}
                placeholder={t("Write the article body...")}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
              <CardHeader><CardTitle>{t("Publishing")}</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <Select dir={dir} disabled={readOnly} onValueChange={(status: BlogContentStatus) => setForm((current) => ({ ...current, status }))} value={form.status}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["DRAFT", "PENDING_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"].map((status) => <SelectItem key={status} value={status}>{t(status)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select dir={dir} disabled={readOnly} onValueChange={(languageCode) => setForm((current) => ({ ...current, languageCode }))} value={form.languageCode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{languages.map((option) => <SelectItem key={option.code} value={option.code}>{languageLabel(option)}</SelectItem>)}</SelectContent>
                </Select>
                <Field label={t("Published at")} name="publishedAt" readOnly={readOnly} setForm={setForm} type="datetime-local" value={form.publishedAt} />
                <Field label={t("Scheduled at")} name="scheduledAt" readOnly={readOnly} setForm={setForm} type="datetime-local" value={form.scheduledAt} />
                <div className="grid gap-3">
                  <Toggle checked={form.featured} label={t("Featured post")} name="featured" readOnly={readOnly} setForm={setForm} />
                  <Toggle checked={form.commentsEnabled} label={t("Comments enabled")} name="commentsEnabled" readOnly={readOnly} setForm={setForm} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
              <CardHeader><CardTitle>{t("Taxonomy")}</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <Field label={t("Category slug")} name="categorySlug" readOnly={readOnly} setForm={setForm} value={form.categorySlug} />
                <Field label={t("Tag slugs")} name="tagSlugs" placeholder={t("comma,separated")} readOnly={readOnly} setForm={setForm} value={form.tagSlugs} />
                <Field label={t("Read minutes")} name="readMinutes" readOnly={readOnly} setForm={setForm} type="number" value={form.readMinutes} />
                <Field label={t("Sort order")} name="sortOrder" readOnly={readOnly} setForm={setForm} type="number" value={form.sortOrder} />
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle>{t("SEO and media")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label={t("Featured image URL")} name="featuredImageUrl" readOnly={readOnly} setForm={setForm} value={form.featuredImageUrl} />
            <Field label={t("Open Graph image")} name="ogImage" readOnly={readOnly} setForm={setForm} value={form.ogImage} />
            <Field label={t("SEO title")} name="seoTitle" readOnly={readOnly} setForm={setForm} value={form.seoTitle} />
            <Field label={t("Canonical URL")} name="canonicalUrl" readOnly={readOnly} setForm={setForm} value={form.canonicalUrl} />
            <div className="md:col-span-2">
              <FieldArea label={t("SEO description")} name="seoDescription" readOnly={readOnly} setForm={setForm} value={form.seoDescription} />
            </div>
            <div className="md:col-span-2">
              <Field label={t("Keywords")} name="keywords" placeholder={t("comma,separated")} readOnly={readOnly} setForm={setForm} value={form.keywords} />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function PermissionNotice({ access, message }: { access?: { isSuperAdmin: boolean; permissions: string[]; roleNames: string[] }; message: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <AdminShell access={access}>
      <Alert>
        <AlertTitle>{t("Permission required")}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </AdminShell>
  );
}

function Field({ label, name, placeholder, readOnly, setForm, type = "text", value }: {
  label: string;
  name: keyof BlogForm;
  placeholder?: string;
  readOnly: boolean;
  setForm: Dispatch<SetStateAction<BlogForm>>;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input
        disabled={readOnly}
        onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function FieldArea({ label, name, readOnly, setForm, value }: {
  label: string;
  name: keyof BlogForm;
  readOnly: boolean;
  setForm: Dispatch<SetStateAction<BlogForm>>;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Textarea disabled={readOnly} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} value={value} />
    </label>
  );
}

function Toggle({ checked, label, name, readOnly, setForm }: {
  checked: boolean;
  label: string;
  name: "commentsEnabled" | "featured";
  readOnly: boolean;
  setForm: Dispatch<SetStateAction<BlogForm>>;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm font-medium">
      <Checkbox checked={checked} disabled={readOnly} onCheckedChange={(value) => setForm((current) => ({ ...current, [name]: value === true }))} />
      {label}
    </label>
  );
}

function EditorSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <ShadowSkeleton className="h-[34rem]" />
    </div>
  );
}

function postToForm(post: AdminBlogPostDetail): BlogForm {
  return {
    ...defaultForm,
    categorySlug: post.category?.slug ?? "",
    commentsEnabled: post.commentsEnabled ?? true,
    excerpt: readString(post.excerpt) ?? "",
    featured: post.featured ?? false,
    featuredImageUrl: readString(post.featuredImageUrl) ?? "",
    languageCode: post.language?.code ?? "fa",
    publishedAt: toLocalDateTime(post.publishedAt),
    readMinutes: post.readMinutes ? String(post.readMinutes) : "",
    scheduledAt: toLocalDateTime(post.scheduledAt),
    slug: post.slug,
    sortOrder: post.sortOrder ? String(post.sortOrder) : "0",
    status: post.status ?? "DRAFT",
    tagSlugs: post.tags?.map((item) => item.tag?.slug).filter(Boolean).join(",") ?? "",
    title: readString(post.title) ?? "",
  };
}

function parseCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function numberOrUndefined(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}
