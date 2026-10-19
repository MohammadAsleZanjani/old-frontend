"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, Save, ShieldCheck, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type SubmitErrorHandler } from "react-hook-form";
import { toast } from "@/shared/ui/sonner";
import { z } from "zod";

import { BlogTiptapEditor } from "@/domains/blog/components/BlogTiptapEditor";
import { ProductImage } from "@/domains/catalog/ProductImage";
import { adminApiRequest } from "@/features/admin/api/admin-api-request";
import { AdminShell } from "@/features/admin/components/AdminShell";
import {
  productWeightGrams,
  productWeightLabel,
  taxonomyWeightGrams,
  weightInputValue,
  type ProductWeightUnit,
} from "@/features/admin/lib/product-weight";
import { languageLabel, useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatTomanMoney, isTomanCurrency, tomanAmount } from "@/shared/lib/toman-money";
import { DropzoneUploader } from "@/shared/uploads/DropzoneUploader";
import type { UploadApiResult } from "@/shared/uploads/upload-api";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

const productSchema = z.object({
  badge: z.string().optional(),
  canonicalUrl: z.string().optional(),
  categorySlug: z.string().optional(),
  certificateType: z.string().optional(),
  changelog: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  currency: z.string().min(3).max(5),
  demoUrl: z.string().optional(),
  documentationUrl: z.string().optional(),
  featured: z.boolean(),
  formFactor: z.string().min(2),
  highlights: z.string().optional(),
  insurancePercent: z.coerce.number().min(0).max(100),
  keywords: z.string().optional(),
  languageCode: z.string().min(2),
  licenseType: z.string().min(2),
  lowStockThreshold: z.coerce.number().int().min(0),
  makingFeeToman: z.coerce.number().min(0),
  manufacturer: z.string().optional(),
  dimensions: z.string().optional(),
  packaging: z.string().optional(),
  price: z.coerce.number().min(0),
  productFeePercent: z.coerce.number().min(0).max(100),
  purity: z.coerce.number().int().min(1).max(1000),
  refundPolicy: z.string().optional(),
  requirements: z.string().optional(),
  robots: z.string(),
  salePrice: z.coerce.number().min(0).optional(),
  schedulePublishAt: z.string().optional(),
  seoDescription: z.string().optional(),
  seoTitle: z.string().optional(),
  shortDescription: z.string().min(1).max(300),
  sku: z.string().optional(),
  slug: z.string().min(2).regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"]),
  supportPolicy: z.string().optional(),
  stockQuantity: z.coerce.number().int().min(0),
  tagSlugs: z.string().optional(),
  techSlugs: z.string().optional(),
  terms: z.string().optional(),
  title: z.string().min(3).max(140),
  version: z.string().optional(),
  videoUrl: z.string().optional(),
  visibility: z.string(),
  weightGrams: z.coerce.number().positive().max(9_999_999.999),
});

type ProductFormValues = z.infer<typeof productSchema>;

type ProductMedia = { altText?: string; caption?: string; type: "cover" | "gallery"; url: string };

const defaultValues: ProductFormValues = {
  badge: "",
  canonicalUrl: "",
  categorySlug: "",
  certificateType: "آزمایشگاه معتبر / QR",
  changelog: "",
  countryOfOrigin: "ایران",
  currency: "TOMAN",
  demoUrl: "",
  documentationUrl: "",
  featured: false,
  formFactor: "کپسول کلکسیونی",
  highlights: "",
  insurancePercent: 0,
  keywords: "",
  languageCode: "fa",
  licenseType: "standard",
  lowStockThreshold: 5,
  makingFeeToman: 0,
  manufacturer: "",
  dimensions: "",
  packaging: "کپسول پلمب",
  price: 0,
  productFeePercent: 3.5,
  purity: 999,
  refundPolicy: "",
  requirements: "",
  robots: "index,follow",
  salePrice: 0,
  schedulePublishAt: "",
  seoDescription: "",
  seoTitle: "",
  shortDescription: "",
  sku: "",
  slug: "",
  status: "PUBLISHED",
  supportPolicy: "",
  stockQuantity: 0,
  tagSlugs: "",
  techSlugs: "",
  terms: "",
  title: "",
  version: "1.0.0",
  videoUrl: "",
  visibility: "public",
  weightGrams: 10,
};

