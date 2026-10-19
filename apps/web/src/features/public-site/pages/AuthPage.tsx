"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Mail, Lock, User as UserIcon, Eye, EyeOff, Sparkles,
  ArrowRight, CheckCircle2, Loader2, Shield, Zap, ArrowLeft,
  Smartphone, KeyRound, Clock, RotateCcw, ShieldCheck,
} from "lucide-react";
import { oauthClient, platformAuth, type OAuthProvider } from "@/shared/auth/platform-auth-client";
import { useAuth } from "@/shared/auth/AuthProvider";
import { languageLabel, useI18n } from "@/shared/i18n";
import { formatMobileDisplay } from "@/shared/lib/date-format";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { toast } from "@/shared/ui/sonner";
import { Sun, Moon, Globe } from "lucide-react";

const COPY = {
  fa: {
    backHome: "بازگشت به خانه",
    eyebrow: "حساب کاربری ستایش",
    titleIn: "خوش آمدید",
    titleUp: "ساخت حساب جدید",
    leadIn: "برای ادامه وارد حساب خود شوید.",
    leadUp: "در کمتر از ۳۰ ثانیه عضو خانواده ستایش شوید.",
    tabIn: "ورود", tabUp: "ثبت‌نام",
    email: "ایمیل", emailPh: "you@company.com",
    mobile: "شماره موبایل", mobilePh: "09121234567",
    pass: "رمز عبور", passPh: "حداقل ۸ کاراکتر",
    otpMethod: "کد پیامکی", passwordMethod: "رمز عبور",
    username: "ایمیل یا موبایل", usernamePh: "you@company.com یا 09121234567",
    show: "نمایش", hide: "پنهان",
    forgot: "رمز را فراموش کرده‌اید؟",
    inBtn: "ورود به حساب", upBtn: "ساخت حساب",
    sendOtp: "ارسال کد تایید",
    otp: "کد تایید",
    otpLead: "کد ارسال‌شده را وارد کنید.",
    otpTitle: "تایید شماره موبایل",
    otpSentTo: "کد ۶ رقمی به این شماره ارسال شد",
    otpHint: "برای امنیت حساب، کد را با کسی به اشتراک نگذارید.",
    otpTimer: "ارسال مجدد تا",
    otpExpired: "کد منقضی شد. می‌توانید کد جدید بگیرید.",
    resendOtp: "ارسال مجدد کد",
    changeMobile: "تغییر شماره",
    otpBtn: "تایید و ورود",
    completeTitle: "تکمیل حساب کاربری",
    completeLead: "برای فعال‌سازی کامل حساب، اطلاعات پایه را وارد کنید.",
    firstName: "نام", firstNamePh: "حمیدرضا",
    lastName: "نام خانوادگی", lastNamePh: "شفیعی",
    idCardNo: "کد ملی / شناسه اختیاری", idCardNoPh: "اختیاری",
    confirmPass: "تکرار رمز عبور",
    finishProfile: "تکمیل و ادامه",
    country: "کشور",
    iranMobileHint: "می‌توانید شماره را به صورت 09121234567 وارد کنید.",
    loading: "لطفاً صبر کنید...",
    or: "یا ادامه با",
    google: "ورود با گوگل", apple: "ورود با اپل",
    successIn: "خوش آمدید!", successUp: "حساب با موفقیت ساخته شد.",
    terms: "با ثبت‌نام، شرایط استفاده و حریم خصوصی ستایش را می‌پذیرم.",
    perks: [
      { i: Shield, t: "امنیت سازمانی", d: "TUV آلمان · ISO 9001" },
      { i: Zap, t: "پشتیبانی سریع", d: "میانگین پاسخ < ۲ ساعت" },
      { i: Sparkles, t: "+۱۵ سال تجربه", d: "+۶٬۴۲۰ پروژه موفق" },
    ],
    errors: {
      email: "ایمیل معتبر وارد کنید",
      mobile: "شماره موبایل معتبر وارد کنید",
      otp: "کد تایید باید ۶ رقم باشد",
      pass: "رمز عبور باید حداقل ۸ کاراکتر باشد",
      confirmPass: "رمز عبور و تکرار آن یکسان نیستند",
      firstName: "نام را وارد کنید",
      idCardNo: "کد ملی / شناسه را وارد کنید",
      lastName: "نام خانوادگی را وارد کنید",
    },
  },
  en: {
    backHome: "Back to home",
    eyebrow: "Setayesh account",
    titleIn: "Welcome back",
    titleUp: "Create your account",
    leadIn: "Sign in to continue to your dashboard.",
    leadUp: "Join the Setayesh family in under 30 seconds.",
    tabIn: "Sign in", tabUp: "Sign up",
    email: "Email", emailPh: "you@company.com",
    mobile: "Mobile number", mobilePh: "+989121234567",
    pass: "Password", passPh: "At least 8 characters",
    otpMethod: "SMS code", passwordMethod: "Password",
    username: "Email or mobile", usernamePh: "you@company.com or +989121234567",
    show: "Show", hide: "Hide",
    forgot: "Forgot your password?",
    inBtn: "Sign in", upBtn: "Create account",
    sendOtp: "Send verification code",
    otp: "Verification code",
    otpLead: "Enter the code we sent you.",
    otpTitle: "Verify your mobile number",
    otpSentTo: "We sent a 6-digit code to",
    otpHint: "For account security, never share this code with anyone.",
    otpTimer: "Resend available in",
    otpExpired: "The code expired. You can request a new one.",
    resendOtp: "Resend code",
    changeMobile: "Change number",
    otpBtn: "Verify and sign in",
    completeTitle: "Complete your account",
    completeLead: "Add the required profile details to activate your account.",
    firstName: "First name", firstNamePh: "Jane",
    lastName: "Last name", lastNamePh: "Doe",
    idCardNo: "ID card number (optional)", idCardNoPh: "Optional",
    confirmPass: "Confirm password",
    finishProfile: "Complete and continue",
    country: "Country",
    iranMobileHint: "Select a country code. International format is required outside Farsi mode.",
    loading: "Please wait...",
    or: "Or continue with",
    google: "Continue with Google", apple: "Continue with Apple",
    successIn: "Welcome back!", successUp: "Account created successfully.",
    terms: "By signing up, I agree to Setayesh's Terms and Privacy Policy.",
    perks: [
      { i: Shield, t: "Enterprise security", d: "TUV Germany · ISO 9001" },
      { i: Zap, t: "Fast support", d: "Avg. response < 2h" },
      { i: Sparkles, t: "15+ years experience", d: "6,420+ shipped projects" },
    ],
    errors: {
      email: "Please enter a valid email",
      mobile: "Please enter a valid mobile number",
      otp: "Verification code must be 6 digits",
      pass: "Password must be at least 8 characters",
      confirmPass: "Password confirmation does not match",
      firstName: "First name is required",
      idCardNo: "ID number is required",
      lastName: "Last name is required",
    },
  },
  ar: {
    backHome: "العودة للرئيسية",
    eyebrow: "حساب ستايش",
    titleIn: "أهلاً بعودتك",
    titleUp: "إنشاء حساب جديد",
    leadIn: "سجّل دخولك للمتابعة.",
    leadUp: "انضم لعائلة ستايش في أقل من 30 ثانية.",
    tabIn: "دخول", tabUp: "تسجيل",
    email: "البريد الإلكتروني", emailPh: "you@company.com",
    mobile: "رقم الجوال", mobilePh: "+989121234567",
    pass: "كلمة المرور", passPh: "8 أحرف على الأقل",
    otpMethod: "رمز SMS", passwordMethod: "كلمة المرور",
    username: "البريد أو الجوال", usernamePh: "you@company.com أو +989121234567",
    show: "إظهار", hide: "إخفاء",
    forgot: "نسيت كلمة المرور؟",
    inBtn: "دخول", upBtn: "إنشاء حساب",
    sendOtp: "إرسال رمز التحقق",
    otp: "رمز التحقق",
    otpLead: "أدخل الرمز الذي أرسلناه.",
    otpTitle: "تحقق من رقم الجوال",
    otpSentTo: "أرسلنا رمزاً من 6 أرقام إلى",
    otpHint: "لأمان الحساب، لا تشارك هذا الرمز مع أي شخص.",
    otpTimer: "إعادة الإرسال بعد",
    otpExpired: "انتهت صلاحية الرمز. يمكنك طلب رمز جديد.",
    resendOtp: "إعادة إرسال الرمز",
    changeMobile: "تغيير الرقم",
    otpBtn: "تحقق وادخل",
    completeTitle: "إكمال الحساب",
    completeLead: "أضف بيانات الملف المطلوبة لتفعيل حسابك.",
    firstName: "الاسم الأول", firstNamePh: "محمد",
    lastName: "اسم العائلة", lastNamePh: "علي",
    idCardNo: "رقم الهوية (اختياري)", idCardNoPh: "اختياري",
    confirmPass: "تأكيد كلمة المرور",
    finishProfile: "إكمال ومتابعة",
    country: "الدولة",
    iranMobileHint: "اختر رمز الدولة. الصيغة الدولية مطلوبة خارج وضع الفارسية.",
    loading: "يرجى الانتظار...",
    or: "أو تابع باستخدام",
    google: "متابعة بجوجل", apple: "متابعة بآبل",
    successIn: "أهلاً بعودتك!", successUp: "تم إنشاء الحساب بنجاح.",
    terms: "بالتسجيل، أوافق على الشروط وسياسة الخصوصية.",
    perks: [
      { i: Shield, t: "أمان مؤسسي", d: "TUV ألمانيا · ISO 9001" },
      { i: Zap, t: "دعم سريع", d: "متوسط الرد < ساعتين" },
      { i: Sparkles, t: "+15 سنة خبرة", d: "+6,420 مشروع" },
    ],
    errors: {
      email: "بريد صحيح مطلوب",
      mobile: "رقم جوال صحيح مطلوب",
      otp: "رمز التحقق يجب أن يكون 6 أرقام",
      pass: "كلمة المرور 8 أحرف على الأقل",
      confirmPass: "تأكيد كلمة المرور غير مطابق",
      firstName: "الاسم الأول مطلوب",
      idCardNo: "رقم الهوية مطلوب",
      lastName: "اسم العائلة مطلوب",
    },
  },
};

