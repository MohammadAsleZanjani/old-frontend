"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import {
  getAdminCmsPage,
  updateAdminCmsPage,
  type AdminCmsContact,
  type CmsPageStatus,
} from "@/features/admin/api/admin-cms-api";
import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Textarea } from "@/shared/ui/textarea";

interface CmsPageForm {
  body: string;
  description: string;
  eyebrow: string;
  image: string;
  points: string;
  status: CmsPageStatus;
  title: string;
}

interface ContactForm {
  href: string;
  key: string;
  label: string;
  type: string;
  value: string;
}

const emptyForm: CmsPageForm = {
  body: "",
  description: "",
  eyebrow: "",
  image: "",
  points: "",
  status: "DRAFT",
  title: "",
};

export function AdminCmsPageEditorPage({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CmsPageForm>(emptyForm);
  const [contacts, setContacts] = useState<ContactForm[]>([]);
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const canManage = !!access && (access.isSuperAdmin || access.permissions.includes("content.manage"));
  const page = useQuery({
    enabled: canManage,
    queryFn: () => getAdminCmsPage(slug),
    queryKey: ["admin-cms-page", slug],
    retry: 1,
  });

  useEffect(() => {
    if (!page.data) return;
    const hero = page.data.sections.find((section) => section.key === "hero")?.content;
    const content = readLocalizedObject(hero);
    setForm({
      body: readString(content.body),
      description: readLocalizedString(page.data.summary),
      eyebrow: readString(content.eyebrow),
      image: readString(content.image),
      points: readStringArray(content.points).join("\n"),
      status: page.data.status,
      title: readLocalizedString(page.data.title),
    });
    setContacts((page.data.contacts ?? []).map(contactToForm));
  }, [page.data]);

  const save = useMutation({
    mutationFn: () => {
      if (!form.title.trim() || !form.description.trim()) throw new Error("عنوان و توضیح کوتاه الزامی است.");
      if (slug === "contact" && contacts.some((contact) => !contact.key.trim() || !contact.label.trim() || !contact.value.trim() || !contact.type.trim())) {
        throw new Error("کلید، عنوان، نوع و مقدار همه راه‌های ارتباطی را تکمیل کنید.");
      }
      return updateAdminCmsPage(slug, {
        body: form.body.trim(),
        contacts: slug === "contact" ? contacts.map((contact) => ({
          href: contact.href.trim() || undefined,
          key: contact.key.trim(),
          label: contact.label.trim(),
          type: contact.type.trim(),
          value: contact.value.trim(),
        })) : undefined,
        description: form.description.trim(),
        eyebrow: form.eyebrow.trim(),
        image: form.image.trim(),
        points: form.points.split("\n").map((item) => item.trim()).filter(Boolean),
        status: form.status,
        title: form.title.trim(),
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "ذخیره صفحه ناموفق بود."),
    onSuccess: () => {
      toast.success("صفحه با موفقیت ذخیره شد.");
      void queryClient.invalidateQueries({ queryKey: ["admin-cms-page", slug] });
      void queryClient.invalidateQueries({ queryKey: ["admin-resource", "/admin/cms/pages"] });
    },
  });

  if (overview.isLoading || page.isLoading) {
    return <AdminShell access={access}><EditorSkeleton /></AdminShell>;
  }
  if (overview.isError || page.isError) {
    return (
      <AdminShell access={access}>
        <Alert variant="destructive">
          <AlertTitle>صفحه در دسترس نیست</AlertTitle>
          <AlertDescription>{overview.error?.message ?? page.error?.message}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }
  if (!canManage) {
    return (
      <AdminShell access={access}>
        <Alert><AlertTitle>دسترسی لازم است</AlertTitle><AlertDescription>حساب شما مجوز مدیریت محتوای سایت را ندارد.</AlertDescription></Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">محتوا / صفحات سایت</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">ویرایش {form.title || slug}</h2>
            <p className="text-sm leading-7 text-muted-foreground">محتوای منتشرشده این فرم مستقیماً در صفحه عمومی نقره لند نمایش داده می‌شود.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href="/admin/content/pages"><ArrowRight className="size-4" />بازگشت به صفحات</Link></Button>
            <Button disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}ذخیره صفحه
            </Button>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <Card className="rounded-lg border-border bg-card/70">
            <CardHeader><CardTitle>محتوای فارسی</CardTitle></CardHeader>
            <CardContent className="grid gap-5">
              <Field label="عنوان صفحه" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
              <Field label="عبارت بالای عنوان" value={form.eyebrow} onChange={(value) => setForm((current) => ({ ...current, eyebrow: value }))} />
              <Area label="توضیح کوتاه" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
              <Area label="متن اصلی" rows={8} value={form.body} onChange={(value) => setForm((current) => ({ ...current, body: value }))} />
              <Area label="نکات کلیدی (هر مورد در یک خط)" rows={5} value={form.points} onChange={(value) => setForm((current) => ({ ...current, points: value }))} />
            </CardContent>
          </Card>
          <Card className="h-fit rounded-lg border-border bg-card/70">
            <CardHeader><CardTitle>انتشار و تصویر</CardTitle></CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2"><Label>وضعیت</Label><Select onValueChange={(value: CmsPageStatus) => setForm((current) => ({ ...current, status: value }))} value={form.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DRAFT">پیش‌نویس</SelectItem><SelectItem value="PUBLISHED">منتشرشده</SelectItem><SelectItem value="ARCHIVED">بایگانی</SelectItem></SelectContent></Select></div>
              <Field label="نشانی تصویر" value={form.image} onChange={(value) => setForm((current) => ({ ...current, image: value }))} />
              <div className="rounded-lg border border-border bg-background/40 p-3 text-xs leading-6 text-muted-foreground">شناسه صفحه: <span dir="ltr">{slug}</span></div>
            </CardContent>
          </Card>
        </section>

        {slug === "contact" ? (
          <Card className="rounded-lg border-border bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>راه‌های ارتباطی</CardTitle><Button onClick={() => setContacts((current) => [...current, emptyContact(current.length)])} size="sm" variant="outline"><Plus className="size-4" />افزودن راه ارتباطی</Button></CardHeader>
            <CardContent className="grid gap-4">
              {contacts.map((contact, index) => (
                <div className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-2 xl:grid-cols-5" key={`${contact.key}-${index}`}>
                  <Field label="عنوان" value={contact.label} onChange={(value) => updateContact(setContacts, index, "label", value)} />
                  <Field label="مقدار" value={contact.value} onChange={(value) => updateContact(setContacts, index, "value", value)} />
                  <Field label="نوع (phone/email/address)" value={contact.type} onChange={(value) => updateContact(setContacts, index, "type", value)} />
                  <Field label="لینک" value={contact.href} onChange={(value) => updateContact(setContacts, index, "href", value)} />
                  <div className="flex items-end gap-2"><div className="flex-1"><Field label="کلید یکتا" value={contact.key} onChange={(value) => updateContact(setContacts, index, "key", value)} /></div><Button aria-label="حذف" onClick={() => setContacts((current) => current.filter((_, itemIndex) => itemIndex !== index))} size="icon" variant="outline"><Trash2 className="size-4" /></Button></div>
                </div>
              ))}
              {!contacts.length ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">راه ارتباطی ثبت نشده است.</div> : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminShell>
  );
}

function Field({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return <div className="grid gap-2"><Label>{label}</Label><Input onChange={(event) => onChange(event.target.value)} value={value} /></div>;
}

function Area({ label, onChange, rows = 3, value }: { label: string; onChange: (value: string) => void; rows?: number; value: string }) {
  return <div className="grid gap-2"><Label>{label}</Label><Textarea onChange={(event) => onChange(event.target.value)} rows={rows} value={value} /></div>;
}

function contactToForm(contact: AdminCmsContact): ContactForm {
  return { href: contact.href ?? "", key: contact.key, label: readLocalizedString(contact.label), type: contact.type, value: contact.value };
}

function emptyContact(index: number): ContactForm {
  return { href: "", key: `contact-${index + 1}`, label: "", type: "phone", value: "" };
}

function updateContact(setContacts: React.Dispatch<React.SetStateAction<ContactForm[]>>, index: number, key: keyof ContactForm, value: string) {
  setContacts((current) => current.map((contact, itemIndex) => itemIndex === index ? { ...contact, [key]: value } : contact));
}

function readLocalizedObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const localized = record.fa ?? record.en;
  return localized && typeof localized === "object" && !Array.isArray(localized) ? localized as Record<string, unknown> : record;
}

function readLocalizedString(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  return readString(record.fa) || readString(record.en);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function EditorSkeleton() {
  return <div className="space-y-5"><ShadowSkeleton className="h-28" /><div className="grid gap-4 xl:grid-cols-[1fr_340px]"><ShadowSkeleton className="h-[40rem]" /><ShadowSkeleton className="h-72" /></div></div>;
}
