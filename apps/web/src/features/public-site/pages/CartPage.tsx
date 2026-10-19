"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Coins, CreditCard, FileText, Gift, Loader2, MapPin, Minus, Plus, ShieldCheck, ShoppingCart, Tag, Trash2, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { checkout, getCart, requestPayment, updateCartItem, validatePromotionCode, type CartItem, type CartSummary, type PromotionQuote } from "@/domains/commerce/commerce-api";
import { ProductImage } from "@/domains/catalog/ProductImage";
import { readReferralCheckoutAttribution } from "@/domains/referrals/referral-attribution";
import { useAuth } from "@/shared/auth/AuthProvider";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatTomanMoney, isTomanCurrency } from "@/shared/lib/toman-money";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Separator } from "@/shared/ui/separator";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { Footer } from "@/features/public-site/sections/Footer";
import { Header } from "@/features/silver-platform/components";
import { CustomerAddressManager } from "@/features/customer-dashboard/components/CustomerAddressManager";

type OrderPaymentMethod = "silver-wallet" | "wallet" | "zarinpal";

export function CartPage({ mode = "cart" }: { mode?: "cart" | "checkout" }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const { loading, user } = useAuth();
  const isCheckout = mode === "checkout";
  const currentPath = isCheckout ? "/checkout" : "/cart";
  const [accepted, setAccepted] = useState(!isCheckout);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [gateway, setGateway] = useState<OrderPaymentMethod>(() => defaultPaymentGateway());
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState<PromotionQuote | null>(null);
  const [useShoppingCredit, setUseShoppingCredit] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace(`/auth?redirect=${encodeURIComponent(currentPath)}`);
  }, [currentPath, loading, router, user]);

  useEffect(() => {
    setAccepted(!isCheckout);
  }, [isCheckout]);

  const cart = useQuery({
    enabled: Boolean(user),
    queryFn: () => getCart(),
    queryKey: ["commerce-cart"],
    retry: 1,
  });

  const update = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, quantity),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Cart update failed")),
    onSuccess: () => {
      setAppliedPromotion(null);
      if (typeof window !== "undefined") window.sessionStorage.removeItem("noghre:promotion-code");
      void queryClient.invalidateQueries({ queryKey: ["commerce-cart"] });
      toast.success(t("Cart updated."));
    },
  });

  const applyPromotion = useMutation({
    mutationFn: () => validatePromotionCode(promotionCode.trim()),
    onError: (error) => {
      setAppliedPromotion(null);
      toast.error(error instanceof Error ? error.message : t("Promotion code could not be applied."));
    },
    onSuccess: (quote) => {
      setAppliedPromotion(quote);
      setPromotionCode(quote.code);
      if (typeof window !== "undefined") window.sessionStorage.setItem("noghre:promotion-code", quote.code);
      toast.success(t("Promotion code applied."));
    },
  });

  useEffect(() => {
    if (!isCheckout || !cart.data?.items.length || promotionCode || appliedPromotion) return;
    const storedCode = window.sessionStorage.getItem("noghre:promotion-code");
    if (!storedCode) return;
    let active = true;
    setPromotionCode(storedCode);
    void validatePromotionCode(storedCode).then((quote) => {
      if (active) setAppliedPromotion(quote);
    }).catch(() => {
      window.sessionStorage.removeItem("noghre:promotion-code");
      if (active) setPromotionCode("");
    });
    return () => { active = false; };
  }, [appliedPromotion, cart.data?.items.length, isCheckout, promotionCode]);

  const pay = useMutation({
    mutationFn: async () => {
      const attempt = checkoutAttempt(cart.data?.id);
      const order = await checkout({
        ...readReferralCheckoutAttribution(),
        idempotencyKey: `checkout:${attempt.id}`,
        promotionCode: appliedPromotion?.code,
        useShoppingCredit,
      });
      const invoice = order.invoices?.[0];
      if (!invoice?.id) throw new Error(t("Checkout did not create an invoice."));
      const payment = await recoverablePaymentRequest(invoice.id, gateway || undefined, attempt);
      return { order, payment };
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t("Checkout failed");
      toast.error(message);
      if (message.includes("احراز هویت") || message.includes("KYC_REQUIRED")) router.push("/user/profile?kyc=required" as never);
    },
    onSuccess: ({ order, payment }) => {
      clearCheckoutAttempt();
      window.sessionStorage.removeItem("noghre:promotion-code");
      toast.success(t("Checkout created."));
      void queryClient.invalidateQueries({ queryKey: ["commerce-cart"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-product-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["wheel-rewards"] });
      if (payment.paymentUrl) {
        if (payment.paymentUrl.startsWith("http")) window.location.assign(payment.paymentUrl);
        else router.push(payment.paymentUrl as never);
        return;
      }
      router.push(`/user/product-orders?order=${encodeURIComponent(order.id)}` as never);
    },
  });

  const items = cart.data?.items ?? [];
  const requiresDeliveryAddress = Number(cart.data?.delivery?.unitCount ?? 0) > 0;
  const checkoutCustomerName = [user?.profile?.firstName, user?.profile?.lastName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");

  return (
    <main className="relative min-h-screen text-foreground">
      <SiteBackground />
      <Header />
      <section className="relative px-6 pb-24 pt-32">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
                <ShoppingCart className="size-3.5 text-primary" />
                {isCheckout ? t("Checkout") : t("Secure checkout")}
              </div>
              <h1 className="mt-4 font-display text-4xl font-black md:text-5xl">{isCheckout ? t("Checkout") : t("Cart")}</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {isCheckout ? t("Confirm silver products, review totals, create your order, and continue to payment.") : t("Review silver products, adjust quantities, and continue to checkout.")}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={"/products" as never}>
                {t("Continue shopping")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>

          {loading || cart.isLoading ? <ShadowSkeleton className="h-96 rounded-2xl" /> : null}
          {cart.isError ? (
            <Card className="rounded-2xl border-destructive/40 bg-card/70">
              <CardContent className="p-6 text-sm text-destructive">{cart.error.message}</CardContent>
            </Card>
          ) : null}

          {!loading && !cart.isLoading && !cart.isError ? (
            items.length ? (
              <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
                <div className="space-y-5">
                  {isCheckout ? <CheckoutSteps /> : null}
                  {isCheckout && cart.data ? <CheckoutDeliveryAddressCard cart={cart.data} onManage={() => setAddressDialogOpen(true)} /> : null}
                  <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
                    <CardHeader><CardTitle>{t("Items")}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {items.map((item) => (
                        <CartRow
                          item={item}
                          key={item.id}
                          lang={lang}
                          pending={update.isPending && update.variables?.itemId === item.id}
                          onQuantity={(quantity) => update.mutate({ itemId: item.id, quantity })}
                        />
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="rounded-2xl border-primary/20 bg-card/70">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wallet className="size-4 text-primary" />{t("Your balances")}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <SummaryRow label="Toman wallet balance" value={formatMoney(cart.data?.walletBalances?.toman ?? "0", "TOMAN", lang)} />
                      <SummaryRow label="Silver wallet balance" value={`${Number(cart.data?.walletBalances?.silverGrams ?? 0).toLocaleString(lang)} ${t("grams")}`} />
                    </CardContent>
                  </Card>
                  {isCheckout ? (
                    <>
                      <CheckoutAccount name={checkoutCustomerName} />
                      <PaymentGatewayPicker gateway={gateway} setGateway={setGateway} />
                    </>
                  ) : null}
                  <Card className="h-fit rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
                    <CardHeader><CardTitle>{isCheckout ? t("Checkout Summary") : t("Order Summary")}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 rounded-xl border border-border bg-background/35 p-3">
                        <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="promotion-code"><Tag className="size-4 text-primary" />{t("Promotion code")}</label>
                        <div className="flex gap-2">
                          <Input
                            className="font-mono uppercase"
                            id="promotion-code"
                            maxLength={40}
                            onChange={(event) => {
                              const value = event.target.value.toUpperCase();
                              setPromotionCode(value);
                              if (appliedPromotion?.code !== value.trim()) setAppliedPromotion(null);
                            }}
                            placeholder={t("Enter your code")}
                            value={promotionCode}
                          />
                          {appliedPromotion ? (
                            <Button aria-label={t("Remove promotion code")} onClick={() => { setAppliedPromotion(null); setPromotionCode(""); window.sessionStorage.removeItem("noghre:promotion-code"); }} size="icon" type="button" variant="outline"><X className="size-4" /></Button>
                          ) : (
                            <Button disabled={!promotionCode.trim() || applyPromotion.isPending} onClick={() => applyPromotion.mutate()} type="button" variant="outline">
                              {applyPromotion.isPending ? <Loader2 className="size-4 animate-spin" /> : t("Apply")}
                            </Button>
                          )}
                        </div>
                        {appliedPromotion ? (
                          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-6 text-emerald-700 dark:text-emerald-300">
                            <p className="flex items-center gap-2 font-semibold"><Gift className="size-4" />{appliedPromotion.name}</p>
                            <p>{promotionMessage(appliedPromotion, lang, t)}</p>
                          </div>
                        ) : null}
                      </div>
                      {isCheckout && Number(cart.data?.shoppingCredit?.balance ?? 0) > 0 ? (
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
                          <Checkbox checked={useShoppingCredit} onCheckedChange={(checked) => setUseShoppingCredit(Boolean(checked))} />
                          <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-semibold"><Wallet className="size-4 text-primary" />{t("Use shopping credit")}</span><span className="mt-1 block text-xs leading-6 text-muted-foreground">{formatMoney(cart.data?.shoppingCredit?.balance, "TOMAN", lang)} · {t("Purchase-only and non-withdrawable")}</span></span>
                        </label>
                      ) : null}
                      <SummaryRow label="Subtotal" value={formatMoney(cart.data?.subtotal, cart.data?.currency, lang)} />
                      <SummaryRow label="Tax" value={formatMoney("0", cart.data?.currency, lang)} />
                      <SummaryRow label="Discount" value={formatMoney(appliedPromotion?.discountAmount ?? "0", cart.data?.currency, lang)} />
                      {useShoppingCredit ? <SummaryRow label="Shopping credit" value={`− ${formatMoney(shoppingCreditApplied(cart.data?.shoppingCredit?.balance, cart.data?.subtotal, appliedPromotion?.discountAmount), cart.data?.currency, lang)}`} /> : null}
                      {cart.data?.delivery && Number(cart.data.delivery.feeToman) > 0 ? <SummaryRow label={`${t("Delivery fee")} · ${cart.data.delivery.unitCount.toLocaleString(lang)} ${t("products")}`} value={cart.data.delivery.source === "SILVER_WALLET" ? `${Number(cart.data.delivery.feeGrams).toLocaleString(lang)} ${t("grams")} · ${t("Paid from silver wallet")}` : cart.data.delivery.source === "TOMAN_WALLET" ? `${formatMoney(cart.data.delivery.feeToman, cart.data.currency, lang)} · ${t("Paid from toman wallet")}` : `${formatMoney(cart.data.delivery.feeToman, cart.data.currency, lang)} · ${t("Added to order payment")}`} /> : null}
                      <Separator />
                      <SummaryRow strong label="Total due" value={formatMoney(checkoutTotal(cart.data?.total, appliedPromotion?.discountAmount, useShoppingCredit ? cart.data?.shoppingCredit?.balance : undefined, cart.data?.subtotal), cart.data?.currency, lang)} />
                      <Button className="h-11 w-full" disabled={pay.isPending || update.isPending} onClick={() => {
                        if (!isCheckout) return router.push("/checkout");
                        if (requiresDeliveryAddress && !cart.data?.deliveryAddress) {
                          toast.error("برای ادامه پرداخت، ابتدا نشانی تحویل را ثبت یا انتخاب کنید.");
                          setAddressDialogOpen(true);
                          return;
                        }
                        if (user?.kycStatus !== "APPROVED") {
                          toast.error(t("Complete identity verification before paying for silver products."));
                          router.push("/user/profile?kyc=required" as never);
                          return;
                        }
                        setAccepted(false);
                        setConfirmationOpen(true);
                      }}>
                        {pay.isPending ? <Loader2 className="size-4 animate-spin" /> : isCheckout ? <CreditCard className="size-4" /> : <ArrowRight className="size-4 rtl:rotate-180" />}
                        {isCheckout ? t("Review and pay") : t("Continue to checkout")}
                      </Button>
                      <p className="text-xs leading-6 text-muted-foreground">{t("Checkout creates a real order and invoice from this cart, then starts the configured payment gateway.")}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
                <CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
                  <ShoppingCart className="size-12 text-muted-foreground" />
                  <h2 className="mt-4 text-2xl font-black">{t("Your cart is empty")}</h2>
                  <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">{t("Add products from the marketplace and return here to complete checkout.")}</p>
                  <Button asChild className="mt-5"><Link href={"/products" as never}>{t("Browse products")}</Link></Button>
                </CardContent>
              </Card>
            )
          ) : null}
        </div>
      </section>
      <Dialog onOpenChange={setAddressDialogOpen} open={addressDialogOpen}>
        <DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-5xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">انتخاب یا ثبت نشانی تحویل</DialogTitle>
            <DialogDescription>کد پستی را وارد کنید تا نشانی به‌صورت خودکار از جیبیت دریافت شود، یا یکی از نشانی‌های ذخیره‌شده را انتخاب کنید.</DialogDescription>
          </DialogHeader>
          <CustomerAddressManager
            onAddressChanged={() => { void queryClient.invalidateQueries({ queryKey: ["commerce-cart"] }); }}
            onAddressSelected={async () => {
              await queryClient.invalidateQueries({ queryKey: ["commerce-cart"] });
              setAddressDialogOpen(false);
            }}
            selectedAddressId={cart.data?.deliveryAddress?.id}
          />
        </DialogContent>
      </Dialog>
      {isCheckout && cart.data ? <CheckoutConfirmationDialog accepted={accepted} cart={cart.data} gateway={gateway} lang={lang} onAcceptedChange={setAccepted} onConfirm={() => { setConfirmationOpen(false); pay.mutate(); }} onOpenChange={(open) => { setConfirmationOpen(open); if (!open) setAccepted(false); }} open={confirmationOpen} paying={pay.isPending} promotionDiscount={appliedPromotion?.discountAmount} shoppingCredit={useShoppingCredit ? cart.data.shoppingCredit?.balance : undefined} /> : null}
      <Footer />
    </main>
  );
}

function CheckoutDeliveryAddressCard({ cart, onManage }: { cart: CartSummary; onManage: () => void }) {
  const address = cart.deliveryAddress;
  return (
    <Card className={`rounded-2xl bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)] ${address ? "border-primary/30" : "border-amber-500/50"}`} dir="rtl">
      <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-5 text-primary" />نشانی تحویل</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {address ? (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-center gap-2"><CheckCircle2 className="size-5 text-emerald-600" /><p className="font-bold">{address.label || "نشانی منتخب"}</p></div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{[address.province, address.city, address.line1, address.line2].filter(Boolean).join("، ")}</p>
            <p className="mt-1 text-xs text-muted-foreground">کد پستی: <span dir="ltr">{address.postalCode ?? "—"}</span>{address.recipient ? ` · ${address.recipient}` : ""}</p>
          </div>
        ) : <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-800 dark:text-amber-200">برای ارسال سفارش هنوز نشانی انتخاب نشده است. پیش از پرداخت، نشانی را با کد پستی ثبت کنید.</p>}
        <Button className="w-full" onClick={onManage} type="button" variant={address ? "outline" : "default"}><MapPin className="size-4" />{address ? "تغییر نشانی تحویل" : "ثبت یا انتخاب نشانی"}</Button>
      </CardContent>
    </Card>
  );
}

function CheckoutConfirmationDialog({ accepted, cart, gateway, lang, onAcceptedChange, onConfirm, onOpenChange, open, paying, promotionDiscount, shoppingCredit }: { accepted: boolean; cart: CartSummary; gateway: OrderPaymentMethod; lang: string; onAcceptedChange: (value: boolean) => void; onConfirm: () => void; onOpenChange: (open: boolean) => void; open: boolean; paying: boolean; promotionDiscount?: string; shoppingCredit?: string }) {
  const t = (text: string) => translateUiText(text, lang);
  const address = cart.deliveryAddress;
  const addressText = address ? [address.province, address.city, address.line1, address.line2, address.postalCode ? `${t("Postal code")}: ${address.postalCode}` : undefined].filter(Boolean).join("، ") : t("No default delivery address is registered.");
  const paymentLabel = gateway === "zarinpal" ? t("Zarinpal") : gateway === "wallet" ? t("Toman wallet") : t("Silver wallet");
  const finalTotal = checkoutTotal(cart.total, promotionDiscount, shoppingCredit, cart.subtotal);
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl" dir={lang === "fa" ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="text-xl">{t("Final order confirmation")}</DialogTitle>
          <DialogDescription>{t("Review every cost before the order and payment are created.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <section className="space-y-3 rounded-2xl border border-border p-4">
            <h3 className="font-bold">{t("Product details and quantities")}</h3>
            {cart.items.map((item) => <ConfirmationProduct item={item} key={item.id} lang={lang} />)}
          </section>
          <section className="space-y-2 rounded-2xl border border-border bg-muted/25 p-4">
            <SummaryRow label="Subtotal" value={formatMoney(cart.subtotal, cart.currency, lang)} />
            {Number(promotionDiscount ?? 0) > 0 ? <SummaryRow label="Discount" value={`− ${formatMoney(promotionDiscount, cart.currency, lang)}`} /> : null}
            {Number(shoppingCredit ?? 0) > 0 ? <SummaryRow label="Shopping credit" value={`− ${formatMoney(shoppingCreditApplied(shoppingCredit, cart.subtotal, promotionDiscount), cart.currency, lang)}`} /> : null}
            {cart.delivery && Number(cart.delivery.feeToman) > 0 ? <SummaryRow label="Delivery fee" value={cart.delivery.source === "SILVER_WALLET" ? `${Number(cart.delivery.feeGrams).toLocaleString(lang)} ${t("grams")}` : formatMoney(cart.delivery.feeToman, cart.currency, lang)} /> : null}
            <Separator />
            <SummaryRow strong label="Total due" value={formatMoney(finalTotal, cart.currency, lang)} />
          </section>
          <section className="rounded-2xl border border-border p-4 text-sm">
            <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="font-bold">{t("Delivery address")}</p><p className="mt-1 leading-7 text-muted-foreground">{addressText}</p>{address?.recipient ? <p className="mt-1 text-xs text-muted-foreground">{address.recipient}{address.phone ? ` · ${address.phone}` : ""}</p> : null}{!address ? <Button asChild className="mt-2 px-0" size="sm" variant="link"><Link href="/user/account/addresses">{t("Manage addresses")}</Link></Button> : null}</div></div>
          </section>
          <SummaryRow label="Payment method" value={paymentLabel} />
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-7"><Checkbox checked={accepted} onCheckedChange={(checked) => onAcceptedChange(Boolean(checked))} /><span>{t("I confirm that I reviewed the products, costs, delivery address, and payment method.")}</span></label>
        </div>
        <DialogFooter className="gap-2 sm:gap-0"><Button onClick={() => onOpenChange(false)} type="button" variant="outline">{t("Cancel")}</Button><Button disabled={!accepted || paying} onClick={onConfirm} type="button">{paying ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}{t("Confirm order and continue to payment")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmationProduct({ item, lang }: { item: CartItem; lang: string }) {
  const t = (text: string) => translateUiText(text, lang);
  const title = typeof item.product.title === "string" ? item.product.title : item.product.title[lang] ?? item.product.title.fa ?? item.product.title.en ?? item.product.slug;
  const quantity = Number(item.quantity) || 1;
  const detail = (label: string, value?: string, suffix = "") => Number(value ?? 0) > 0 ? <SummaryRow label={label} value={`${suffix}${formatMoney(value, item.currency, lang)}`} /> : null;
  return <div className="space-y-2 rounded-xl bg-background/60 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{t("Quantity")}: {quantity.toLocaleString(lang)}</p></div><strong>{formatMoney(Number(item.unitPrice) * quantity, item.currency, lang)}</strong></div>{item.metadata?.weightGramsTotal ? <SummaryRow label="Total silver weight" value={`${Number(item.metadata.weightGramsTotal).toLocaleString(lang)} ${t("grams")}`} /> : null}{detail("Silver metal value", item.metadata?.metalAmountTotal)}{detail("Silver purchase fee", item.metadata?.silverFeeAmountTotal)}{detail("Making fee", item.metadata?.makingFeeTomanTotal)}{detail("Commission", item.metadata?.productFeeAmountTotal)}{detail("Insurance cost", item.metadata?.insuranceAmountTotal)}</div>;
}

function promotionMessage(quote: PromotionQuote, lang: string, t: (text: string) => string) {
  if (quote.rewardType === "SILVER_WALLET") return `${Number(quote.walletCreditAmount).toLocaleString(lang)} ${t("grams of silver will be credited after successful payment.")}`;
  if (quote.rewardType === "TOMAN_WALLET") return `${Number(quote.walletCreditAmount).toLocaleString(lang)} ${t("Toman will be credited to your wallet after successful payment.")}`;
  return `${formatMoney(quote.discountAmount, quote.currency, lang)} ${t("discount applied to this order.")}`;
}

function CheckoutSteps() {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const steps = [
    { icon: ShoppingCart, label: "Cart reviewed", value: "Silver products and quantities" },
    { icon: FileText, label: "Invoice prepared", value: "Order and invoice are created on payment" },
    { icon: CreditCard, label: "Payment request", value: "Wallet or Zarinpal payment route" },
  ];
  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardContent className="grid gap-3 p-4 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div className="rounded-xl border border-border bg-background/35 p-4" key={step.label}>
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
                <p className="font-semibold">{t(step.label)}</p>
              </div>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{t(step.value)}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CheckoutAccount({ name }: { name?: string | null }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" />{t("Billing Account")}</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <SummaryRow label="Customer name" value={name || t("Signed in customer")} />
        <SummaryRow label="Delivery" value={t("Dashboard purchases")} />
        <SummaryRow label="Invoice" value={t("Generated after checkout")} />
      </CardContent>
    </Card>
  );
}

function PaymentGatewayPicker({ gateway, setGateway }: { gateway: OrderPaymentMethod; setGateway: (value: OrderPaymentMethod) => void }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const options = [
    { description: "Uses Zarinpal for secure online payment.", icon: CreditCard, label: "Zarinpal", value: "zarinpal" as const },
    { description: "Pays immediately from your Toman wallet balance.", icon: Wallet, label: "Toman wallet", value: "wallet" as const },
    { description: "Pays the product invoice from your available silver balance.", icon: Coins, label: "Silver wallet", value: "silver-wallet" as const },
  ] satisfies Array<{ description: string; icon: typeof CreditCard; label: string; value: OrderPaymentMethod }>;
  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader><CardTitle>{t("Payment Route")}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {options.map((option) => {
          const Icon = option.icon;
          const active = gateway === option.value;
          return (
            <button
              aria-pressed={active}
              className={active ? "w-full rounded-xl border-2 border-blue-500 bg-blue-500/15 p-3 text-start text-blue-950 shadow-sm ring-2 ring-blue-500/20 dark:text-blue-50" : "w-full rounded-xl border-2 border-border bg-background/35 p-3 text-start transition hover:border-blue-400/70 hover:bg-blue-500/5"}
              key={option.label}
              onClick={() => setGateway(option.value)}
              type="button"
            >
              <span className="flex items-start gap-3">
                <span className={active ? "grid size-9 place-items-center rounded-lg bg-blue-600 text-white" : "grid size-9 place-items-center rounded-lg bg-background/70 text-primary"}><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{t(option.label)}</span>
                    {active ? <span className="flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300"><CheckCircle2 className="size-4" />{t("Selected")}</span> : null}
                  </span>
                  <span className="mt-1 block text-xs leading-6 text-muted-foreground">{t(option.description)}</span>
                </span>
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CartRow({ item, lang, onQuantity, pending }: { item: CartItem; lang: string; onQuantity: (quantity: number) => void; pending: boolean }) {
  const t = (text: string) => translateUiText(text, lang);
  const title = typeof item.product.title === "string" ? item.product.title : item.product.title[lang] ?? item.product.title.fa ?? item.product.title.en ?? item.product.slug;
  const quantity = Number(item.quantity) || 1;
  const stockQuantity = Math.max(0, Math.trunc(Number(item.product.stockQuantity ?? 0)));
  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-background/35 p-4 md:grid-cols-[5rem_1fr_auto] md:items-center">
      <div className="aspect-square overflow-hidden rounded-xl border border-border bg-white">
        <ProductImage alt={title} imageClassName="p-1" src={item.product.images?.[0]?.url} />
      </div>
      <div className="min-w-0">
        <Link className="text-base font-bold hover:text-primary" href={`/products/${item.product.slug}` as never}>
          {title}
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.product.shortDescription ?? t("Physical silver product")}</p>
        <p className="mt-2 text-sm font-semibold">{formatMoney(item.unitPrice, item.currency, lang)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("Stock")}: {stockQuantity.toLocaleString(lang)}</p>
        {item.metadata?.weightGrams ? <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-5"><span>{t("Weight")}: {Number(item.metadata.weightGrams).toLocaleString(lang)} {t("grams")}</span><span>{t("Silver fee")}: {item.metadata.silverFeePercent ?? 0}٪</span><span>{t("Making fee")}: {formatMoney(item.metadata.makingFeeToman ?? 0, item.currency, lang)}</span><span>{t("Commission")}: {item.metadata.productFeePercent ?? 0}٪</span><span>{t("Product insurance")}: {item.metadata.insurancePercent ?? 0}٪</span></div> : null}
      </div>
      <div className="flex items-center gap-2">
        <Button disabled={pending} onClick={() => onQuantity(Math.max(0, quantity - 1))} size="icon" variant="outline" aria-label={t("Decrease quantity")}>
          {quantity <= 1 ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
        </Button>
        <span className="grid h-9 min-w-11 place-items-center rounded-lg border border-border bg-background/50 text-sm font-semibold">{quantity}</span>
        <Button disabled={pending || quantity >= stockQuantity} onClick={() => onQuantity(quantity + 1)} size="icon" variant="outline" aria-label={t("Increase quantity")}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <div className={strong ? "flex items-center justify-between text-base font-black" : "flex items-center justify-between text-sm"}>
      <span className="text-muted-foreground">{t(label)}</span>
      <span>{value}</span>
    </div>
  );
}

function formatMoney(value?: string | number, currency = "USD", lang = "fa") {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  if (isTomanCurrency(currency)) return formatTomanMoney(safeAmount, currency, lang === "fa" ? "fa-IR" : lang);
  return new Intl.NumberFormat(lang === "fa" ? "fa-IR" : lang, { currency, style: "currency" }).format(safeAmount);
}

function shoppingCreditApplied(balance?: string, subtotal?: string, promotionDiscount?: string) {
  return Math.max(0, Math.min(Number(balance ?? 0), Number(subtotal ?? 0) - Number(promotionDiscount ?? 0))).toFixed(2);
}

function checkoutTotal(total?: string, promotionDiscount?: string, shoppingBalance?: string, subtotal?: string) {
  const promotion = Number(promotionDiscount ?? 0);
  const credit = shoppingBalance ? Number(shoppingCreditApplied(shoppingBalance, subtotal, promotionDiscount)) : 0;
  return Math.max(0, Number(total ?? 0) - promotion - credit).toFixed(2);
}

function defaultPaymentGateway(): OrderPaymentMethod {
  return "zarinpal";
}

const CHECKOUT_ATTEMPT_KEY = "noghre:checkout-attempt";
const IN_PROGRESS_PAYMENT_STATUSES = new Set(["CREATED", "PENDING", "PROCESSING", "VERIFYING"]);
const RETRYABLE_PAYMENT_POLL_DELAYS_MS = [150, 300, 600];

interface CheckoutAttempt {
  cartId?: string;
  id: string;
  paymentAttempt: number;
}

function checkoutAttempt(cartId?: string): CheckoutAttempt {
  const existing = readCheckoutAttempt();
  if (existing && existing.cartId === cartId) return existing;
  const created = { cartId, id: crypto.randomUUID(), paymentAttempt: 1 };
  saveCheckoutAttempt(created);
  return created;
}

async function recoverablePaymentRequest(invoiceId: string, gateway: OrderPaymentMethod | undefined, attempt: CheckoutAttempt) {
  let payment = await requestPayment(
    { gateway, invoiceId },
    { idempotencyKey: paymentIdempotencyKey(attempt) },
  );

  for (const delayMs of RETRYABLE_PAYMENT_POLL_DELAYS_MS) {
    if (payment.paymentUrl || !IN_PROGRESS_PAYMENT_STATUSES.has(payment.status)) break;
    await delay(delayMs);
    payment = await requestPayment(
      { gateway, invoiceId },
      { idempotencyKey: paymentIdempotencyKey(attempt) },
    );
  }

  if (!payment.paymentUrl && ["FAILED", "CANCELLED", "EXPIRED"].includes(payment.status)) {
    const nextAttempt = { ...attempt, paymentAttempt: attempt.paymentAttempt + 1 };
    saveCheckoutAttempt(nextAttempt);
    payment = await requestPayment(
      { gateway, invoiceId },
      { idempotencyKey: paymentIdempotencyKey(nextAttempt) },
    );
  }

  if (!payment.paymentUrl && IN_PROGRESS_PAYMENT_STATUSES.has(payment.status)) {
    throw new Error("درخواست پرداخت هنوز در حال آماده‌سازی است. لطفاً چند لحظه دیگر دوباره تلاش کنید.");
  }
  if (!payment.paymentUrl && ["FAILED", "CANCELLED", "EXPIRED"].includes(payment.status)) {
    throw new Error("درخواست پرداخت آماده نشد. لطفاً دوباره تلاش کنید.");
  }
  return payment;
}

function paymentIdempotencyKey(attempt: CheckoutAttempt) {
  return `payment:${attempt.id}:${attempt.paymentAttempt}`;
}

function readCheckoutAttempt(): CheckoutAttempt | undefined {
  try {
    const value = window.sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY);
    if (!value) return undefined;
    const parsed = JSON.parse(value) as Partial<CheckoutAttempt>;
    if (
      typeof parsed.id !== "string"
      || !/^[0-9a-f-]{36}$/i.test(parsed.id)
      || !Number.isInteger(parsed.paymentAttempt)
      || Number(parsed.paymentAttempt) < 1
    ) return undefined;
    return { cartId: parsed.cartId, id: parsed.id, paymentAttempt: Number(parsed.paymentAttempt) };
  } catch {
    return undefined;
  }
}

function saveCheckoutAttempt(attempt: CheckoutAttempt) {
  window.sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify(attempt));
}

function clearCheckoutAttempt() {
  window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