export function ProductEditorPage({ mode, productId }: { mode: "create" | "edit" | "view"; productId?: string }) {
  const router = useRouter();
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const [description, setDescription] = useState<Record<string, unknown>>({ content: [{ type: "paragraph" }], type: "doc" });
  const [descriptionText, setDescriptionText] = useState("");
  const [images, setImages] = useState<ProductMedia[]>([]);
  const [mediaSaving, setMediaSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const form = useForm<ProductFormValues>({ defaultValues, resolver: zodResolver(productSchema) });
  const uploadEntityId = useMemo(() => (productId ?? form.watch("slug")) || "draft-product", [form, productId]);
  const readOnly = mode === "view";
  const productQuery = useQuery({
    enabled: mode !== "create" && !!productId,
    queryFn: () => fetchProductDetail(productId ?? ""),
    queryKey: ["admin-product-detail", productId],
    retry: 1,
  });
  const taxonomyQuery = useQuery({
    queryFn: async () => {
      const [categories, silverTypes, sizes, purities, manufacturers] = await Promise.all([
        adminApiRequest<TaxonomyPage>("/admin/products/taxonomy/categories", { query: { page: 1, pageSize: 100 } }),
        adminApiRequest<TaxonomyPage>("/admin/products/taxonomy/silver-types", { query: { page: 1, pageSize: 100 } }),
        adminApiRequest<TaxonomyPage>("/admin/products/taxonomy/sizes", { query: { page: 1, pageSize: 100 } }),
        adminApiRequest<TaxonomyPage>("/admin/products/taxonomy/purities", { query: { page: 1, pageSize: 100 } }),
        adminApiRequest<TaxonomyPage>("/admin/products/taxonomy/manufacturers", { query: { page: 1, pageSize: 100 } }),
      ]);
      return { categories: categories.items, manufacturers: manufacturers.items, purities: purities.items, silverTypes: silverTypes.items, sizes: sizes.items };
    },
    queryKey: ["admin-product-taxonomy"],
    retry: 1,
  });

  useEffect(() => {
    if (!productQuery.data) return;
    const loadedValues = productToFormValues(productQuery.data);
    form.reset(loadedValues);
    // Keep legacy silver products editable even when the historic record did
    // not persist weightGrams. React Hook Form can otherwise retain the empty
    // select value while taxonomy options are loading.
    form.setValue("weightGrams", loadedValues.weightGrams, { shouldValidate: true });
    const loadedDescription = isRecord(productQuery.data.description) ? productQuery.data.description : { content: [{ type: "paragraph" }], type: "doc" };
    setDescription(loadedDescription);
    setDescriptionText(readString(productQuery.data.descriptionMarkdown) ?? readString(productQuery.data.shortDescription) ?? "");
    setImages(productImages(productQuery.data.images));
  }, [form, productQuery.data]);

  const onSubmit = async (values: ProductFormValues) => {
    setSaving(true);
    try {
      const payload = await adminApiRequest<unknown>(mode === "edit" && productId ? `/admin/products/${productId}` : "/admin/products", {
        body: {
          badge: values.badge || undefined,
          categorySlug: values.categorySlug || undefined,
          certificateType: values.certificateType || undefined,
          changelog: parseLines(values.changelog).map((entry) => ({
            date: new Date().toISOString(),
            notes: { fa: entry },
            version: values.version || "1.0.0",
          })),
          currency: values.currency,
          countryOfOrigin: values.countryOfOrigin || undefined,
          demoUrl: values.demoUrl || undefined,
          description,
          descriptionMarkdown: descriptionText || values.shortDescription,
          documentationUrl: values.documentationUrl || undefined,
          featured: values.featured,
          formFactor: values.formFactor,
          features: { items: parseLines(values.highlights) },
          highlights: parseLines(values.highlights),
          images,
          insurancePercent: values.insurancePercent,
          languageCode: values.languageCode,
          licenseType: values.licenseType,
          lowStockThreshold: values.lowStockThreshold,
          makingFeeToman: values.makingFeeToman,
          manufacturer: values.manufacturer || undefined,
          dimensions: values.dimensions || undefined,
          packaging: values.packaging || undefined,
          price: values.price,
          productFeePercent: values.productFeePercent,
          purity: values.purity,
          requirements: { items: parseLines(values.requirements) },
          salePrice: values.salePrice || undefined,
          seo: {
            description: values.seoDescription || undefined,
            keywords: parseCsv(values.keywords),
            title: values.seoTitle || undefined,
          },
          shortDescription: values.shortDescription,
          sku: values.sku || undefined,
          stockQuantity: values.stockQuantity,
          slug: values.slug,
          status: values.status,
          tagSlugs: parseCsv(values.tagSlugs),
          techSlugs: parseCsv(values.techSlugs),
          title: values.title,
          videoUrl: values.videoUrl || undefined,
          weightGrams: values.weightGrams,
          versions: values.version
            ? [{ isCurrent: true, notes: { fa: values.changelog || "" }, releaseDate: new Date().toISOString(), version: values.version }]
            : undefined,
        },
        method: mode === "edit" ? "PATCH" : "POST",
      });
      toast.success(values.status === "DRAFT" ? t("Draft product saved") : t("Product saved"));
      const savedId = readString(isRecord(payload) ? payload.id : undefined);
      if (mode === "create" && savedId) router.replace(`/admin/products/${savedId}/edit`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Product could not be saved"));
    } finally {
      setSaving(false);
    }
  };

  const onInvalid: SubmitErrorHandler<ProductFormValues> = (errors) => {
    const firstField = Object.keys(errors)[0] as keyof ProductFormValues | undefined;
    if (firstField) form.setFocus(firstField);
    const invalidLabels = Object.keys(errors).map((field) => t(productFieldLabels[field as keyof ProductFormValues] ?? field)).join("، ");
    toast.error(`${t("Please complete the highlighted required product fields.")} ${invalidLabels}`);
  };

  const saveImages = async (nextImages: ProductMedia[] = images) => {
    if (!productId) {
      toast.error(t("Save the product before saving images"));
      return;
    }
    setMediaSaving(true);
    try {
      const product = await adminApiRequest<AdminProductDetail>(`/admin/products/detail/${productId}/images`, { body: { images: nextImages }, method: "PATCH" });
      setImages(productImages(product.images));
      toast.success(t("Product images saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Product images could not be saved"));
    } finally {
      setMediaSaving(false);
    }
  };

  return (
    <AdminShell>
      {productQuery.isLoading ? (
        <ProductEditorSkeleton />
      ) : productQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t("Product unavailable")}</AlertTitle>
          <AlertDescription>{productQuery.error.message}</AlertDescription>
        </Alert>
      ) : (
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
          <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-2">
              <Badge className="w-fit" variant="outline">{t("Silver Products / Catalog")}</Badge>
              <h2 className="text-2xl font-bold md:text-3xl">{mode === "create" ? t("Create Silver Product") : t("Silver Product Control Panel")}</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("Manage weight, purity, form, maker, inventory, premium packaging, authenticity, media, pricing and publishing in one workflow.")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={saving || readOnly} type="submit">
                <Save className="size-4" />
                {saving ? t("Saving...") : t("Save product")}
              </Button>
            </div>
          </section>

          <Alert>
            <ShieldCheck className="size-4" />
            <AlertTitle>{t("Silver product publishing workflow")}</AlertTitle>
            <AlertDescription>{t("Upload public product photos, select the cover image, complete silver specifications, and save to publish the product.")}</AlertDescription>
          </Alert>

          <Tabs defaultValue="general" dir={dir}>
            <TabsList className="h-auto w-full flex-wrap justify-start rtl:[direction:rtl] ltr:[direction:ltr]" dir={dir}>
              {productTabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value}>{t(tab.label)}</TabsTrigger>)}
            </TabsList>

            <TabsContent value="general"><Panel title="Silver identity"><GeneralFields categories={taxonomyQuery.data?.categories ?? []} form={form} loadingTaxonomy={taxonomyQuery.isLoading} manufacturers={taxonomyQuery.data?.manufacturers ?? []} purities={taxonomyQuery.data?.purities ?? []} readOnly={readOnly} silverTypes={taxonomyQuery.data?.silverTypes ?? []} sizes={taxonomyQuery.data?.sizes ?? []} taxonomyError={taxonomyQuery.isError} /></Panel></TabsContent>
            <TabsContent value="description">
              <Panel title="Description">
                <BlogTiptapEditor disabled={readOnly} onChange={(json, text) => { setDescription(json); setDescriptionText(text); }} placeholder={t("Write product description...")} />
                <FieldArea form={form} name="highlights" label="Highlights / Features" placeholder="One item per line" readOnly={readOnly} />
                <FieldArea form={form} name="requirements" label="Requirements" placeholder="One requirement per line" readOnly={readOnly} />
              </Panel>
            </TabsContent>
            <TabsContent value="pricing"><Panel title="Pricing"><PricingFields form={form} readOnly={readOnly} /></Panel></TabsContent>
            <TabsContent value="media">
              <Panel title="Product images">
                <DropzoneUploader
                  accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] }}
                  entityId={uploadEntityId}
                  entityType="product-media"
                  maxFiles={8}
                  onUploaded={(upload) => addUploadedImage(upload, images, setImages, form.getValues("title"))}
                  visibility="PUBLIC"
                />
                <ProductMediaManager images={images} onChange={setImages} onSave={saveImages} readOnly={readOnly} saving={mediaSaving} />
              </Panel>
            </TabsContent>
            <TabsContent value="files"><Panel title="Authenticity documents"><DropzoneUploader accept={{ "application/pdf": [".pdf"], "image/*": [".jpg", ".jpeg", ".png", ".webp"] }} entityId={uploadEntityId} entityType="product-certificate" visibility="PRIVATE" /></Panel></TabsContent>
            <TabsContent value="seo"><Panel title="SEO"><SeoFields form={form} readOnly={readOnly} /></Panel></TabsContent>
            <TabsContent value="translations"><Panel title="Translations"><TranslationFields form={form} readOnly={readOnly} /></Panel></TabsContent>
            <TabsContent value="policy"><Panel title="Policy & License"><PolicyFields form={form} readOnly={readOnly} /></Panel></TabsContent>
            <TabsContent value="publishing"><Panel title="Publishing"><PublishingFields form={form} readOnly={readOnly} /></Panel></TabsContent>
          </Tabs>
        </form>
      </Form>
      )}
    </AdminShell>
  );
}

function ProductEditorSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <ShadowSkeleton className="h-12" />
      <ShadowSkeleton className="h-[34rem]" />
    </div>
  );
}

function ProductMediaManager({ images, onChange, onSave, readOnly, saving }: { images: ProductMedia[]; onChange: (images: ProductMedia[]) => void; onSave: (images?: ProductMedia[]) => void; readOnly: boolean; saving: boolean }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  if (!images.length) {
    return <div className="space-y-3"><div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"><ImageIcon className="mx-auto mb-3 size-8" />{t("No product images have been added yet.")}</div>{!readOnly ? <Button disabled={saving} onClick={() => onSave()} type="button" variant="outline">{saving ? t("Saving...") : t("Save image changes")}</Button> : null}</div>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {images.map((image, index) => (
        <div className="overflow-hidden rounded-xl border border-border bg-card" key={`${image.url}-${index}`}>
          <div className="aspect-square bg-white"><ProductImage alt={image.altText ?? ""} imageClassName="p-2" src={image.url} /></div>
          <div className="grid gap-3 p-3">
            <div className="flex items-center justify-between gap-2"><Badge variant={image.type === "cover" ? "default" : "outline"}>{image.type === "cover" ? t("Cover image") : t("Gallery image")}</Badge>
            {!readOnly ? <div className="flex gap-1">
              {image.type !== "cover" ? <Button aria-label={t("Set as cover image")} onClick={() => onChange(images.map((item, itemIndex) => ({ ...item, type: itemIndex === index ? "cover" : item.type === "cover" ? "gallery" : item.type })))} size="icon" type="button" variant="ghost"><Star className="size-4" /></Button> : null}
              <Button aria-label={t("Remove image")} onClick={() => {
                const remaining = images.filter((_, itemIndex) => itemIndex !== index);
                const normalized = remaining.map((item, itemIndex) => ({ ...item, type: itemIndex === 0 && !remaining.some((entry) => entry.type === "cover") ? "cover" as const : item.type }));
                onChange(normalized);
                onSave(normalized);
              }} size="icon" type="button" variant="ghost"><Trash2 className="size-4" /></Button>
            </div> : null}</div>
            {!readOnly ? <><label className="grid gap-1 text-xs text-muted-foreground"><span>{t("Image URL")}</span><Input dir="ltr" onChange={(event) => onChange(images.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} value={image.url} /></label><label className="grid gap-1 text-xs text-muted-foreground"><span>{t("Image alternative text")}</span><Input onChange={(event) => onChange(images.map((item, itemIndex) => itemIndex === index ? { ...item, altText: event.target.value } : item))} value={image.altText ?? ""} /></label><label className="grid gap-1 text-xs text-muted-foreground"><span>{t("Image caption")}</span><Input onChange={(event) => onChange(images.map((item, itemIndex) => itemIndex === index ? { ...item, caption: event.target.value } : item))} value={image.caption ?? ""} /></label></> : null}
          </div>
        </div>
      ))}
      {!readOnly ? <div className="sm:col-span-2 xl:col-span-3"><Button disabled={saving} onClick={() => onSave()} type="button">{saving ? t("Saving...") : t("Save image changes")}</Button></div> : null}
    </div>
  );
}