const COUNTRY_OPTIONS = [
  { code: "+98", flag: "🇮🇷", label: "Iran" },
  { code: "+971", flag: "🇦🇪", label: "UAE" },
  { code: "+90", flag: "🇹🇷", label: "Turkey" },
  { code: "+964", flag: "🇮🇶", label: "Iraq" },
  { code: "+1", flag: "🇺🇸", label: "US / Canada" },
  { code: "+44", flag: "🇬🇧", label: "UK" },
] as const;

export function AuthPage({ redirectTo = "/" }: { redirectTo?: string }) {
  const { lang, languages, setLang, theme, toggleTheme } = useI18n();
  const c = COPY[lang as keyof typeof COPY] ?? COPY.fa;
  const [langOpen, setLangOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [mode, setMode] = useState<"in" | "up">("in");
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");
  const [form, setForm] = useState({
    confirmPassword: "",
    email: "",
    firstName: "",
    identifier: "",
    idCardNo: "",
    lastName: "",
    mobile: "",
    password: "",
  });
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRY_OPTIONS)[number]>(COUNTRY_OPTIONS[0]);
  const [completeForm, setCompleteForm] = useState({
    confirmPassword: "",
    email: "",
    firstName: "",
    idCardNo: "",
    lastName: "",
    mobile: "",
    password: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [otpChallenge, setOtpChallenge] = useState<null | { channel: "EMAIL" | "SMS"; expiresAt: string; identifier: string }>(null);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const mobileForRequest = useMemo(() => buildMobileForRequest(form.mobile, selectedCountry, lang), [form.mobile, lang, selectedCountry]);
  const completionMobile = useMemo(() => buildMobileForRequest(completeForm.mobile || user?.mobile || "", selectedCountry, lang), [completeForm.mobile, lang, selectedCountry, user?.mobile]);
  const maskedOtpIdentifier = useMemo(() => maskIdentifier(otpChallenge?.identifier ?? mobileForRequest), [mobileForRequest, otpChallenge?.identifier]);
  const otpProgress = otpChallenge ? Math.max(0, Math.min(100, (secondsRemaining / 120) * 100)) : 0;
  const requiresProfileCompletion = Boolean(user?.profileCompletionRequired);

  useEffect(() => {
    let active = true;
    void oauthClient.getProviders().then((result) => {
      if (active) setOauthProviders(result.data?.providers ?? []);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (platformAuth.completeSessionFromUrl(new URLSearchParams(searchParams.toString()))) {
      const cleanUrl = redirectTo ? `/auth?redirect=${encodeURIComponent(redirectTo)}` : "/auth";
      window.history.replaceState(null, "", cleanUrl);
      return;
    }
    if (!authLoading && user && !user.profileCompletionRequired) router.push(redirectTo as never);
  }, [user, authLoading, redirectTo, router, searchParams]);

  useEffect(() => {
    if (!user) return;
    setCompleteForm((current) => ({
      ...current,
      email: current.email || user.email || "",
      firstName: current.firstName || user.profile?.firstName || "",
      idCardNo: current.idCardNo || user.profile?.idCardNo || "",
      lastName: current.lastName || user.profile?.lastName || "",
      mobile: current.mobile || formatMobileDisplay(user.mobile),
    }));
  }, [user]);

  useEffect(() => {
    if (!otpChallenge?.expiresAt) {
      setSecondsRemaining(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(otpChallenge.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [otpChallenge?.expiresAt]);

  const schema = mode === "up"
    ? z.object({
        firstName: z.string().trim().min(1, c.errors.firstName).max(80),
        lastName: z.string().trim().min(1, c.errors.lastName).max(80),
        email: z.string().trim().max(255).optional(),
        password: z.string().min(8, c.errors.pass).max(200),
        confirmPassword: z.string().min(8, c.errors.pass).max(200),
      })
    : z.object({
        identifier: z.string().trim().min(1, c.errors.email).max(255),
        password: z.string().min(8, c.errors.pass).max(200),
      });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpChallenge) {
      if (!/^[0-9]{6}$/.test(otpCode)) {
        setErrors({ otp: c.errors.otp });
        return;
      }
      setErrors({});
      setLoading(true);
      try {
        const { error } = await platformAuth.verifyOtp({
          channel: otpChallenge.channel,
          code: otpCode,
          identifier: otpChallenge.identifier,
          purpose: "LOGIN",
        });
        if (error) throw error;
        const nextUser = await refreshUser();
        toast.success(nextUser?.profileCompletionRequired ? c.completeTitle : c.successIn);
        if (!nextUser?.profileCompletionRequired) router.push(redirectTo as never);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "خطایی رخ داد";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "in" && authMethod === "otp") {
      if (!isValidMobileForLang(form.mobile, selectedCountry, lang)) {
        setErrors({ mobile: c.errors.mobile });
        return;
      }
      await requestOtpCode(mobileForRequest, "initial");
      return;
    }

    const r = schema.safeParse(form);
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach(i => { e[String(i.path[0])] = i.message; });
      setErrors(e);
      return;
    }
    if (mode === "up") {
      const nextErrors: Record<string, string> = {};
      if (!isValidMobileForLang(form.mobile, selectedCountry, lang)) nextErrors.mobile = c.errors.mobile;
      if (form.email.trim() && !z.string().email().safeParse(form.email.trim()).success) nextErrors.email = c.errors.email;
      if (form.password !== form.confirmPassword) nextErrors.confirmPassword = c.errors.confirmPass;
      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        return;
      }
    }
    setErrors({});
    setLoading(true);

    try {
      if (mode === "in") {
        const { data, error } = await platformAuth.signInWithPassword({
          identifier: normalizeIdentifierForRequest(form.identifier || form.email, selectedCountry, lang), password: form.password,
        });
        if (error) throw error;
        if (data && "twoFactorRequired" in data) {
          setOtpChallenge({ channel: data.channel, expiresAt: data.expiresAt, identifier: data.identifier });
          toast.success(c.otpLead);
          return;
        }
        const nextUser = await refreshUser();
        toast.success(nextUser?.profileCompletionRequired ? c.completeTitle : c.successIn);
        if (!nextUser?.profileCompletionRequired) router.push(redirectTo as never);
      } else {
        const { error } = await platformAuth.signUp({
          confirmPassword: form.confirmPassword,
          firstName: form.firstName.trim(),
          idCardNo: form.idCardNo.trim(),
          lastName: form.lastName.trim(),
          locale: lang || "fa",
          mobile: mobileForRequest,
          password: form.password,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tehran",
        });
        if (error) throw error;
        const otpResult = await platformAuth.requestSmsOtp({ mobile: mobileForRequest, purpose: "LOGIN" });
        if (otpResult.error) throw otpResult.error;
        setOtpChallenge({ channel: "SMS", expiresAt: otpResult.data?.expiresAt ?? new Date(Date.now() + 120_000).toISOString(), identifier: mobileForRequest });
        toast.success("حساب ساخته شد. برای فعال‌سازی، کد پیامکی را وارد کنید.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطایی رخ داد";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const result = await oauthClient.signInWithOAuth(provider, {
        redirectTo,
      });
      if (result.error) {
        toast.error(result.error.message || `${provider} sign-in failed`);
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      router.push(redirectTo as never);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OAuth error";
      toast.error(msg);
      setLoading(false);
    }
  };

  const requestOtpCode = async (mobile: string, intent: "initial" | "resend") => {
    setErrors({});
    if (intent === "initial") setLoading(true);
    else setResending(true);
    try {
      const { data, error } = await platformAuth.requestSmsOtp({ mobile, purpose: "LOGIN" });
      if (error) throw error;
      setOtpCode("");
      setOtpChallenge({ channel: "SMS", expiresAt: data?.expiresAt ?? new Date(Date.now() + 120_000).toISOString(), identifier: mobile });
      toast.success(c.otpLead);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطایی رخ داد";
      toast.error(msg);
    } finally {
      if (intent === "initial") setLoading(false);
      else setResending(false);
    }
  };

  const changeOtpMobile = () => {
    setOtpChallenge(null);
    setOtpCode("");
    setErrors({});
  };

  const submitCompleteProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!completeForm.firstName.trim()) nextErrors.firstName = c.errors.firstName;
    if (!completeForm.lastName.trim()) nextErrors.lastName = c.errors.lastName;
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const { error } = await platformAuth.updateProfile({
        firstName: completeForm.firstName.trim(),
        lastName: completeForm.lastName.trim(),
        locale: lang || "fa",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tehran",
      });
      if (error) throw error;
      await refreshUser();
      toast.success(c.successIn);
      router.push("/user/account/profile" as never);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطایی رخ داد";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-foreground">
      <SiteBackground />

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -start-40 h-[520px] w-[520px] rounded-full bg-gradient-gold opacity-25 blur-[140px]" />
        <div className="absolute -bottom-40 -end-40 h-[520px] w-[520px] rounded-full opacity-20 blur-[140px]"
          style={{ background: "radial-gradient(closest-side, oklch(0.55 0.18 290 / 0.6), transparent 70%)" }} />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-0">
        {/* Left — brand panel */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col justify-between rounded-[2rem] border border-border bg-foreground/[0.02] p-10 min-h-[640px] overflow-hidden relative"
        >
          <div className="absolute inset-0 -z-10 opacity-50 dot-grid" />
          <div className="absolute -top-32 -end-32 h-80 w-80 rounded-full bg-gradient-gold opacity-30 blur-3xl" />

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {c.eyebrow}
            </div>
            <h2 className="mt-8 text-5xl xl:text-6xl font-black tracking-tight leading-[1.05]">
              <span className="bg-gradient-gold bg-clip-text text-transparent">Setayesh</span>
              <br /><span className="text-foreground">OS · v15.0</span>
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground leading-relaxed">
              {mode === "in" ? c.leadIn : c.leadUp}
            </p>
          </div>

          <div className="space-y-3 relative">
            {c.perks.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-background/40 p-4 backdrop-blur"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-gold shadow-[0_0_30px_-8px_var(--glow)] shrink-0">
                  <p.i className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold">{p.t}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.d}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.aside>

        {/* Right — form */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="relative w-full max-w-md mx-auto lg:mx-0"
        >
          <div className="relative rounded-[2rem] border border-border bg-background/60 p-7 sm:p-10 backdrop-blur-xl shadow-2xl">
            {/* shimmer ring */}
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-60"
              style={{ background: "linear-gradient(135deg, transparent 0%, color-mix(in oklab, var(--primary) 8%, transparent) 50%, transparent 100%)" }} />

            {/* Card header — back + lang + theme */}
            <div className="relative z-30 flex items-center justify-between mb-6">
              <Link href="/"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 backdrop-blur px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {c.backHome}
              </Link>
              <div className="relative z-40 flex items-center gap-2">
                <div className="relative z-50">
                  <button
                    onClick={() => setLangOpen(o => !o)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background/40 backdrop-blur px-3 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span className="uppercase font-mono">{lang}</span>
                  </button>
                  {langOpen && (
                    <div onMouseLeave={() => setLangOpen(false)} className="absolute end-0 z-50 mt-2 w-32 glass rounded-lg border border-border p-1 shadow-2xl">
                      {languages.map(language => (
                        <button
                          key={language.code}
                          onClick={() => { setLang(language.code); setLangOpen(false); }}
                          className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs hover:bg-foreground/5 ${language.code === lang ? "text-primary" : "text-foreground"}`}
                        >
                          <span>{languageLabel(language)}</span>
                          <span className="font-mono opacity-60 uppercase">{language.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background/40 backdrop-blur text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {requiresProfileCompletion ? (
              <motion.form
                animate={{ opacity: 1, y: 0 }}
                className="relative grid gap-3"
                initial={{ opacity: 0, y: 8 }}
                onSubmit={submitCompleteProfile}
              >
                <div className="rounded-2xl border border-border bg-background/45 p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-gold text-primary-foreground">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black">{c.completeTitle}</h1>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">{c.completeLead}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field icon={UserIcon} label={c.firstName} error={errors.firstName}>
                    <input
                      autoComplete="given-name"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      maxLength={80}
                      onChange={e => setCompleteForm({ ...completeForm, firstName: e.target.value })}
                      placeholder={c.firstNamePh}
                      type="text"
                      value={completeForm.firstName}
                    />
                  </Field>
                  <Field icon={UserIcon} label={c.lastName} error={errors.lastName}>
                    <input
                      autoComplete="family-name"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      maxLength={80}
                      onChange={e => setCompleteForm({ ...completeForm, lastName: e.target.value })}
                      placeholder={c.lastNamePh}
                      type="text"
                      value={completeForm.lastName}
                    />
                  </Field>
                </div>

                <p className="rounded-xl border border-border bg-background/40 p-3 text-xs leading-6 text-muted-foreground">پس از ذخیره نام، در مرکز حساب می‌توانید موبایل و ایمیل را با کد یک‌بارمصرف متصل کنید، رمز عبور بسازید و احراز هویت را ادامه دهید.</p>

                <button
                  className="group relative mt-2 inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-gold px-6 font-semibold text-primary-foreground shadow-[0_0_40px_-10px_var(--glow)] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {c.loading}</> : <><span className="relative z-10">{c.finishProfile}</span><ArrowRight className="relative z-10 h-4 w-4 rtl:rotate-180" /></>}
                </button>
              </motion.form>
            ) : (
              <>
            {/* Tabs */}
            <div className="relative flex rounded-2xl border border-border bg-foreground/[0.03] p-1">
              {(["in", "up"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setAuthMethod(m === "in" ? "otp" : "password"); setOtpChallenge(null); setErrors({}); }}
                  className={`relative flex-1 h-10 rounded-xl text-sm font-semibold transition ${mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="auth-tab"
                      className="absolute inset-0 rounded-xl bg-gradient-gold shadow-[0_0_30px_-10px_var(--glow)]"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{m === "in" ? c.tabIn : c.tabUp}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="mt-7 text-3xl font-black tracking-tight">
                  {mode === "in" ? c.titleIn : c.titleUp}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {otpChallenge ? c.otpLead : mode === "in" ? c.leadIn : c.leadUp}
                </p>

                {mode === "in" && !otpChallenge && (
                  <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-foreground/[0.03] p-1">
                    {([
                      ["otp", Smartphone, c.otpMethod],
                      ["password", KeyRound, c.passwordMethod],
                    ] as const).map(([method, Icon, label]) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => { setAuthMethod(method); setErrors({}); }}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition ${authMethod === method ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {!otpChallenge && oauthProviders.length > 0 && (
                  <>
                    {/* OAuth */}
                    <div className="mt-6 grid gap-2">
                      {oauthProviders.includes("google") ? <button
                        type="button" onClick={() => onOAuth("google")} disabled={loading}
                        className="group inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-border bg-background/60 px-4 text-sm font-semibold hover:border-primary/40 hover:bg-foreground/5 transition disabled:opacity-60"
                      >
                        <GoogleIcon />
                        {c.google}
                      </button> : null}
                      {oauthProviders.includes("apple") ? <button
                        type="button" onClick={() => onOAuth("apple")} disabled={loading}
                        className="group inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-border bg-foreground text-background px-4 text-sm font-semibold hover:bg-foreground/90 transition disabled:opacity-60"
                      >
                        <AppleIcon />
                        {c.apple}
                      </button> : null}
                    </div>

                    <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <div className="h-px flex-1 bg-border" />
                      {c.or}
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </>
                )}

                {/* Form */}
                <form onSubmit={onSubmit} className="grid gap-3">
                  {otpChallenge ? (
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-background/45 p-4 shadow-[0_20px_70px_-45px_var(--glow)]">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                      <div className="flex items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-gold text-primary-foreground shadow-[0_0_30px_-12px_var(--glow)]">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold">{c.otpTitle}</div>
                          <div className="mt-1 text-xs leading-6 text-muted-foreground">
                            {c.otpSentTo} <bdi className="inline-block font-mono font-semibold text-foreground" dir="ltr">{maskedOtpIdentifier}</bdi>
                          </div>
                        </div>
                      </div>

                      <label className="mt-5 block">
                        <span className="mb-2 block text-[11px] uppercase tracking-wider text-muted-foreground">{c.otp}</span>
                        <div className="relative">
                          <input
                            aria-label={c.otp}
                            autoComplete="one-time-code"
                            className="sr-only"
                            inputMode="numeric"
                            maxLength={6}
                            onChange={e => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrors({}); }}
                            type="text"
                            value={otpCode}
                          />
                          <button
                            type="button"
                            className="grid w-full grid-cols-6 gap-2"
                            onClick={(event) => {
                              const input = event.currentTarget.parentElement?.querySelector("input") as HTMLInputElement | null;
                              input?.focus();
                            }}
                          >
                            {Array.from({ length: 6 }).map((_, index) => (
                              <span
                                aria-hidden="true"
                                className={`grid h-12 place-items-center rounded-xl border bg-background/55 font-mono text-lg font-bold transition ${otpCode[index] ? "border-primary/70 text-foreground shadow-[0_0_24px_-15px_var(--glow)]" : "border-border text-muted-foreground"} ${errors.otp ? "border-destructive/70" : ""}`}
                                key={index}
                              >
                                {otpCode[index] ?? "•"}
                              </span>
                            ))}
                          </button>
                        </div>
                        {errors.otp && <div className="mt-2 text-[11px] text-destructive">{errors.otp}</div>}
                      </label>

                      <div className="mt-4 rounded-xl border border-border bg-foreground/[0.03] p-3">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {secondsRemaining > 0 ? c.otpTimer : c.otpExpired}
                          </span>
                          <span className="font-mono font-semibold">{formatSeconds(secondsRemaining)}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                          <div className="h-full rounded-full bg-gradient-gold transition-all duration-500" style={{ width: `${otpProgress}%` }} />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          disabled={secondsRemaining > 0 || resending || loading}
                          onClick={() => requestOtpCode(otpChallenge.identifier, "resend")}
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background/50 px-3 text-xs font-semibold text-foreground transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          {c.resendOtp}
                        </button>
                        <button
                          type="button"
                          disabled={loading || resending}
                          onClick={changeOtpMobile}
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background/50 px-3 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-50"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          {c.changeMobile}
                        </button>
                      </div>

                      <p className="mt-3 flex items-start gap-2 text-[11px] leading-6 text-muted-foreground">
                        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        {c.otpHint}
                      </p>
                    </div>
                  ) : mode === "up" ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field icon={UserIcon} label={c.firstName} error={errors.firstName}>
                          <input
                            autoComplete="given-name"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                            maxLength={80}
                            onChange={e => setForm({ ...form, firstName: e.target.value })}
                            placeholder={c.firstNamePh}
                            type="text"
                            value={form.firstName}
                          />
                        </Field>
                        <Field icon={UserIcon} label={c.lastName} error={errors.lastName}>
                          <input
                            autoComplete="family-name"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                            maxLength={80}
                            onChange={e => setForm({ ...form, lastName: e.target.value })}
                            placeholder={c.lastNamePh}
                            type="text"
                            value={form.lastName}
                          />
                        </Field>
                      </div>
                      <MobileField
                        country={selectedCountry}
                        error={errors.mobile}
                        hint={c.iranMobileHint}
                        label={c.mobile}
                        lang={lang}
                        onCountryChange={setSelectedCountry}
                        onValueChange={(mobile) => setForm({ ...form, mobile })}
                        placeholder={lang === "fa" ? "09121234567" : "9121234567"}
                        value={form.mobile}
                      />
                    </>
                  ) : authMethod === "otp" ? (
                    <MobileField
                      country={selectedCountry}
                      error={errors.mobile}
                      hint={c.iranMobileHint}
                      label={c.mobile}
                      lang={lang}
                      onCountryChange={setSelectedCountry}
                      onValueChange={(mobile) => setForm({ ...form, mobile })}
                      placeholder={lang === "fa" ? "09121234567" : "9121234567"}
                      value={form.mobile}
                    />
                  ) : null}
                  {!otpChallenge && mode === "in" && authMethod === "password" && <Field icon={Mail} label={c.username} error={errors.identifier}>
                    <input
                      type="text" value={form.identifier} maxLength={255}
                      onChange={e => setForm({ ...form, identifier: e.target.value })}
                      placeholder={c.usernamePh}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      autoComplete="username"
                    />
                  </Field>}
                  {!otpChallenge && (mode === "up" || authMethod === "password") && <Field icon={Lock} label={c.pass} error={errors.password}>
                    <input
                      type={showPass ? "text" : "password"} value={form.password} maxLength={200}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder={c.passPh}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      autoComplete={mode === "in" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button" onClick={() => setShowPass(s => !s)}
                      className="text-muted-foreground hover:text-foreground transition shrink-0"
                      tabIndex={-1} aria-label={showPass ? c.hide : c.show}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </Field>}
                  {!otpChallenge && mode === "up" && <Field icon={Lock} label={c.confirmPass} error={errors.confirmPassword}>
                    <input
                      type={showPass ? "text" : "password"} value={form.confirmPassword} maxLength={200}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder={c.passPh}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      autoComplete="new-password"
                    />
                  </Field>}

                  {mode === "in" && authMethod === "password" && !otpChallenge && (
                    <div className="flex justify-end -mt-1">
                      <button type="button" className="text-xs text-muted-foreground hover:text-primary transition">
                        {c.forgot}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit" disabled={loading || (Boolean(otpChallenge) && secondsRemaining <= 0)}
                    className="group relative mt-2 inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-gold px-6 font-semibold text-primary-foreground shadow-[0_0_40px_-10px_var(--glow)] hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-60"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {c.loading}</>
                    ) : (
                      <>
                        <span className="relative z-10">{otpChallenge ? c.otpBtn : mode === "in" && authMethod === "otp" ? c.sendOtp : mode === "in" ? c.inBtn : c.upBtn}</span>
                        <ArrowRight className="relative z-10 h-4 w-4 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0" />
                        <span className="absolute inset-0 animate-shimmer opacity-50" />
                      </>
                    )}
                  </button>

                  {mode === "up" && (
                    <p className="mt-2 flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      {c.terms}
                    </p>
                  )}
                </form>
              </motion.div>
            </AnimatePresence>
              </>
            )}
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function MobileField({
  country,
  error,
  hint,
  label,
  lang,
  onCountryChange,
  onValueChange,
  placeholder,
  value,
}: {
  country: (typeof COUNTRY_OPTIONS)[number];
  error?: string;
  hint: string;
  label: string;
  lang: string;
  onCountryChange: (country: (typeof COUNTRY_OPTIONS)[number]) => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`flex h-12 items-center gap-2 rounded-xl border bg-background/40 px-2.5 transition focus-within:ring-2 focus-within:ring-primary/30 ${error ? "border-destructive/60" : "border-border focus-within:border-primary"}`}>
        {lang !== "fa" ? (
          <select
            aria-label="Country"
            className="h-9 rounded-lg border border-border bg-background/70 px-2 text-xs outline-none"
            onChange={(event) => {
              const next = COUNTRY_OPTIONS.find((item) => item.code === event.target.value) ?? COUNTRY_OPTIONS[0];
              onCountryChange(next);
            }}
            value={country.code}
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>{option.flag} {option.code}</option>
            ))}
          </select>
        ) : (
          <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <input
          autoComplete="tel"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          inputMode="tel"
          maxLength={18}
          onChange={e => onValueChange(toLatinDigits(e.target.value).replace(/[^\d+]/g, ""))}
          placeholder={placeholder}
          type="tel"
          value={value}
        />
      </div>
      <div className={`mt-1 text-[11px] ${error ? "text-destructive" : "text-muted-foreground"}`}>{error ?? hint}</div>
    </label>
  );
}

function Field({
  icon: Icon, label, error, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; error?: string; children: ReactChildren;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className={`flex items-center gap-2 h-12 rounded-xl border bg-background/40 px-3.5 transition focus-within:ring-2 focus-within:ring-primary/30 ${error ? "border-destructive/60" : "border-border focus-within:border-primary"}`}>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        {children}
      </div>
      {error && <div className="mt-1 text-[11px] text-destructive">{error}</div>}
    </label>
  );
}

type ReactChildren = React.ReactNode;

function formatSeconds(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function buildMobileForRequest(value: string, country: (typeof COUNTRY_OPTIONS)[number], lang: string) {
  const normalized = toLatinDigits(value).trim().replace(/[^\d+]/g, "");
  if (lang === "fa") {
    if (/^09\d{9}$/.test(normalized)) return `+98${normalized.slice(1)}`;
    return normalized;
  }
  if (normalized.startsWith("+")) return normalized;
  return `${country.code}${normalized.replace(/^0+/, "")}`;
}

function normalizeIdentifierForRequest(value: string, country: (typeof COUNTRY_OPTIONS)[number], lang: string) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return trimmed;
  const latin = toLatinDigits(trimmed);
  if (/^(?:\+|00)?[0-9\s()-]{10,18}$/.test(latin)) return buildMobileForRequest(latin, country, lang);
  return trimmed;
}

function isValidMobileForLang(value: string, country: (typeof COUNTRY_OPTIONS)[number], lang: string) {
  const mobile = buildMobileForRequest(value, country, lang);
  if (lang === "fa" && /^\+989\d{9}$/.test(mobile)) return true;
  return /^\+[1-9]\d{9,14}$/.test(mobile);
}

function toLatinDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persian = "۰۱۲۳۴۵۶۷۸۹".indexOf(digit);
    if (persian >= 0) return String(persian);
    const arabic = "٠١٢٣٤٥٦٧٨٩".indexOf(digit);
    return arabic >= 0 ? String(arabic) : digit;
  });
}

function maskIdentifier(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 7) return trimmed;
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-3)}`;
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.365 12.45c.014-2.398 1.964-3.547 2.052-3.6-1.12-1.636-2.864-1.861-3.484-1.888-1.484-.149-2.898.872-3.654.872-.756 0-1.926-.85-3.166-.826-1.63.025-3.13.948-3.97 2.408-1.692 2.93-.434 7.27 1.215 9.652.806 1.166 1.766 2.475 3.027 2.43 1.213-.049 1.672-.787 3.142-.787 1.47 0 1.885.787 3.166.762 1.305-.025 2.131-1.19 2.928-2.358.92-1.354 1.301-2.665 1.323-2.732-.029-.013-2.538-.972-2.579-3.855zM13.99 5.59c.67-.812 1.123-1.94.999-3.064-.965.039-2.135.645-2.83 1.456-.624.722-1.169 1.873-1.022 2.973 1.077.084 2.181-.547 2.853-1.365z" />
    </svg>
  );
}
