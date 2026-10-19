"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, FileText, Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { createCustomAdminInvoice, getAdminOverview, searchAdminInvoiceCustomers, type AdminInvoiceCustomerOption, type CreateCustomInvoiceInput } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatMobileDisplay } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Textarea } from "@/shared/ui/textarea";

type InvoiceItemForm = { description: string; quantity: string; unitPrice: string };

const emptyItem: InvoiceItemForm = { description: "", quantity: "1", unitPrice: "0" };

export function AdminInvoiceCreatePage() {
  const router = useRouter();
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const isRtl = lang !== "en";
  const BackIcon = isRtl ? ArrowLeft : ArrowRight;
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminInvoiceCustomerOption | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<CreateCustomInvoiceInput["type"]>("invoice");
  const [currency, setCurrency] = useState<CreateCustomInvoiceInput["currency"]>("TOMAN");
  const [status, setStatus] = useState<CreateCustomInvoiceInput["status"]>("PENDING");
  const [dueAt, setDueAt] = useState("");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItemForm[]>([{ ...emptyItem }]);
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const canCreate = !!access && (access.isSuperAdmin || access.permissions.includes("invoices.view"));
  const customerResults = useQuery({
    enabled: canCreate && customerSearch.trim().length >= 2,
    queryFn: () => searchAdminInvoiceCustomers(customerSearch.trim()),
    queryKey: ["admin-invoice-customers", customerSearch.trim()],
    retry: 1,
  });
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + toNumber(item.quantity, 1) * toNumber(item.unitPrice, 0), 0);
    const total = Math.max(0, subtotal - toNumber(discount, 0) + toNumber(tax, 0));
    return { subtotal, total };
  }, [discount, items, tax]);
  const create = useMutation({
    mutationFn: () => {
      const invoiceItems = items
        .map((item) => ({
          description: item.description.trim(),
          quantity: Math.max(1, Math.round(toNumber(item.quantity, 1))),
          unitPrice: toNumber(item.unitPrice, 0),
        }))
        .filter((item) => item.description);
      if (!invoiceItems.length) throw new Error(t("Add at least one invoice item."));
      if (!selectedCustomer && !firstName.trim() && !lastName.trim() && !mobile.trim() && !email.trim()) {
        throw new Error(t("Select an existing customer or add customer name, mobile, or email."));
      }
      if (!selectedCustomer && !mobile.trim()) {
        throw new Error(t("Mobile number is required for quick add invoice customers."));
      }
      return createCustomAdminInvoice({
        currency,
        customer: {
          address: address.trim() || undefined,
          email: email.trim() || undefined,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          mobile: mobile.trim() || undefined,
          userId: selectedCustomer?.id,
        },
        discount: toNumber(discount, 0),
        dueAt: dueAt || undefined,
        items: invoiceItems,
        notes: notes.trim() || undefined,
        status,
        tax: toNumber(tax, 0),
        type,
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Invoice could not be created")),
    onSuccess: (invoice) => {
      toast.success(type === "pre-invoice" ? t("Pre-invoice created.") : t("Invoice created."));
      router.replace(`/admin/finance/invoices/${invoice.id}`);
    },
  });

  if (overview.isLoading) return <AdminShell><InvoiceCreateSkeleton /></AdminShell>;
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
  if (!canCreate) {
    return (
      <AdminShell access={access}>
        <Alert>
          <AlertTitle>{t("Permission required")}</AlertTitle>
          <AlertDescription>{t("برای ثبت رکورد مالی به دسترسی مالی نیاز دارید.")}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("Finance / Invoices")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("ثبت رکورد مالی")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{t("Create a customer invoice or pre-invoice in تومان or USD, with quick customer creation when no matching user exists.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={"/admin/finance/invoices" as never}>
                <BackIcon className="size-4" />
                {t("Back to invoices")}
              </Link>
            </Button>
            <Button disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              {t("Create")}
            </Button>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
              <CardHeader><CardTitle>{t("Customer")}</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                  {t("Find existing customer")}
                  <Input onChange={(event) => setCustomerSearch(event.target.value)} placeholder={t("Search name, mobile, or email")} value={customerSearch} />
                </label>
                {selectedCustomer ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
                    <div>
                      <p><AdminUserLink userId={selectedCustomer.id}>{customerLabel(selectedCustomer)}</AdminUserLink></p>
                      <p className="text-muted-foreground">{[formatMobileDisplay(selectedCustomer.mobile), selectedCustomer.email].filter(Boolean).join(" · ")}</p>
                    </div>
                    <Button onClick={() => setSelectedCustomer(null)} size="sm" variant="outline">{t("Clear")}</Button>
                  </div>
                ) : customerResults.data?.length ? (
                  <div className="grid gap-2">
                    {customerResults.data.map((customer) => (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/45 p-3 text-sm hover:border-primary/50" key={customer.id}>
                        <div><AdminUserLink userId={customer.id}>{customerLabel(customer)}</AdminUserLink><span className="mt-1 block text-muted-foreground">{[formatMobileDisplay(customer.mobile), customer.email].filter(Boolean).join(" · ") || customer.id}</span></div>
                        <Button onClick={() => selectCustomer(customer)} size="sm" type="button" variant="outline">{t("Select")}</Button>
                      </div>
                    ))}
                  </div>
                ) : customerSearch.trim().length >= 2 && !customerResults.isLoading ? (
                  <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">{t("No matching customer. Fill the quick add fields below.")}</p>
                ) : null}

                {!selectedCustomer ? (
                  <div className="flex items-start gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/10 p-3 text-sm">
                    <UserPlus className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-semibold">{t("Quick add user")}</p>
                      <p className="mt-1 text-muted-foreground">{t("If no existing customer is selected, these fields create a user automatically and attach the invoice to that account. Mobile number is required.")}</p>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    {t("First name")}
                    <Input onChange={(event) => setFirstName(event.target.value)} value={firstName} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    {t("Last name")}
                    <Input onChange={(event) => setLastName(event.target.value)} value={lastName} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    {t("Mobile")}
                    <Input dir="ltr" onChange={(event) => setMobile(event.target.value)} placeholder="0912..." value={mobile} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium md:col-span-2">
                    {t("Email")}
                    <Input dir="ltr" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium md:col-span-2">
                    {t("Invoice address")}
                    <Textarea className="min-h-24" onChange={(event) => setAddress(event.target.value)} value={address} />
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>{t("Items")}</CardTitle>
                <Button onClick={() => setItems((current) => [...current, { ...emptyItem }])} size="sm" variant="outline">
                  <Plus className="size-4" />
                  {t("Add item")}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item, index) => (
                  <div className="grid gap-3 rounded-lg border border-border bg-background/35 p-3 md:grid-cols-[minmax(0,1fr)_88px_140px_40px]" key={index}>
                    <Input onChange={(event) => updateItem(index, "description", event.target.value, setItems)} placeholder={t("Description")} value={item.description} />
                    <Input min="1" onChange={(event) => updateItem(index, "quantity", event.target.value, setItems)} type="number" value={item.quantity} />
                    <Input min="0" onChange={(event) => updateItem(index, "unitPrice", event.target.value, setItems)} type="number" value={item.unitPrice} />
                    <Button disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} size="icon" variant="ghost">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader><CardTitle>{t("Invoice settings")}</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => setType("invoice")} variant={type === "invoice" ? "default" : "outline"}>{t("Invoice")}</Button>
                <Button onClick={() => setType("pre-invoice")} variant={type === "pre-invoice" ? "default" : "outline"}>{t("Pre-invoice")}</Button>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                {t("Currency")}
                <Select dir={dir} onValueChange={(value: CreateCustomInvoiceInput["currency"]) => setCurrency(value)} value={currency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOMAN">تومان</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("Status")}
                <Select dir={dir} onValueChange={(value: CreateCustomInvoiceInput["status"]) => setStatus(value)} value={status}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">{t("Pending")}</SelectItem>
                    <SelectItem value="DRAFT">{t("Draft")}</SelectItem>
                    <SelectItem value="PAID">{t("Paid")}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("Due date")}
                <Input onChange={(event) => setDueAt(event.target.value)} type="date" value={dueAt} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("Discount")}
                <Input min="0" onChange={(event) => setDiscount(event.target.value)} type="number" value={discount} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("Tax")}
                <Input min="0" onChange={(event) => setTax(event.target.value)} type="number" value={tax} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("Notes")}
                <Textarea className="min-h-24" onChange={(event) => setNotes(event.target.value)} value={notes} />
              </label>
              <div className="rounded-lg bg-background/45 p-4 text-sm">
                <AmountLine label={t("Subtotal")} value={formatAmount(totals.subtotal, currency)} />
                <AmountLine label={t("Discount")} value={formatAmount(toNumber(discount, 0), currency)} />
                <AmountLine label={t("Tax")} value={formatAmount(toNumber(tax, 0), currency)} />
                <AmountLine label={t("Total")} strong value={formatAmount(totals.total, currency)} />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminShell>
  );

  function selectCustomer(customer: AdminInvoiceCustomerOption) {
    setSelectedCustomer(customer);
    setFirstName(customer.profile?.firstName ?? "");
    setLastName(customer.profile?.lastName ?? "");
    setMobile(formatMobileDisplay(customer.mobile));
    setEmail(customer.email ?? "");
    setAddress(formatCustomerAddress(customer));
  }
}

function updateItem(index: number, key: keyof InvoiceItemForm, value: string, setItems: (updater: (current: InvoiceItemForm[]) => InvoiceItemForm[]) => void) {
  setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
}

function customerLabel(customer: AdminInvoiceCustomerOption) {
  const profileName = [customer.profile?.firstName, customer.profile?.lastName].filter(Boolean).join(" ");
  return profileName || formatMobileDisplay(customer.mobile) || customer.email || customer.id;
}

function formatCustomerAddress(customer: AdminInvoiceCustomerOption) {
  const address = customer.addresses?.[0];
  if (!address) return "";
  return [address.recipient, address.line1, address.line2, address.city, address.province, address.country, address.postalCode]
    .filter((part) => part && !["ir", "unknown"].includes(part.trim().toLowerCase()))
    .join(", ");
}

function toNumber(value: string | number, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatAmount(value: number, currency: CreateCustomInvoiceInput["currency"]) {
  return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
}

function AmountLine({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "font-semibold" : undefined}>{value}</span>
    </div>
  );
}

function InvoiceCreateSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <ShadowSkeleton className="h-[36rem]" />
    </div>
  );
}