function addUploadedImage(upload: UploadApiResult, images: ProductMedia[], onChange: (images: ProductMedia[]) => void, title: string) {
  const url = upload.publicUrl ?? upload.thumbnailUrl;
  if (!url || images.some((image) => image.url === url)) return;
  onChange([...images, { altText: title || upload.originalName, type: images.some((image) => image.type === "cover") ? "gallery" : "cover", url }]);
}

function productImages(value: unknown): ProductMedia[] {
  if (!Array.isArray(value)) return [];
  const parsed = value.flatMap((item): ProductMedia[] => {
    if (!isRecord(item)) return [];
    const url = readString(item.url);
    if (!url) return [];
    return [{ altText: readString(item.altText), caption: readString(item.caption), type: item.type === "cover" ? "cover" : "gallery", url }];
  });
  if (parsed.length && !parsed.some((image) => image.type === "cover")) parsed[0] = { ...parsed[0], type: "cover" };
  return parsed;
}

const productTabs = [
  { label: "Silver specifications", value: "general" },
  { label: "Description", value: "description" },
  { label: "Pricing & inventory", value: "pricing" },
  { label: "Media", value: "media" },
  { label: "Certificates", value: "files" },
  { label: "SEO", value: "seo" },
  { label: "Translations", value: "translations" },
  { label: "Publishing", value: "publishing" },
];

function Panel({ children, title }: { children: React.ReactNode; title: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader><CardTitle>{t(title)}</CardTitle></CardHeader>
      <CardContent className="grid gap-5">{children}</CardContent>
    </Card>
  );
}

