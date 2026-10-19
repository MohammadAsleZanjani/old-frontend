import {
  Activity,
  BadgeCheck,
  BanknoteArrowDown,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  Coins,
  CreditCard,
  Download as DownloadIcon,
  FileBarChart,
  FileText,
  FolderTree,
  Gauge,
  Globe2,
  Gift,
  Headphones,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Megaphone,
  Percent,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  ShieldAlert,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Truck,
  UserCog,
  UserPlus,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
  permission?: string;
  primaryAction?: string;
}

export interface AdminNavGroup {
  icon: LucideIcon;
  items: AdminNavItem[];
  label: string;
}

export const adminNavigation: AdminNavGroup[] = [
  {
    icon: LayoutDashboard,
    label: "مدیریت",
    items: [
      { description: "نمای اجرایی قیمت زنده، سفارش‌ها، کیف پول‌ها، احراز هویت و پشتیبانی.", href: "/admin", icon: Gauge, label: "نمای کلی", permission: "system.health.view" },
      { description: "نمودارهای فروش، حجم گرم، درآمد کارمزد و رفتار کاربران.", href: "/admin/analytics", icon: BarChart3, label: "تحلیل‌ها", permission: "system.health.view" },
      { description: "خروجی گزارش‌های عملیاتی، مالی، تحویل و احراز هویت.", href: "/admin/reports", icon: FileBarChart, label: "گزارش‌ها", permission: "reports.activity.view" },
      { description: "پروفایل مدیر، امنیت، نشست‌ها و ترجیحات پنل.", href: "/admin/profile", icon: UserCog, label: "پروفایل مدیر" },
    ],
  },
  {
    icon: Percent,
    label: "بازاریابی",
    items: [
      { description: "لینک اختصاصی بلاگرها، وضعیت انتشار، ثبت‌نام، احراز هویت و هدیه شروع پلتفرم.", href: "/admin/marketing/acquisition", icon: Megaphone, label: "کمپین جذب بلاگرها", permission: "acquisition.campaigns.view", primaryAction: "افزودن بلاگر" },
      { description: "ساخت کد تخفیف درصدی، مبلغ ثابت و پاداش کیف پول تومان یا نقره‌ای.", href: "/admin/marketing/promotions", icon: Gift, label: "کدهای تبلیغاتی", permission: "promotions.codes.view", primaryAction: "ساخت کد جدید" },
      { description: "زمان‌بندی رویدادها و کمپین‌های مناسبتی کدهای تبلیغاتی.", href: "/admin/marketing/promotions/calendar", icon: CalendarClock, label: "تقویم کمپین", permission: "promotions.calendar.view" },
      { description: "نرخ استفاده، فروش منتسب، پاداش‌ها و گزارش عملکرد بلاگرها.", href: "/admin/marketing/promotions/analytics", icon: BarChart3, label: "تحلیل تبلیغات", permission: "promotions.analytics.view" },
      { description: "کمپین گردونه، ۱۰ جایزه، احتمال‌ها، موجودی و محدودیت‌های چرخش.", href: "/admin/marketing/wheel", icon: Sparkles, label: "گردونه جایزه", permission: "wheel.campaigns.view", primaryAction: "کمپین جدید" },
      { description: "تاریخچه چرخش‌های امن و اعطای شانس به کاربران.", href: "/admin/marketing/wheel/history", icon: RefreshCcw, label: "چرخش‌ها و شانس‌ها", permission: "wheel.spins.view" },
      { description: "بررسی آدرس، آماده‌سازی و رهگیری تحویل جایزه فیزیکی.", href: "/admin/marketing/wheel/claims", icon: Truck, label: "تحویل جوایز", permission: "wheel.claims.view" },
      { description: "قیف بازدید تا خرید، هزینه جوایز، درآمد و بازگشت کاربران.", href: "/admin/marketing/wheel/analytics", icon: BarChart3, label: "تحلیل گردونه", permission: "wheel.analytics.view" },
    ],
  },
  {
    icon: Coins,
    label: "نقره",
    items: [
      { description: "کنترل قیمت لحظه‌ای، قیمت خرید، قیمت فروش و زمان بروزرسانی.", href: "/admin/silver/live-price", icon: Coins, label: "قیمت زنده نقره", permission: "silver.price.manage" },
      { description: "مدیریت اسپرد، کارمزد خرید و فروش، حداقل سفارش و هزینه تحویل.", href: "/admin/silver/settings", icon: SlidersHorizontal, label: "تنظیمات قیمت و کارمزد", permission: "silver.settings.manage" },
      { description: "مدیریت سفارش‌های خرید و فروش نقره کاربران.", href: "/admin/silver/orders", icon: FileText, label: "سفارش‌های خرید و فروش", permission: "silver.orders.view" },
      { description: "دارایی نقره کاربران، گرم آزاد، گرم قفل‌شده و گواهی اصالت.", href: "/admin/silver/holdings", icon: BadgeCheck, label: "دارایی‌های نقره", permission: "silver.wallets.view" },
    ],
  },
  {
    icon: BriefcaseBusiness,
    label: "محصولات نقره",
    items: [
      { description: "مدیریت کاتالوگ شمش، ساچمه، سکه و محصولات کلکسیونی نقره.", href: "/admin/shop/products", icon: BriefcaseBusiness, label: "همه محصولات", permission: "products.view", primaryAction: "افزودن محصول نقره" },
      { description: "ثبت محصول فیزیکی با وزن، عیار، موجودی، بسته‌بندی و گواهی اصالت.", href: "/admin/products/create", icon: Sparkles, label: "افزودن محصول", permission: "products.create" },
      { description: "همه سفارش‌های محصولات نقره همراه با روش پرداخت، وضعیت و مشخصات خریدار.", href: "/admin/shop/orders", icon: ShoppingBag, label: "همه سفارش‌های محصولات", permission: "orders.view" },
      { description: "دسته‌بندی محصولات مانند شمش، ساچمه، سکه و کپسول کلکسیونی.", href: "/admin/shop/products/categories", icon: FolderTree, label: "دسته‌بندی‌ها", permission: "products.view" },
      { description: "نوع فیزیکی محصول نقره که در فرم محصول قابل انتخاب است.", href: "/admin/shop/products/types", icon: Boxes, label: "انواع محصول نقره", permission: "products.view" },
      { description: "تعریف وزن‌های استاندارد و ابعاد قابل عرضه.", href: "/admin/shop/products/sizes", icon: Boxes, label: "وزن و اندازه", permission: "products.view" },
      { description: "مدیریت عیارهای ۹۹۹، ۹۲۵ و سایر استانداردهای خلوص.", href: "/admin/shop/products/purities", icon: BadgeCheck, label: "عیارها", permission: "products.view" },
      { description: "ضرابخانه، سازنده و کشور مبدأ محصول.", href: "/admin/shop/products/manufacturers", icon: Building2, label: "سازندگان", permission: "products.view" },
      { description: "موجودی، هشدار کمبود و وضعیت آماده‌سازی سفارش.", href: "/admin/shop/inventory", icon: Boxes, label: "موجودی انبار", permission: "products.view" },
      { description: "برچسب‌های جستجو و فیلتر کاتالوگ نقره.", href: "/admin/shop/products/tags", icon: Tags, label: "برچسب‌ها", permission: "products.view" },
      { description: "بررسی امتیازها و دیدگاه‌های خریداران محصولات نقره.", href: "/admin/shop/products/reviews", icon: MessageSquare, label: "دیدگاه محصولات", permission: "products.view" },
      { description: "پاسخ به پرسش‌های مربوط به وزن، عیار، اصالت و تحویل محصولات.", href: "/admin/shop/products/questions", icon: LifeBuoy, label: "پرسش و پاسخ", permission: "products.view" },
      { description: "فایل گواهی اصالت، تصاویر و اسناد محصولات نقره.", href: "/admin/shop/inventory/downloads", icon: DownloadIcon, label: "اسناد و گواهی‌ها", permission: "products.manage_files" },
    ],
  },
  {
    icon: WalletCards,
    label: "مالی",
    items: [
      { description: "همه تراکنش‌های کیف پول تومان و گرمی.", href: "/admin/finance/wallet-transactions", icon: WalletCards, label: "تراکنش‌های کیف پول", permission: "silver.wallets.view" },
      { description: "بررسی درخواست برداشت تومان، تأیید حساب بانکی و ثبت انتقال و کد پیگیری.", href: "/admin/finance/withdrawals", icon: BanknoteArrowDown, label: "برداشت تومان", permission: "silver.withdrawals.view" },
      { description: "اصلاح دستی موجودی با ثبت لاگ حسابرسی.", href: "/admin/finance/wallet-adjustments", icon: CircleDollarSign, label: "اصلاح موجودی کاربران", permission: "silver.wallets.adjust" },
      { description: "تنظیم درصد کارمزد، اسپرد و حداقل خرید/فروش.", href: "/admin/finance/fees", icon: Percent, label: "کارمزدها و کمیسیون", permission: "silver.settings.manage" },
      { description: "فاکتورهای خرید، فروش و تحویل نقره با خروجی PDF و مانده حساب.", href: "/admin/finance/invoices", icon: FileText, label: "همه فاکتورها", permission: "invoices.view", primaryAction: "صدور فاکتور" },
      { description: "پیش‌فاکتورها و فاکتورهای تکمیل‌نشده.", href: "/admin/finance/invoices/drafts", icon: FileText, label: "پیش‌نویس فاکتورها", permission: "invoices.view" },
      { description: "مبلغ واقعی پرداخت درگاه، علت پرداخت و تطبیق اثر آن با کیف پول، خرید نقره یا سفارش محصول.", href: "/admin/finance/gateway-transactions", icon: CreditCard, label: "تراکنش‌های درگاه", permission: "payments.view" },
      { description: "همه روش‌های پرداخت شامل درگاه، کیف پول تومان و کیف پول نقره.", href: "/admin/finance/payments", icon: CreditCard, label: "همه پرداخت‌ها", permission: "payments.view" },
      { description: "درخواست‌های بازگشت وجه و روند تطبیق مالی.", href: "/admin/finance/payments/refunds", icon: ReceiptText, label: "بازگشت وجه", permission: "refunds.manage" },
      { description: "گزارش درآمد فروش نقره، اسپرد، کارمزد و تحویل.", href: "/admin/finance/accounting/revenue", icon: ChartNoAxesCombined, label: "درآمد", permission: "payments.view" },
      { description: "دفتر هزینه‌ها و خروجی‌های حسابداری.", href: "/admin/finance/accounting/expenses", icon: ReceiptText, label: "هزینه‌ها", permission: "payments.view" },
      { description: "مانده تومانی و گرمی مشتریان در فاکتورها، پرداخت‌ها و برگشت‌ها.", href: "/admin/finance/accounting/balances", icon: WalletCards, label: "مانده مشتریان", permission: "payments.view" },
    ],
  },
  {
    icon: Truck,
    label: "تحویل",
    items: [
      { description: "درخواست‌های تحویل فیزیکی، شعبه، پست و آماده‌سازی.", href: "/admin/delivery/requests", icon: Truck, label: "درخواست‌های تحویل", permission: "silver.delivery.manage" },
      { description: "پیگیری وضعیت پلمب، گواهی، آماده تحویل، ارسال و تحویل نهایی.", href: "/admin/delivery/tracking", icon: ShieldCheck, label: "پیگیری و پلمب", permission: "silver.delivery.manage" },
      { description: "سفارش‌های در انتظار پرداخت یا تأیید مشتری.", href: "/admin/shop/orders/pending", icon: CalendarClock, label: "سفارش‌های در انتظار", permission: "orders.view" },
      { description: "سفارش‌های نقره در حال آماده‌سازی، تأیید یا ارسال.", href: "/admin/shop/orders/processing", icon: RefreshCcw, label: "در حال پردازش", permission: "orders.view" },
      { description: "سفارش‌های تکمیل‌شده و سوابق تحویل.", href: "/admin/shop/orders/completed", icon: ShieldCheck, label: "تکمیل‌شده", permission: "orders.view" },
      { description: "سفارش‌های برگشت‌خورده و جزئیات تطبیق مالی.", href: "/admin/shop/orders/refunded", icon: ReceiptText, label: "برگشت‌شده", permission: "orders.view" },
      { description: "همه سفارش‌های کالایی نقره با وضعیت پرداخت و تحویل.", href: "/admin/shop/orders", icon: Truck, label: "همه سفارش‌ها", permission: "orders.view" },
    ],
  },
  {
    icon: Users,
    label: "کاربران و احراز هویت",
    items: [
      { description: "همه حساب‌های کاربری شامل مشتریان و مدیران، سلامت حساب، موجودی‌ها و فعالیت‌ها.", href: "/admin/users", icon: Users, label: "همه کاربران", permission: "users.view", primaryAction: "افزودن کاربر" },
      { description: "بررسی اطلاعات هویتی و تأیید یا درخواست اصلاح مدارک.", href: "/admin/kyc/reviews", icon: BadgeCheck, label: "بررسی احراز هویت", permission: "silver.kyc.manage" },
      { description: "نقش‌ها و ماتریس مجوزهای پنل.", href: "/admin/access/roles", icon: KeyRound, label: "نقش‌ها", permission: "roles.view" },
      { description: "رجیستری مجوزها برای کنترل دسترسی ماژول‌ها.", href: "/admin/access/permissions", icon: ShieldCheck, label: "مجوزها", permission: "roles.view" },
      { description: "ایجاد حساب مشتری برای سفارش، کیف پول، پشتیبانی و داشبورد.", href: "/admin/users/create", icon: UserPlus, label: "افزودن کاربر", permission: "users.create" },
      { description: "حساب‌های همکاری در فروش و وضعیت معرفی‌کنندگان.", href: "/admin/customers/referrals", icon: Percent, label: "معرف‌ها", permission: "referrals.affiliates.view" },
      { description: "قوانین پویا، درصد یا مبلغ ثابت، هدیه دوست، حداقل خرید و دوره آزادسازی.", href: "/admin/customers/referrals/rules", icon: SlidersHorizontal, label: "قوانین پاداش معرفی", permission: "referrals.rules.view" },
      { description: "واریز ۵۰ هزار تومانی دوطرفه بلافاصله پس از ثبت‌نام و کنترل عدم تکرار.", href: "/admin/customers/referrals/kyc-rewards", icon: WalletCards, label: "پاداش ثبت‌نام معرفی", permission: "referrals.kyc_rewards.view" },
      { description: "همه خریدهای منتسب‌شده، درآمد ایجادشده و پاداش دوطرفه.", href: "/admin/customers/referrals/conversions", icon: Activity, label: "تبدیل‌های معرفی", permission: "referrals.conversions.view" },
      { description: "تأیید کمیسیون‌ها و وضعیت پرداخت معرفی‌کنندگان.", href: "/admin/customers/referrals/commissions", icon: Percent, label: "کمیسیون‌ها", permission: "referrals.commissions.view" },
      { description: "تأیید و پرداخت تسویه معرفی‌کنندگان.", href: "/admin/customers/referrals/payouts", icon: WalletCards, label: "تسویه معرفی‌کنندگان", permission: "referrals.payouts.view" },
      { description: "کلیک‌ها، UTM و سیگنال‌های تبدیل معرفی مشتری.", href: "/admin/customers/referrals/clicks", icon: Activity, label: "آمار کلیک", permission: "referrals.clicks.view" },
      { description: "گزارش‌های معرفی برای خروجی مالی و بازاریابی.", href: "/admin/customers/referrals/reports", icon: FileBarChart, label: "گزارش معرفی", permission: "referrals.reports.view" },
      { description: "کلیک‌های مشکوک، سرعت غیرعادی و موارد نیازمند بررسی.", href: "/admin/customers/referrals/fraud", icon: ShieldAlert, label: "کنترل تقلب معرفی", permission: "referrals.fraud.view" },
    ],
  },
  {
    icon: Headphones,
    label: "پشتیبانی",
    items: [
      { description: "صف تیکت‌ها، اولویت، پاسخ‌ها و فایل‌های پیوست.", href: "/admin/support/tickets", icon: LifeBuoy, label: "تیکت‌ها", permission: "tickets.view", primaryAction: "ثبت تیکت" },
      { description: "گفتگوی آنلاین کاربران، ارجاع به اپراتور و تاریخچه.", href: "/admin/support/live-chat", icon: MessageSquare, label: "چت آنلاین", permission: "live_chat.access" },
      { description: "دپارتمان‌های پشتیبانی و مسیر ارجاع.", href: "/admin/support/departments", icon: BookOpen, label: "دپارتمان‌ها", permission: "tickets.view" },
      { description: "اپراتورها و کارشناسان قابل تخصیص به گفتگوها و تیکت‌ها.", href: "/admin/support/agents", icon: Users, label: "کارشناسان", permission: "users.manage" },
      { description: "مقالات راهنما برای خرید، فروش، کیف پول، اصالت و تحویل نقره.", href: "/admin/support/knowledge-base", icon: BookOpen, label: "مرکز راهنما", permission: "tickets.view" },
    ],
  },
  {
    icon: FileText,
    label: "محتوا",
    items: [
      { description: "مقالات آموزشی نقره، سرمایه‌گذاری، امنیت و تحویل فیزیکی.", href: "/admin/content/blog", icon: FileText, label: "مقالات", permission: "blog.view", primaryAction: "مقاله جدید" },
      { description: "دسته‌بندی‌های آموزش و اخبار نقره.", href: "/admin/content/blog/categories", icon: BookOpen, label: "دسته‌بندی‌ها", permission: "blog.view" },
      { description: "برچسب‌های مقالات و پیوندهای داخلی محتوای نقره.", href: "/admin/content/blog/tags", icon: Tags, label: "برچسب مقالات", permission: "blog.view" },
      { description: "بررسی دیدگاه‌های در انتظار، تأییدشده، ردشده و هرزنامه.", href: "/admin/content/blog/comments", icon: MessageSquare, label: "دیدگاه مقالات", permission: "blog.moderate_comments" },
      { description: "پرسش‌های متداول خرید، فروش، کارمزد، احراز هویت و تحویل.", href: "/admin/content/faqs", icon: MessageSquare, label: "پرسش‌های متداول", permission: "content.manage" },
      { description: "مدیریت صفحات درباره ما، تماس با ما، کارمزدها و سایر محتوای عمومی.", href: "/admin/content/pages", icon: FileText, label: "صفحات سایت", permission: "content.manage" },
      { description: "بخش‌های صفحه اصلی و صفحات محتوایی متصل به پایگاه داده.", href: "/admin/content/pages/sections", icon: Boxes, label: "بخش‌های صفحات", permission: "content.manage" },
      { description: "منوهای سربرگ، پابرگ و ناوبری سایت نقره.", href: "/admin/content/pages/menus", icon: FolderTree, label: "منوها", permission: "content.manage" },
      { description: "تصاویر و فایل‌های عمومی قابل استفاده در محتوا.", href: "/admin/content/pages/media", icon: ImageIcon, label: "کتابخانه رسانه", permission: "content.manage" },
      { description: "عنوان، توضیحات متا، اسکیما و امتیاز سئوی صفحات نقره.", href: "/admin/content/seo", icon: Search, label: "مدیریت سئو", permission: "seo.metadata.view" },
      { description: "قوانین تغییر مسیر و نگهداری نشانی‌های قدیمی.", href: "/admin/content/seo/redirects", icon: RefreshCcw, label: "تغییر مسیرها", permission: "seo.redirects.view" },
      { description: "سوابق ممیزی و امتیازهای سئوی سایت.", href: "/admin/content/seo/audits", icon: ShieldCheck, label: "ممیزی سئو", permission: "seo.audits.view" },
    ],
  },
  {
    icon: Globe2,
    label: "زبان و بومی‌سازی",
    items: [
      { description: "زبان‌های فعال، پیش‌فرض و جهت نمایش پنل و سایت.", href: "/admin/localization", icon: Globe2, label: "زبان‌ها", permission: "localization.languages.view" },
      { description: "رشته‌های ترجمه رابط، مقادیر ترجمه‌شده و پوشش هر زبان.", href: "/admin/localization/translations", icon: FileText, label: "ترجمه‌ها", permission: "localization.translations.view" },
      { description: "سوابق ترجمه هوشمند، وضعیت بررسی و خطاهای ارائه‌دهنده.", href: "/admin/localization/ai-logs", icon: Activity, label: "گزارش ترجمه هوشمند", permission: "localization.ai.view" },
    ],
  },
  {
    icon: Settings,
    label: "سیستم",
    items: [
      { description: "تنظیمات عمومی، برند، امنیت، پیامک، ایمیل، درگاه پرداخت و نگهداری فایل‌ها.", href: "/admin/system/settings", icon: Settings, label: "تنظیمات", permission: "settings.view" },
      { description: "سوابق تغییرات حساس مالی، قیمت، سفارش، تحویل و کیف پول.", href: "/admin/system/audit-logs", icon: Activity, label: "سوابق تغییرات", permission: "audit_logs.view" },
      { description: "مسیر سازگار گزارش فعالیت و خطا مطابق پنل مرجع.", href: "/admin/system/logs", icon: Activity, label: "گزارش‌های سیستم", permission: "audit_logs.view" },
      { description: "مدیریت اعلان‌های کاربران و نتیجه ارسال هر پیام.", href: "/admin/system/operations", icon: Bell, label: "اعلان‌ها", permission: "notifications.inbox.view" },
      { description: "ارسال صف‌بندی‌شده پیامک و اعلان داخل سامانه برای همه حساب‌های مشتری.", href: "/admin/system/operations/broadcasts", icon: Bell, label: "ارسال همگانی", permission: "notifications.broadcasts.view" },
      { description: "قالب‌های پیامک، ایمیل و اعلان رویدادهای قیمت، سفارش و تحویل.", href: "/admin/system/operations/templates", icon: FileText, label: "قالب اعلان‌ها", permission: "notifications.templates.view" },
      { description: "نتیجه ارسال، خطاها و تلاش مجدد کانال‌های اعلان.", href: "/admin/system/operations/logs", icon: Activity, label: "سوابق ارسال اعلان", permission: "notifications.logs.view" },
      { description: "حساب‌های مدیر، وضعیت، نقش‌ها و دسترسی‌ها.", href: "/admin/access/users", icon: UserCog, label: "مدیران", permission: "users.view", primaryAction: "افزودن مدیر" },
      { description: "تیم‌های عملیاتی قیمت، مالی، تحویل، محتوا و پشتیبانی.", href: "/admin/access/teams", icon: Users, label: "تیم‌ها", permission: "users.view" },
    ],
  },
];

export function findAdminItem(pathname: string) {
  const flattened = adminNavigation.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));
  return flattened
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0] ?? flattened[0];
}
