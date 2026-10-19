"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddresses,
  updateCustomerAddress,
  type CustomerAddressItem,
} from "@/features/customer-dashboard/api/customer-dashboard-api";
import { getPostalAddress } from "@/features/silver-platform/api";
import { useAuth } from "@/shared/auth/AuthProvider";
import { formatMobileDisplay, normalizeIranianMobileInput, toLatinDigits } from "@/shared/lib/phone-format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

export function CustomerAddressManager({ onAddressChanged, onAddressSelected, selectedAddressId }: {
  onAddressChanged?: () => void;
  onAddressSelected?: (address: CustomerAddressItem) => Promise<void> | void;
  selectedAddressId?: string | null;
} = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const defaultRecipient = useMemo(() => [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(" "), [user?.profile?.firstName, user?.profile?.lastName]);
  const [postalCode, setPostalCode] = useState("");
  const [label, setLabel] = useState("نشانی تحویل");
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [phone, setPhone] = useState(formatMobileDisplay(user?.mobile));
  const [line2, setLine2] = useState("");
  const addresses = useQuery({ queryFn: () => getCustomerAddresses(), queryKey: ["customer-addresses"], retry: 1 });
  const postalLookup = useQuery({
    enabled: postalCode.length === 10,
    queryFn: () => getPostalAddress(postalCode),
    queryKey: ["postal-address", postalCode],
    retry: false,
    staleTime: 30 * 24 * 60 * 60 * 1_000,
  });

  useEffect(() => {
    if (!recipient && defaultRecipient) setRecipient(defaultRecipient);
  }, [defaultRecipient, recipient]);

  useEffect(() => {
    if (!phone && user?.mobile) setPhone(formatMobileDisplay(user.mobile));
  }, [phone, user?.mobile]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
    onAddressChanged?.();
  };
  const select = useMutation({
    mutationFn: (address: CustomerAddressItem) => updateCustomerAddress(address.id, { isDefault: true }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "انتخاب نشانی انجام نشد."),
    onSuccess: async (address) => {
      await refresh();
      toast.success("نشانی تحویل انتخاب شد.");
      await onAddressSelected?.(address);
    },
  });
  const remove = useMutation({
    mutationFn: (address: CustomerAddressItem) => deleteCustomerAddress(address.id),
    onError: (error) => toast.error(error instanceof Error ? error.message : "حذف نشانی انجام نشد."),
    onSuccess: async () => {
      await refresh();
      toast.success("نشانی حذف شد.");
    },
  });
  const save = useMutation({
    mutationFn: () => {
      if (!postalLookup.data) throw new Error("ابتدا کد پستی معتبر را وارد کنید تا نشانی از جیبیت دریافت شود.");
      return createCustomerAddress({
        city: postalLookup.data.district?.trim() || postalLookup.data.province,
        country: "ایران",
        isDefault: true,
        label: label.trim() || "نشانی تحویل",
        line1: postalLookup.data.address,
        line2: line2.trim() || undefined,
        phone: normalizeIranianMobileInput(phone),
        postalCode: postalLookup.data.postalCode,
        province: postalLookup.data.province,
        recipient: recipient.trim(),
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "ثبت نشانی انجام نشد."),
    onSuccess: async (address) => {
      setPostalCode("");
      setLabel("نشانی تحویل");
      setLine2("");
      await refresh();
      toast.success("نشانی با موفقیت ثبت و برای تحویل انتخاب شد.");
      await onAddressSelected?.(address);
    },
  });

  const addressReady = postalLookup.data?.postalCode === postalCode;
  const canSave = Boolean(addressReady && recipient.trim() && /^09\d{9}$/.test(normalizeIranianMobileInput(phone)));

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]" dir="rtl">
      <Card className="rounded-2xl border-border bg-card/70">
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-5 text-primary" />نشانی‌های ذخیره‌شده</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {addresses.isLoading ? <div className="flex min-h-28 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div> : null}
          {addresses.isError ? <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{addresses.error.message}</p> : null}
          {!addresses.isLoading && !addresses.isError && !addresses.data?.length ? <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">هنوز نشانی تحویلی ثبت نشده است.</p> : null}
          {addresses.data?.map((address) => {
            const active = address.isDefault || address.id === selectedAddressId;
            return (
              <div className={`rounded-xl border p-4 transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-background/35"}`} key={address.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{address.label}</p>{address.isDefault ? <Badge>نشانی منتخب</Badge> : null}</div>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{[address.province, address.city, address.line1, address.line2].filter(Boolean).join("، ")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">کد پستی: <span dir="ltr">{address.postalCode ?? "—"}</span>{address.recipient ? ` · ${address.recipient}` : ""}{address.phone ? ` · ${formatMobileDisplay(address.phone)}` : ""}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button disabled={select.isPending || address.isDefault} onClick={() => select.mutate(address)} size="sm" type="button" variant={address.isDefault ? "secondary" : "outline"}>
                      {select.isPending && select.variables?.id === address.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                      {address.isDefault ? "انتخاب‌شده" : "انتخاب"}
                    </Button>
                    <Button aria-label="حذف نشانی" disabled={remove.isPending} onClick={() => {
                      if (window.confirm("آیا از حذف این نشانی مطمئن هستید؟")) remove.mutate(address);
                    }} size="icon" type="button" variant="outline"><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="h-fit rounded-2xl border-primary/25 bg-card/70">
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-5 text-primary" />ثبت نشانی جدید</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" htmlFor="delivery-postal-code">کد پستی ۱۰ رقمی</label>
            <Input autoComplete="postal-code" dir="ltr" id="delivery-postal-code" inputMode="numeric" maxLength={10} onChange={(event) => setPostalCode(toLatinDigits(event.target.value).replace(/\D/g, "").slice(0, 10))} placeholder="1234567890" value={postalCode} />
          </div>
          {postalLookup.isFetching ? <p className="flex items-center gap-2 text-sm text-primary"><Loader2 className="size-4 animate-spin" />در حال دریافت خودکار نشانی از جیبیت…</p> : null}
          {postalLookup.isError ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{postalLookup.error.message}</p> : null}
          {addressReady && postalLookup.data ? (
            <div className="space-y-2 rounded-xl border border-emerald-500/35 bg-emerald-500/5 p-3">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-4" />نشانی از جیبیت دریافت و تأیید شد</p>
              <Input readOnly value={postalLookup.data.province} />
              <Input readOnly value={postalLookup.data.district ?? postalLookup.data.province} />
              <Textarea className="min-h-24" readOnly value={postalLookup.data.address} />
            </div>
          ) : <p className="text-xs leading-6 text-muted-foreground">با تکمیل ۱۰ رقم کد پستی، استان، شهر و نشانی به‌صورت خودکار از جیبیت وارد می‌شود.</p>}
          <Input onChange={(event) => setLabel(event.target.value)} placeholder="عنوان نشانی، مثلاً منزل" value={label} />
          <Input onChange={(event) => setRecipient(event.target.value)} placeholder="نام و نام خانوادگی تحویل‌گیرنده" value={recipient} />
          <Input dir="ltr" inputMode="tel" onChange={(event) => setPhone(normalizeIranianMobileInput(event.target.value))} placeholder="09121234567" value={phone} />
          <Textarea className="min-h-20" onChange={(event) => setLine2(event.target.value)} placeholder="پلاک، واحد یا توضیحات تکمیلی (اختیاری)" value={line2} />
          <Button className="w-full" disabled={!canSave || save.isPending} onClick={() => save.mutate()} type="button">
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
            ثبت و انتخاب این نشانی
          </Button>
          {phone && !/^09\d{9}$/.test(normalizeIranianMobileInput(phone)) ? <p className="text-xs text-destructive">شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