function GeneralFields({ categories, form, loadingTaxonomy, manufacturers, purities, readOnly, silverTypes, sizes, taxonomyError }: FieldGroupProps & { categories: TaxonomyItem[]; loadingTaxonomy: boolean; manufacturers: TaxonomyItem[]; purities: TaxonomyItem[]; silverTypes: TaxonomyItem[]; sizes: TaxonomyItem[]; taxonomyError: boolean }) {
  const { lang } = useI18n();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {taxonomyError ? <Alert className="md:col-span-2" variant="destructive"><AlertTitle>{translateUiText("Product taxonomy unavailable", lang)}</AlertTitle><AlertDescription>{translateUiText("Categories and silver product types could not be loaded from the database.", lang)}</AlertDescription></Alert> : null}
      <FieldInput form={form} name="title" label="Title" readOnly={readOnly} />
      <FieldInput form={form} name="slug" label="Slug" readOnly={readOnly} />
      <FieldInput form={form} name="shortDescription" label="Short description" readOnly={readOnly} />
      <FieldSelect form={form} name="categorySlug" label="Category" options={categories.map((category) => ({ label: localizedTaxonomyLabel(category.title, lang, category.slug), value: category.slug }))} placeholder={loadingTaxonomy ? "Loading categories..." : "Select product category"} readOnly={readOnly || loadingTaxonomy} />
      <FieldInput form={form} name="sku" label="SKU / inventory code" readOnly={readOnly} />
      <FieldSelect form={form} name="formFactor" label="Silver product type" options={silverTypes.map((type) => ({ label: type.name ?? type.slug, value: type.name ?? type.slug }))} placeholder={loadingTaxonomy ? "Loading silver types..." : silverTypes.length ? "Select silver product type" : "No silver product types are registered"} readOnly={readOnly || loadingTaxonomy || !silverTypes.length} />
      <ProductWeightField form={form} loading={loadingTaxonomy} readOnly={readOnly} sizes={sizes} />
      <FieldSelect form={form} name="purity" label="Purity (per thousand)" options={numericTaxonomyOptions(purities, form.getValues("purity"))} placeholder={loadingTaxonomy ? "Loading product attributes..." : "Select silver purity"} readOnly={readOnly || loadingTaxonomy} />
      <FieldSelect form={form} name="manufacturer" label="Mint / manufacturer" options={manufacturers.map((item) => ({ label: item.name ?? item.slug, value: item.name ?? item.slug }))} placeholder={loadingTaxonomy ? "Loading product attributes..." : "Select manufacturer"} readOnly={readOnly || loadingTaxonomy || !manufacturers.length} />
      <FieldInput form={form} name="dimensions" label="Dimensions" placeholder="e.g. 30 × 18 × 2 mm" readOnly={readOnly} />
      <FieldInput form={form} name="packaging" label="Packaging / capsule" readOnly={readOnly} />
      <FieldInput form={form} name="certificateType" label="Certificate / assay" readOnly={readOnly} />
      <FieldInput form={form} name="countryOfOrigin" label="Country of origin" readOnly={readOnly} />
      <FieldInput form={form} name="tagSlugs" label="Search tags" placeholder="شمش,999,کپسول" readOnly={readOnly} />
      <FieldSelect form={form} name="status" label="Status" options={["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"]} readOnly={readOnly} />
      <FormField control={form.control} name="featured" render={({ field }) => (
        <FormItem className="flex items-center gap-3 rounded-lg border border-border p-3">
          <FormControl><Checkbox checked={field.value} disabled={readOnly} onCheckedChange={field.onChange} /></FormControl>
          <TranslatedFormLabel className="m-0">Featured product</TranslatedFormLabel>
        </FormItem>
      )} />
    </div>
  );
}

function PricingFields(props: FieldGroupProps) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const weightGrams = Number(useWatch({ control: props.form.control, name: "weightGrams" }) ?? 0);
  const productFeePercent = Number(useWatch({ control: props.form.control, name: "productFeePercent" }) ?? 0);
  const insurancePercent = Number(useWatch({ control: props.form.control, name: "insurancePercent" }) ?? 0);
  const makingFeeToman = Number(useWatch({ control: props.form.control, name: "makingFeeToman" }) ?? 0);
  const validPricing = weightGrams > 0 && makingFeeToman >= 0 && productFeePercent >= 0 && productFeePercent <= 100 && insurancePercent >= 0 && insurancePercent <= 100;
  const preview = useQuery({
    enabled: validPricing,
    queryFn: () => adminApiRequest<ProductPricingPreview>("/admin/products/pricing/preview", { query: { insurancePercent, makingFeeToman, productFeePercent, weightGrams } }),
    queryKey: ["admin-product-pricing-preview", weightGrams, makingFeeToman, productFeePercent, insurancePercent],
    retry: 1,
  });

  return (
    <div className="space-y-5">
      <Alert>
        <ShieldCheck className="size-4" />
        <AlertTitle>{t("Live product price based on Noghreh rates")}</AlertTitle>
        <AlertDescription>{t("The final price is calculated from the live silver value, the silver purchase fee, this product's fee, and this product's insurance rate.")}</AlertDescription>
      </Alert>
      <div className="grid gap-4 md:grid-cols-3">
        <FieldInput {...props} name="makingFeeToman" label="Making fee per product (Toman)" type="number" />
        <FieldInput {...props} name="productFeePercent" label="Product fee percent" type="number" />
        <FieldInput {...props} name="insurancePercent" label="Product insurance rate percent" type="number" />
        <FieldInput {...props} name="price" label="Fallback price (Toman)" type="number" />
        <FieldSelect {...props} name="currency" label="Currency" options={[{ label: "تومان", value: "TOMAN" }]} />
        <FieldInput {...props} name="stockQuantity" label="Available stock" type="number" />
        <FieldInput {...props} name="lowStockThreshold" label="Low-stock alert at" type="number" />
      </div>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3"><CardTitle className="text-base">{t("Live pricing preview")}</CardTitle></CardHeader>
        <CardContent>
          {!validPricing ? <p className="text-sm text-muted-foreground">{t("Enter a valid product weight, making fee, commission, and insurance rate to see the final price.")}</p> : preview.isLoading ? <ShadowSkeleton className="h-24" /> : preview.isError || !preview.data ? <Alert variant="destructive"><AlertTitle>{t("Live price preview unavailable")}</AlertTitle><AlertDescription>{t("The product can still be saved; check the silver price service before publishing.")}</AlertDescription></Alert> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"><PricingMetric label={t("Silver metal value")} value={preview.data.metalAmount} lang={lang} /><PricingMetric label={`${t("Silver purchase fee")} · ${preview.data.silverFeePercent}٪`} value={preview.data.silverFeeAmount} lang={lang} /><PricingMetric label={t("Product making fee")} value={preview.data.makingFeeToman} lang={lang} /><PricingMetric label={`${t("Product commission")} · ${preview.data.productFeePercent}٪`} value={preview.data.productFeeAmount} lang={lang} /><PricingMetric label={`${t("Product insurance")} · ${preview.data.insurancePercent}٪`} value={preview.data.insuranceAmount} lang={lang} /><PricingMetric emphasized label={t("Final product price")} value={preview.data.total} lang={lang} /></div>}
        </CardContent>
      </Card>
    </div>
  );
}

