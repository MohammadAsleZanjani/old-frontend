"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Apple,
  ArrowLeft,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  RotateCcw,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User as UserIcon,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { oauthClient, platformAuth, type OAuthProvider } from "@/shared/auth/platform-auth-client";
import { readReferralAttribution } from "@/domains/referrals/referral-attribution";
import { useAuth } from "@/shared/auth/AuthProvider";
import {
  formatMobileDisplay,
  isValidIranianMobile,
  normalizeIranianMobileInput,
  normalizeOtpInput,
  toCanonicalIranianMobile,
  toLatinDigits,
} from "@/shared/lib/phone-format";
import { BrandLogo } from "@/shared/ui/brand-logo";

type Mode = "password" | "register" | "sms" | "email" | "forgot" | "reset";
const USER_DASHBOARD_PATH = "/user";
const MOBILE_VALIDATION_MESSAGE = "شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.";
const OTP_VALIDATION_MESSAGE = "کد تأیید باید دقیقاً ۶ رقم باشد.";

export function AuthExperience() {
  const searchParams = useSearchParams();
  const { refreshUser, user } = useAuth();
  const [mode, setMode] = useState<Mode>("password");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);

  useEffect(() => {
    let active = true;
    void oauthClient.getProviders().then((result) => {
      if (active) setOauthProviders(result.data?.providers ?? []);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (platformAuth.completeSessionFromUrl(searchParams)) {
      void refreshUser().then(() => window.location.assign(USER_DASHBOARD_PATH));
    }
  }, [refreshUser, searchParams]);

  useEffect(() => {
    if (user) window.location.assign(USER_DASHBOARD_PATH);
  }, [user]);

  useEffect(() => {
    const linkedCode = searchParams.get("ref") ?? searchParams.get("referral") ?? readReferralAttribution()?.code;
    if (linkedCode) setReferralCode(linkedCode.toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    if (!otpExpiresAt) {
      setSecondsRemaining(0);
      return;
    }
    const tick = () => {
      const expiresAt = new Date(otpExpiresAt).getTime();
      setSecondsRemaining(Number.isFinite(expiresAt) ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : 0);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [otpExpiresAt]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = validateSubmission({ email, firstName, identifier, lastName, mobile, mode, otpCode, otpSent, password });
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    try {
      if (mode === "password") {
        const result = await platformAuth.signInWithPassword({ identifier: normalizeLoginIdentifier(identifier), password });
        if (result.error) throw result.error;
        if (result.data && "twoFactorRequired" in result.data) {
          setMessage("کد تأیید دو مرحله‌ای ارسال شد.");
          setOtpIdentifier(result.data.identifier);
          setOtpExpiresAt(result.data.expiresAt);
          if (result.data.channel === "SMS") setMobile(formatMobileDisplay(result.data.identifier));
          if (result.data.channel === "EMAIL") setEmail(result.data.identifier);
          setMode(result.data.channel === "SMS" ? "sms" : "email");
          setOtpSent(true);
        } else {
          await refreshUser();
          window.location.assign(USER_DASHBOARD_PATH);
        }
      }
      if (mode === "register") {
        const capturedAttribution = readReferralAttribution();
        const enteredReferralCode = referralCode.trim().toUpperCase();
        const selectedReferralCode = enteredReferralCode || capturedAttribution?.code;
        const result = await platformAuth.signUp({
          confirmPassword: password,
          firstName,
          lastName,
          locale: "fa",
          mobile: toCanonicalIranianMobile(mobile),
          password,
          referralClickId: capturedAttribution && capturedAttribution.code === selectedReferralCode ? capturedAttribution.clickId : undefined,
          referralCode: selectedReferralCode,
          timezone: "Asia/Tehran",
        });
        if (result.error) throw result.error;
        const normalizedMobile = toCanonicalIranianMobile(mobile);
        const otpResult = await platformAuth.requestSmsOtp({ mobile: normalizedMobile, purpose: "LOGIN" });
        if (otpResult.error) throw otpResult.error;
        setOtpCode("");
        setOtpIdentifier(normalizedMobile);
        setOtpExpiresAt(otpResult.data?.expiresAt ?? new Date(Date.now() + 120_000).toISOString());
        setOtpSent(true);
        setMode("sms");
        setMessage("ثبت‌نام انجام شد. برای فعال‌سازی شماره موبایل، کد پیامکی را وارد کنید.");
      }
      if (mode === "sms") {
        if (!otpSent) {
          const normalizedMobile = toCanonicalIranianMobile(mobile);
          const result = await platformAuth.requestSmsOtp({ mobile: normalizedMobile, purpose: "LOGIN" });
          if (result.error) throw result.error;
          setOtpCode("");
          setOtpIdentifier(normalizedMobile);
          setOtpExpiresAt(result.data?.expiresAt ?? new Date(Date.now() + 120_000).toISOString());
          setOtpSent(true);
          setMessage("کد پیامکی ارسال شد.");
        } else {
          const result = await platformAuth.verifyOtp({ channel: "SMS", code: otpCode, identifier: otpIdentifier, purpose: "LOGIN" });
          if (result.error) throw result.error;
          await refreshUser();
          window.location.assign(USER_DASHBOARD_PATH);
        }
      }
      if (mode === "email") {
        if (!otpSent) {
          const normalizedEmail = email.trim().toLowerCase();
          const result = await platformAuth.requestEmailOtp({ email: normalizedEmail, purpose: "LOGIN" });
          if (result.error) throw result.error;
          setOtpCode("");
          setOtpIdentifier(normalizedEmail);
          setOtpExpiresAt(result.data?.expiresAt ?? new Date(Date.now() + 120_000).toISOString());
          setOtpSent(true);
          setMessage("کد ایمیلی ارسال شد.");
        } else {
          const result = await platformAuth.verifyOtp({ channel: "EMAIL", code: otpCode, identifier: otpIdentifier, purpose: "LOGIN" });
          if (result.error) throw result.error;
          await refreshUser();
          window.location.assign(USER_DASHBOARD_PATH);
        }
      }
      if (mode === "forgot") {
        const normalizedMobile = toCanonicalIranianMobile(mobile);
        if (!otpSent) {
          const result = await platformAuth.requestSmsOtp({ mobile: normalizedMobile, purpose: "PASSWORD_RESET" });
          if (result.error) throw result.error;
          setOtpCode("");
          setOtpIdentifier(normalizedMobile);
          setOtpExpiresAt(result.data?.expiresAt ?? new Date(Date.now() + 120_000).toISOString());
          setOtpSent(true);
          setMessage("کد بازیابی رمز عبور ارسال شد.");
        } else {
          const result = await platformAuth.verifyOtp({ channel: "SMS", code: otpCode, identifier: otpIdentifier, purpose: "PASSWORD_RESET" });
          if (result.error) throw result.error;
          if (!result.data || "accessToken" in result.data || !result.data.resetToken) throw new Error("توکن بازیابی رمز دریافت نشد.");
          setResetToken(result.data.resetToken);
          setOtpSent(false);
          setOtpCode("");
          setMode("reset");
          setMessage("کد تأیید شد. اکنون رمز عبور جدید را تعیین کنید.");
        }
      }
      if (mode === "reset") {
        if (password !== confirmPassword) throw new Error("رمز عبور و تکرار آن یکسان نیستند.");
        const result = await platformAuth.resetPassword({ password, token: resetToken });
        if (result.error) throw result.error;
        setIdentifier(formatMobileDisplay(otpIdentifier || mobile));
        setPassword("");
        setConfirmPassword("");
        setResetToken("");
        setMode("password");
        setMessage("رمز عبور با موفقیت تغییر کرد. اکنون وارد شوید.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "درخواست با خطا روبه‌رو شد.");
    } finally {
      setBusy(false);
    }
  }

  function changeMode(next: Mode) {
    setMode(next);
    setOtpSent(false);
    setOtpCode("");
    setOtpIdentifier("");
    setOtpExpiresAt(null);
    setConfirmPassword("");
    setResetToken("");
    setError("");
    setMessage("");
  }

  async function resendOtp() {
    if (!otpSent || secondsRemaining > 0 || resending) return;
    setResending(true);
    setError("");
    setMessage("");
    try {
      const result = mode === "forgot"
        ? await platformAuth.requestSmsOtp({ mobile: otpIdentifier, purpose: "PASSWORD_RESET" })
        : mode === "sms"
          ? await platformAuth.requestSmsOtp({ mobile: otpIdentifier, purpose: "LOGIN" })
          : await platformAuth.requestEmailOtp({ email: otpIdentifier, purpose: "LOGIN" });
      if (result.error) throw result.error;
      setOtpCode("");
      setOtpExpiresAt(result.data?.expiresAt ?? new Date(Date.now() + 120_000).toISOString());
      setMessage(mode === "email" ? "کد ایمیلی جدید ارسال شد." : "کد پیامکی جدید ارسال شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارسال دوباره کد انجام نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setResending(false);
    }
  }

  function changeOtpDestination() {
    setOtpSent(false);
    setOtpCode("");
    setOtpIdentifier("");
    setOtpExpiresAt(null);
    setError("");
    setMessage("");
  }

  const isRegister = mode === "register";
  const title = isRegister ? "ساخت حساب جدید" : mode === "forgot" ? "بازیابی رمز عبور" : "خوش آمدید";
  const lead = isRegister
    ? "در کمتر از یک دقیقه حساب نقره بسازید و وارد بازار نقره شوید."
    : mode === "forgot"
      ? "شماره موبایل خود را وارد کنید تا کد بازیابی ارسال شود."
      : "برای ادامه وارد کیف پول و داشبورد نقره شوید.";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6 lg:py-0">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute -top-40 -start-40 h-[520px] w-[520px] rounded-full bg-gradient-gold opacity-20 blur-[140px]" />
        <div className="absolute -bottom-40 -end-40 h-[520px] w-[520px] rounded-full bg-gradient-silver opacity-20 blur-[140px]" />
        <div className="absolute inset-0 opacity-25 dot-grid" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden min-h-[640px] flex-col justify-between overflow-hidden rounded-[2rem] border border-border bg-foreground/[0.025] p-10 backdrop-blur lg:flex">
          <div className="absolute inset-0 -z-10 opacity-50 dot-grid" />
          <div className="absolute -top-32 -end-32 h-80 w-80 rounded-full bg-gradient-gold opacity-30 blur-3xl" />

          <div>
            <Link href="/" aria-label="بازگشت به صفحه اصلی">
              <BrandLogo priority className="h-28 w-28" />
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              حساب کاربری نقره
            </div>
            <h2 className="mt-8 text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
              <span className="text-gradient-gold">نقره</span>
              <br />
              <span className="text-foreground">حساب امن شما</span>
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
              با خیال آسوده وارد شوید، دارایی خود را ببینید و همه خریدها، فروش‌ها و درخواست‌های تحویل را از یک حساب امن پیگیری کنید.
            </p>
          </div>

          <div className="relative space-y-3">
            {[
              { d: "محافظت از ورود و اطلاع‌رسانی فعالیت‌های مهم", i: Shield, t: "امنیت حساب" },
              { d: "ورود با رمز عبور یا کد تأیید یک‌بارمصرف", i: Zap, t: "ورود آسان و مطمئن" },
              { d: "مشاهده دارایی، سفارش‌ها و وضعیت تحویل در یک نگاه", i: Sparkles, t: "پیگیری شفاف" },
            ].map((item) => (
              <div key={item.t} className="flex items-center gap-4 rounded-2xl border border-border bg-background/40 p-4 backdrop-blur">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-gold shadow-glow">
                  <item.i className="h-5 w-5 text-gold-foreground" />
                </div>
                <div>
                  <div className="font-semibold">{item.t}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{item.d}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="relative mx-auto w-full max-w-md lg:mx-0">
          <div className="relative rounded-[2rem] border border-border bg-background/65 p-7 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-60" style={{ background: "linear-gradient(135deg, transparent 0%, color-mix(in oklab, var(--gold) 9%, transparent) 50%, transparent 100%)" }} />

            <div className="relative z-10 mb-6 flex items-center justify-between">
              <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur transition hover:border-gold/40 hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> بازگشت به خانه
              </Link>
              <div className="rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs font-bold text-gold">ورود امن</div>
            </div>

            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-metallic shadow-elegant">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-black">{title}</h1>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">{lead}</p>
                </div>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-background/45 p-1">
                <button type="button" onClick={() => changeMode("password")} className={`rounded-xl py-2 text-sm font-bold transition ${!isRegister && mode !== "forgot" ? "bg-gradient-gold text-gold-foreground shadow-elegant" : "text-muted-foreground hover:text-foreground"}`}>
                  ورود
                </button>
                <button type="button" onClick={() => changeMode("register")} className={`rounded-xl py-2 text-sm font-bold transition ${isRegister ? "bg-gradient-gold text-gold-foreground shadow-elegant" : "text-muted-foreground hover:text-foreground"}`}>
                  ثبت‌نام
                </button>
              </div>

              {!isRegister && mode !== "forgot" ? (
                <div className="mb-5 grid grid-cols-3 gap-2">
                  {[
                    ["password", "رمز عبور"],
                    ["sms", "پیامک"],
                    ["email", "ایمیل"],
                  ].map(([key, label]) => (
                    <button key={key} type="button" onClick={() => changeMode(key as Mode)} className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${mode === key ? "border-gold/50 bg-gold/10 text-gold" : "border-border bg-background/35 text-muted-foreground hover:text-foreground"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}

              {error ? <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
              {message ? <div className="mb-4 rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-success">{message}</div> : null}

              <form onSubmit={submit} className="grid gap-3">
                {mode === "password" ? (
                  <>
                    <Field icon={UserIcon} label="ایمیل یا موبایل">
                      <input autoComplete="username" value={identifier} onChange={(event) => setIdentifier(toLatinDigits(event.target.value))} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" placeholder="you@example.com یا 09121234567" />
                    </Field>
                    <Field icon={Lock} label="رمز عبور">
                      <input value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" placeholder="حداقل ۸ کاراکتر" type={showPassword ? "text" : "password"} />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </Field>
                    <button type="button" onClick={() => changeMode("forgot")} className="justify-self-start text-xs font-bold text-gold hover:text-foreground">
                      رمز را فراموش کرده‌اید؟
                    </button>
                  </>
                ) : null}

                {mode === "register" ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field icon={UserIcon} label="نام">
                        <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="نام" />
                      </Field>
                      <Field icon={UserIcon} label="نام خانوادگی">
                        <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="نام خانوادگی" />
                      </Field>
                    </div>
                    <Field icon={Smartphone} label="شماره موبایل">
                      <input autoComplete="tel" dir="ltr" inputMode="numeric" maxLength={11} value={mobile} onChange={(event) => setMobile(normalizeIranianMobileInput(event.target.value))} className="w-full bg-transparent text-sm outline-none" placeholder="09121234567" />
                    </Field>
                    <Field icon={UserIcon} label="کد معرف (اختیاری)">
                      <input dir="ltr" value={referralCode} onChange={(event) => setReferralCode(event.target.value.toUpperCase())} className="w-full bg-transparent text-sm outline-none" placeholder="REFERRAL" />
                    </Field>
                    <Field icon={Lock} label="رمز عبور">
                      <input value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="حداقل ۸ کاراکتر" type={showPassword ? "text" : "password"} />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </Field>
                  </>
                ) : null}

                {mode === "sms" || mode === "forgot" ? (
                  <>
                    <Field icon={Smartphone} label="شماره موبایل">
                      <input autoComplete="tel" dir="ltr" inputMode="numeric" maxLength={11} readOnly={otpSent} value={mobile} onChange={(event) => setMobile(normalizeIranianMobileInput(event.target.value))} className="w-full bg-transparent text-sm outline-none read-only:opacity-70" placeholder="09121234567" />
                    </Field>
                    {otpSent ? (
                      <Field icon={Clock} label="کد تایید">
                        <input autoComplete="one-time-code" dir="ltr" inputMode="numeric" value={otpCode} onChange={(event) => setOtpCode(normalizeOtpInput(event.target.value))} className="w-full bg-transparent text-sm tracking-[0.35em] outline-none" maxLength={6} placeholder="••••••" />
                      </Field>
                    ) : null}
                  </>
                ) : null}

                {mode === "reset" ? (
                  <>
                    <Field icon={Lock} label="رمز عبور جدید">
                      <input autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="حداقل ۸ کاراکتر" type={showPassword ? "text" : "password"} />
                    </Field>
                    <Field icon={Lock} label="تکرار رمز عبور جدید">
                      <input autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="تکرار رمز عبور" type={showPassword ? "text" : "password"} />
                    </Field>
                  </>
                ) : null}

                {mode === "email" ? (
                  <>
                    <Field icon={Mail} label="ایمیل">
                      <input autoComplete="email" readOnly={otpSent} type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-transparent text-sm outline-none read-only:opacity-70" placeholder="you@example.com" />
                    </Field>
                    {otpSent ? (
                      <Field icon={Clock} label="کد تایید">
                        <input autoComplete="one-time-code" dir="ltr" inputMode="numeric" value={otpCode} onChange={(event) => setOtpCode(normalizeOtpInput(event.target.value))} className="w-full bg-transparent text-sm tracking-[0.35em] outline-none" maxLength={6} placeholder="••••••" />
                      </Field>
                    ) : null}
                  </>
                ) : null}

                {otpSent && (mode === "sms" || mode === "email" || mode === "forgot") ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/35 px-3 py-2 text-xs">
                    <span className="text-muted-foreground">
                      {secondsRemaining > 0 ? `امکان ارسال مجدد تا ${formatCountdown(secondsRemaining)}` : "کد را دریافت نکردید؟"}
                    </span>
                    <button
                      type="button"
                      disabled={secondsRemaining > 0 || resending || busy}
                      onClick={() => void resendOtp()}
                      className="inline-flex shrink-0 items-center gap-1.5 font-bold text-gold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      ارسال مجدد کد
                    </button>
                  </div>
                ) : null}

                <button disabled={busy} className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold text-sm font-black text-gold-foreground shadow-elegant transition hover:shadow-glow disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {buttonLabel(mode, otpSent)}
                </button>
                {mode === "register" ? (
                  <p className="text-center text-[11px] leading-6 text-muted-foreground">
                    با ثبت‌نام، مطالعه و پذیرش{" "}
                    <Link className="font-bold text-gold transition hover:text-foreground" href="/terms" target="_blank">
                      قوانین و مقررات نقره‌لند
                    </Link>{" "}
                    را تأیید می‌کنید.
                  </p>
                ) : null}
              </form>

              {oauthProviders.length > 0 ? <>
                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  یا ادامه با
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className={`grid gap-3 ${oauthProviders.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {oauthProviders.includes("google") ? <button onClick={() => void oauthClient.signInWithOAuth("google", { redirectTo: USER_DASHBOARD_PATH })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background/35 text-sm font-bold transition hover:border-gold/40">
                    <Mail className="h-4 w-4" /> گوگل
                  </button> : null}
                  {oauthProviders.includes("apple") ? <button onClick={() => void oauthClient.signInWithOAuth("apple", { redirectTo: USER_DASHBOARD_PATH })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background/35 text-sm font-bold transition hover:border-gold/40">
                    <Apple className="h-4 w-4" /> اپل
                  </button> : null}
                </div>
              </> : null}
              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-border bg-background/30 p-3 text-xs text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                اطلاعات ورود و فعالیت‌های حساس حساب شما با کنترل‌های امنیتی محافظت می‌شوند.
              </div>
              <div className="mt-3 rounded-xl border border-gold/25 bg-gold/10 p-3 text-xs leading-6 text-muted-foreground">
                نقره هرگز رمز عبور یا کد تأیید شما را از طریق تماس، پیامک یا شبکه‌های اجتماعی درخواست نمی‌کند.
              </div>
              {otpSent && (mode === "sms" || mode === "email") ? (
                <button type="button" onClick={changeOtpDestination} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-gold">
                  <RotateCcw className="h-3.5 w-3.5" /> {mode === "sms" ? "تغییر شماره موبایل" : "تغییر ایمیل"}
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ children, icon: Icon, label }: { children: React.ReactNode; icon: LucideIcon; label: string }) {
  return (
    <label className="group block rounded-2xl border border-border bg-background/45 px-4 py-3 transition focus-within:border-gold/60 focus-within:bg-background/70">
      <span className="mb-2 flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-gold" /> {label}
      </span>
      <span className="flex items-center gap-2">{children}</span>
    </label>
  );
}

function buttonLabel(mode: Mode, otpSent: boolean) {
  if (mode === "register") return "ثبت‌نام";
  if (mode === "forgot") return otpSent ? "تأیید کد بازیابی" : "ارسال کد بازیابی";
  if (mode === "reset") return "ثبت رمز عبور جدید";
  if (mode === "sms" || mode === "email") return otpSent ? "تایید کد و ورود" : "ارسال کد";
  return "ورود";
}

function validateSubmission(input: {
  email: string;
  firstName: string;
  identifier: string;
  lastName: string;
  mobile: string;
  mode: Mode;
  otpCode: string;
  otpSent: boolean;
  password: string;
}) {
  if (input.mode === "password") {
    const identifier = input.identifier.trim();
    if (!identifier) return "ایمیل یا شماره موبایل را وارد کنید.";
    if (isMobileLike(identifier) && !isValidIranianMobile(identifier)) return MOBILE_VALIDATION_MESSAGE;
    if (input.password.length < 8) return "رمز عبور باید حداقل ۸ نویسه باشد.";
  }
  if (input.mode === "register") {
    if (input.firstName.trim().length < 2) return "نام باید حداقل ۲ حرف باشد.";
    if (input.lastName.trim().length < 2) return "نام خانوادگی باید حداقل ۲ حرف باشد.";
    if (!isValidIranianMobile(input.mobile)) return MOBILE_VALIDATION_MESSAGE;
    if (input.email.trim() && !isValidEmail(input.email)) return "یک ایمیل معتبر وارد کنید.";
    if (input.password.length < 8) return "رمز عبور باید حداقل ۸ نویسه باشد.";
  }
  if (input.mode === "sms" || input.mode === "forgot") {
    if (!isValidIranianMobile(input.mobile)) return MOBILE_VALIDATION_MESSAGE;
  }
  if (input.mode === "reset" && input.password.length < 8) return "رمز عبور جدید باید حداقل ۸ نویسه باشد.";
  if (input.mode === "email" && !isValidEmail(input.email)) return "یک ایمیل معتبر وارد کنید.";
  if (input.otpSent && (input.mode === "sms" || input.mode === "email" || input.mode === "forgot") && !/^\d{6}$/.test(input.otpCode)) {
    return OTP_VALIDATION_MESSAGE;
  }
  return null;
}

function normalizeLoginIdentifier(value: string) {
  const normalized = toLatinDigits(value).trim();
  return isMobileLike(normalized) ? toCanonicalIranianMobile(normalized) : normalized.toLowerCase();
}

function isMobileLike(value: string) {
  return /^[+\d\s()-]+$/.test(toLatinDigits(value).trim());
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const remainder = Math.max(0, seconds) % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);
}