function PricingMetric({ emphasized = false, label, lang, value }: { emphasized?: boolean; label: string; lang: string; value: string }) {
  return <div className={`rounded-xl border p-3 ${emphasized ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}><p className={`text-xs ${emphasized ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</p><p className="mt-2 font-bold tabular-nums">{formatTomanMoney(value, "TOMAN", lang === "fa" ? "fa-IR" : "en-US")}</p></div>;
}

function VersionFields(props: FieldGroupProps) {
  return <div className="grid gap-4"><FieldInput {...props} name="version" label="Version number" /><FieldArea {...props} name="changelog" label="Changelog" placeholder="One changelog item per line" /></div>;
}

function DemoFields(props: FieldGroupProps) {
  return <div className="grid gap-4 md:grid-cols-3"><FieldInput {...props} name="demoUrl" label="Demo URL" /><FieldInput {...props} name="documentationUrl" label="Documentation URL" /><FieldInput {...props} name="videoUrl" label="Video URL" /></div>;
}

function SeoFields(props: FieldGroupProps) {
  return <div className="grid gap-4"><FieldInput {...props} name="seoTitle" label="SEO title" /><FieldArea {...props} name="seoDescription" label="SEO description" /><FieldInput {...props} name="keywords" label="Keywords" placeholder="comma,separated" /><FieldInput {...props} name="canonicalUrl" label="Canonical URL" /><FieldSelect {...props} name="robots" label="Robots" options={["index,follow", "noindex,follow", "noindex,nofollow"]} /></div>;
}

function TranslationFields(props: FieldGroupProps) {
  const { dir, lang, languages } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField control={props.form.control} name="languageCode" render={({ field }) => (
        <FormItem>
          <FormLabel>{t("Language")}</FormLabel>
          <Select dir={dir} disabled={props.readOnly} onValueChange={field.onChange} value={String(field.value ?? "")}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>{languages.map((option) => <SelectItem key={option.code} value={option.code}>{languageLabel(option)}</SelectItem>)}</SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />
      <FieldInput {...props} name="badge" label="Translation status" placeholder="manual / missing / AI" />
    </div>
  );
}

function PolicyFields(props: FieldGroupProps) {
  return <div className="grid gap-4"><FieldInput {...props} name="licenseType" label="License type" /><FieldArea {...props} name="refundPolicy" label="Refund policy" /><FieldArea {...props} name="supportPolicy" label="Support policy" /><FieldArea {...props} name="terms" label="Terms" /></div>;
}

function PublishingFields(props: FieldGroupProps) {
  return <div className="grid gap-4 md:grid-cols-3"><FieldSelect {...props} name="status" label="Publishing status" options={["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"]} /><FieldInput {...props} name="schedulePublishAt" label="Schedule publish" type="datetime-local" /><FieldSelect {...props} name="visibility" label="Visibility" options={["public", "private", "unlisted"]} /></div>;
}

type FieldGroupProps = {
  form: ReturnType<typeof useForm<ProductFormValues>>;
  readOnly: boolean;
};

function FieldInput({ form, label, name, placeholder, readOnly, type = "text" }: FieldGroupProps & { label: string; name: keyof ProductFormValues; placeholder?: string; type?: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{t(label)}</FormLabel>
        <FormControl><Input {...field} disabled={readOnly} placeholder={placeholder ? t(placeholder) : undefined} type={type} value={String(field.value ?? "")} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function FieldArea({ form, label, name, placeholder, readOnly }: FieldGroupProps & { label: string; name: keyof ProductFormValues; placeholder?: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{t(label)}</FormLabel>
        <FormControl><Textarea {...field} disabled={readOnly} placeholder={placeholder ? t(placeholder) : undefined} value={String(field.value ?? "")} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function FieldSelect({ form, label, name, options, placeholder, readOnly }: FieldGroupProps & { label: string; name: keyof ProductFormValues; options: Array<string | { label: string; value: string }>; placeholder?: string }) {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{t(label)}</FormLabel>
        <Select dir={dir} disabled={readOnly} onValueChange={field.onChange} value={String(field.value ?? "")}>
          <FormControl><SelectTrigger><SelectValue placeholder={placeholder ? t(placeholder) : undefined} /></SelectTrigger></FormControl>
          <SelectContent>{options.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const optionLabel = typeof option === "string" ? option : option.label;
            return <SelectItem key={value} value={value}>{t(optionLabel)}</SelectItem>;
          })}</SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function ProductWeightField({ form, loading, readOnly, sizes }: FieldGroupProps & { loading: boolean; sizes: TaxonomyItem[] }) {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const [unit, setUnit] = useState<ProductWeightUnit>("GRAM");
  const options = productWeightOptions(sizes, lang);
  return (
    <FormField control={form.control} name="weightGrams" render={({ field }) => {
      const grams = Number(field.value ?? 0);
      const preset = options.find((option) => Number(option.value) === grams)?.value ?? "__custom__";
      return (
        <FormItem className="rounded-lg border border-border bg-background/20 p-4 md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FormLabel>{t("Product net weight")}</FormLabel>
            <Button asChild size="sm" type="button" variant="ghost"><Link href="/admin/shop/products/sizes">{t("Manage defined weights")}</Link></Button>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]">
            <Select dir={dir} disabled={readOnly || loading} onValueChange={(value) => {
              if (value === "__custom__") return;
              const selectedGrams = Number(value);
              field.onChange(selectedGrams);
              setUnit(selectedGrams >= 1_000 ? "KILOGRAM" : "GRAM");
            }} value={preset}>
              <FormControl><SelectTrigger><SelectValue placeholder={t(loading ? "Loading product attributes..." : "Select a defined weight")} /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="__custom__">{t("Custom weight")}</SelectItem>
                {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormControl>
              <Input
                dir="ltr"
                disabled={readOnly}
                inputMode="decimal"
                min="0.001"
                onChange={(event) => field.onChange(productWeightGrams(event.target.value, unit) ?? 0)}
                placeholder={unit === "GRAM" ? "10" : "1"}
                step="0.001"
                type="number"
                value={weightInputValue(grams, unit)}
              />
            </FormControl>
            <Select dir={dir} disabled={readOnly} onValueChange={(value: ProductWeightUnit) => setUnit(value)} value={unit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="GRAM">{t("Gram")}</SelectItem><SelectItem value="KILOGRAM">{t("Kilogram")}</SelectItem></SelectContent>
            </Select>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            {grams > 0 ? `${t("Stored product weight")}: ${productWeightLabel(grams, lang === "fa" ? "fa-IR" : "en-US")}` : t("Choose a defined weight or enter any positive custom weight.")}
          </p>
          <FormMessage />
        </FormItem>
      );
    }} />
  );
}

function TranslatedFormLabel({ children, className }: { children: string; className?: string }) {
  const { lang } = useI18n();
  return <FormLabel className={className}>{translateUiText(children, lang)}</FormLabel>;
}

async function fetchProductDetail(productId: string) {
  return adminApiRequest<AdminProductDetail>(`/admin/products/detail/${productId}`);
}

function productToFormValues(product: AdminProductDetail): ProductFormValues {
  const sourceCurrency = readString(product.currency) ?? defaultValues.currency;
  return {
    ...defaultValues,
    badge: readString(product.badge) ?? "",
    categorySlug: readString(isRecord(product.category) ? product.category.slug : undefined) ?? "",
    certificateType: readString(product.certificateType) ?? defaultValues.certificateType,
    changelog: Array.isArray(product.changelogs) ? product.changelogs.map((item) => readString(isRecord(item) ? item.notes : undefined)).filter(Boolean).join("\n") : "",
    currency: isTomanCurrency(sourceCurrency) ? "TOMAN" : sourceCurrency,
    countryOfOrigin: readString(product.countryOfOrigin) ?? defaultValues.countryOfOrigin,
    demoUrl: readString(product.demoUrl) ?? "",
    documentationUrl: readString(product.documentationUrl) ?? "",
    featured: readBoolean(product.featured) ?? false,
    formFactor: readString(product.formFactor) ?? defaultValues.formFactor,
    highlights: Array.isArray(product.highlights) ? product.highlights.map((item) => readString(item)).filter(Boolean).join("\n") : "",
    insurancePercent: readNumber(product.insurancePercent) ?? defaultValues.insurancePercent,
    languageCode: readString(isRecord(product.language) ? product.language.code : undefined) ?? defaultValues.languageCode,
    licenseType: readString(product.licenseType) ?? defaultValues.licenseType,
    lowStockThreshold: readNumber(product.lowStockThreshold) ?? defaultValues.lowStockThreshold,
    makingFeeToman: readNumber(product.makingFeeToman) ?? defaultValues.makingFeeToman,
    manufacturer: readString(product.manufacturer) ?? "",
    dimensions: readString(product.dimensions) ?? "",
    packaging: readString(product.packaging) ?? "",
    price: tomanAmount(readNumber(product.price) ?? 0, sourceCurrency),
    productFeePercent: readNumber(product.productFeePercent) ?? defaultValues.productFeePercent,
    purity: readNumber(product.purity) ?? defaultValues.purity,
    requirements: readStringFromJson(product.requirements),
    salePrice: tomanAmount(readNumber(product.salePrice) ?? 0, sourceCurrency),
    seoDescription: readString(product.seoDescription) ?? "",
    seoTitle: readString(product.seoTitle) ?? "",
    shortDescription: readString(product.shortDescription) ?? "",
    sku: readString(product.sku) ?? "",
    stockQuantity: readNumber(product.stockQuantity) ?? 0,
    slug: readString(product.slug) ?? "",
    status: product.status === "DRAFT" || product.status === "PENDING_REVIEW" || product.status === "PUBLISHED" || product.status === "ARCHIVED" ? product.status : "PUBLISHED",
    tagSlugs: Array.isArray(product.tags) ? product.tags.map((item) => readString(isRecord(item) && isRecord(item.tag) ? item.tag.slug : undefined)).filter(Boolean).join(",") : "",
    techSlugs: Array.isArray(product.techStacks) ? product.techStacks.map((item) => readString(isRecord(item) && isRecord(item.techStack) ? item.techStack.slug : undefined)).filter(Boolean).join(",") : "",
    title: readString(product.title) ?? "",
    version: readString(product.currentVersion) ?? readString(isRecord(product.versions?.[0]) ? product.versions?.[0]?.version : undefined) ?? defaultValues.version,
    videoUrl: readString(product.videoUrl) ?? "",
    weightGrams: legacyProductWeightGrams(product) ?? defaultValues.weightGrams,
  };
}

function parseCsv(value?: string) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

function parseLines(value?: string) {
  return value?.split("\n").map((item) => item.trim()).filter(Boolean) ?? [];
}

interface AdminProductDetail extends Record<string, unknown> {
  category?: unknown;
  changelogs?: unknown[];
  currentVersion?: unknown;
  description?: unknown;
  descriptionMarkdown?: unknown;
  featured?: unknown;
  highlights?: unknown;
  images?: unknown[];
  language?: unknown;
  price?: unknown;
  requirements?: unknown;
  salePrice?: unknown;
  status?: unknown;
  tags?: unknown[];
  techStacks?: unknown[];
  versions?: unknown[];
}

interface TaxonomyItem {
  id: string;
  name?: string;
  slug: string;
  title?: unknown;
  weightGrams?: number | string | null;
}

interface TaxonomyPage {
  items: TaxonomyItem[];
}

interface ProductPricingPreview {
  basePricePerGram: string;
  buyPricePerGram: string;
  insuranceAmount: string;
  insurancePercent: string;
  makingFeeToman: string;
  metalAmount: string;
  productFeeAmount: string;
  productFeePercent: string;
  silverFeeAmount: string;
  silverFeePercent: string;
  total: string;
  weightGrams: string;
}

function localizedTaxonomyLabel(value: unknown, lang: string, fallback: string) {
  if (!isRecord(value)) return readString(value) ?? fallback;
  return readString(value[lang]) ?? readString(value.fa) ?? readString(value.en) ?? fallback;
}

function numericTaxonomyOptions(items: TaxonomyItem[], currentValue?: number) {
  const options = items.flatMap((item) => {
    const label = item.name ?? item.slug;
    const numericSource = `${label} ${item.slug}`
      .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[٫,]/g, ".")
      .replace(/٬/g, "");
    const match = numericSource.match(/\d+(?:\.\d+)?/);
    return match ? [{ label, value: String(Number(match[0])) }] : [];
  });
  const unique = Array.from(new Map(options.map((option) => [option.value, option])).values());
  const current = currentValue === undefined ? undefined : String(currentValue);
  if (current && !unique.some((option) => option.value === current)) unique.unshift({ label: `${currentValue} گرم`, value: current });
  return unique;
}

function productWeightOptions(items: TaxonomyItem[], lang: string) {
  const options = items.flatMap((item) => {
    const grams = taxonomyWeightGrams(item);
    return grams ? [{ label: productWeightLabel(grams, lang === "fa" ? "fa-IR" : "en-US"), value: String(grams) }] : [];
  });
  return Array.from(new Map(options.map((option) => [option.value, option])).values()).sort((a, b) => Number(a.value) - Number(b.value));
}

const productFieldLabels: Partial<Record<keyof ProductFormValues, string>> = {
  currency: "Currency",
  formFactor: "Silver product type",
  insurancePercent: "Product insurance rate percent",
  makingFeeToman: "Making fee per product (Toman)",
  languageCode: "Language",
  price: "Fallback price (Toman)",
  productFeePercent: "Product fee percent",
  purity: "Purity (per thousand)",
  shortDescription: "Short description",
  slug: "Slug",
  title: "Title",
  weightGrams: "Net weight (grams)",
};

function legacyProductWeightGrams(product: AdminProductDetail) {
  const explicit = readNumber(product.weightGrams);
  if (explicit && explicit > 0) return explicit;
  const sources = [product.title, product.slug, product.sku, product.dimensions]
    .map((value) => readString(value))
    .filter((value): value is string => Boolean(value));
  for (const source of sources) {
    const inferred = taxonomyWeightGrams({ name: source, slug: source });
    if (inferred) return inferred;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return readString(record.fa) ?? readString(record.en) ?? readString(record.title) ?? readString(record.name);
  }
  return undefined;
}

function readStringFromJson(value: unknown) {
  if (!isRecord(value)) return "";
  if (Array.isArray(value.items)) return value.items.map((item) => readString(item)).filter(Boolean).join("\n");
  return readString(value);
}
