import {
  ArrowLeftRight,
  BadgeCheck,
  Bell,
  CircleDollarSign,
  CreditCard,
  Coins,
  FileText,
  Gift,
  Headphones,
  Home,
  Inbox,
  LifeBuoy,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Send,
  ShieldCheck,
  Truck,
  User,
  Wallet,
  Users,
  Link2,
  MapPin,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface CustomerDashboardItem {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface CustomerDashboardGroup {
  icon: LucideIcon;
  items: CustomerDashboardItem[];
  label: string;
}

export const customerDashboardNavigation: CustomerDashboardGroup[] = [
  {
    icon: Home,
    label: "داشبورد",
    items: [
      { description: "نمای کلی دارایی، قیمت زنده، سفارش‌ها و پیام‌های مهم حساب.", href: "/user", icon: Home, label: "نمای کلی" },
      { description: "اعلان‌های خرید، فروش، کیف پول، تحویل و پشتیبانی.", href: "/user/notifications", icon: Bell, label: "اعلان‌ها" },
    ],
  },
  {
    icon: Coins,
    label: "معاملات نقره",
    items: [
      { description: "انتخاب شمش، ساچمه و محصولات نقره پلمب‌شده و ثبت در سبد خرید.", href: "/user/silver-products", icon: ShoppingBag, label: "محصولات نقره" },
      { description: "سفارش‌های محصولات فیزیکی، مبلغ، پرداخت و وضعیت آماده‌سازی.", href: "/user/product-orders", icon: PackageCheck, label: "سفارش محصولات" },
      { description: "خرید و فروش نقره با تبدیل هم‌زمان مبلغ تومان و وزن نقره.", href: "/user/buy-silver", icon: ArrowLeftRight, label: "خرید و فروش" },
      { description: "همه سفارش‌های خرید و فروش نقره.", href: "/user/orders", icon: FileText, label: "سفارش‌ها" },
      { description: "ریز تراکنش‌های مالی و گرمی حساب.", href: "/user/transactions", icon: FileText, label: "تراکنش‌ها" },
    ],
  },
  {
    icon: Wallet,
    label: "دارایی و کیف پول",
    items: [
      { description: "موجودی تومان و نقره، اعتبار پاداش معرفی و تراکنش‌های کیف پول.", href: "/user/wallet", icon: Wallet, label: "دارایی و کیف پول" },
      { description: "جوایز گردونه، اعتبار خرید، کدهای اختصاصی و پیگیری ارسال شمش.", href: "/user/rewards", icon: Gift, label: "پاداش‌ها" },
      { description: "افزودن و مدیریت شماره‌های شبای تأییدشده و جزئیات حساب مقصد برداشت.", href: "/user/bank-accounts", icon: CreditCard, label: "حساب‌های بانکی" },
    ],
  },
  {
    icon: Gift,
    label: "هدیه",
    items: [
      { description: "نمای یکپارچه هدیه‌های ارسالی، دریافتی، در انتظار و محصولات آماده تحویل.", href: "/user/gifts", icon: Gift, label: "هدیه‌ها" },
      { description: "ارسال مقدار نقره یا محصول پلمب‌شده با شماره موبایل و اطلاع‌رسانی پیامکی.", href: "/user/gifts/send", icon: Send, label: "ارسال هدیه" },
      { description: "مشاهده هدیه‌های دریافتی، فعال‌سازی پس از احراز هویت و دریافت محصول.", href: "/user/gifts/received", icon: Inbox, label: "هدیه‌های دریافتی" },
    ],
  },
  {
    icon: Users,
    label: "باشگاه معرفی",
    items: [
      { description: "نمای کامل اعضای معرفی‌شده، نرخ تبدیل، درآمد و قوانین فعال پاداش.", href: "/user/referrals", icon: Users, label: "داشبورد معرفی" },
      { description: "فهرست همه افرادی که با کد شما عضو شده‌اند و وضعیت خرید و پاداش هر نفر.", href: "/user/referrals/referred-users", icon: Users, label: "کاربران معرفی‌شده" },
      { description: "ساخت و مدیریت لینک‌ها و کدهای اختصاصی کمپین معرفی.", href: "/user/referrals/links", icon: Link2, label: "لینک‌های معرفی" },
      { description: "ریز تمام پاداش‌های معرفی و مبالغ ثبت‌شده برای کارمزد.", href: "/user/referrals/commissions", icon: CircleDollarSign, label: "گزارش پاداش‌ها" },
      { description: "مشاهده اعتبار تجمعی که فقط از هزینه‌ها و کارمزدهای مجاز کسر می‌شود.", href: "/user/referrals/payouts", icon: Wallet, label: "اعتبار کارمزد" },
      { description: "عملکرد کلیک و تبدیل کمپین‌های معرفی شما.", href: "/user/referrals/clicks", icon: Activity, label: "عملکرد معرفی" },
    ],
  },
  {
    icon: Truck,
    label: "تحویل فیزیکی",
    items: [
      { description: "درخواست ارسال پستی شمش به صاحب حساب.", href: "/user/delivery", icon: Truck, label: "درخواست تحویل" },
      { description: "پیگیری وضعیت آماده‌سازی، پلمب، ارسال و تحویل.", href: "/user/delivery/tracking", icon: PackageCheck, label: "پیگیری تحویل" },
      { description: "مشاهده گواهی اصالت و وضعیت بسته پلمب.", href: "/user/certificates", icon: BadgeCheck, label: "گواهی اصالت" },
    ],
  },
  {
    icon: User,
    label: "حساب کاربری",
    items: [
      { description: "اطلاعات هویتی، احراز هویت و وضعیت بررسی.", href: "/user/profile", icon: User, label: "پروفایل و احراز هویت" },
      { description: "ثبت نشانی با استعلام کد پستی جیبیت و انتخاب نشانی پیش‌فرض تحویل.", href: "/user/account/addresses", icon: MapPin, label: "نشانی‌های تحویل" },
      { description: "تنظیمات امنیتی، رمز عبور، نشست‌ها و ترجیحات حساب.", href: "/user/account/security", icon: ShieldCheck, label: "امنیت حساب" },
    ],
  },
  {
    icon: Headphones,
    label: "پشتیبانی",
    items: [
      { description: "گفتگوی آنلاین با تیم پشتیبانی نقره.", href: "/user/support/live-chat", icon: MessageCircle, label: "چت آنلاین" },
      { description: "تیکت‌ها، پاسخ‌ها، فایل‌ها و پیگیری درخواست‌ها.", href: "/user/support/tickets", icon: LifeBuoy, label: "تیکت‌ها" },
      { description: "ثبت تیکت پشتیبانی جدید.", href: "/user/support/tickets/open", icon: LifeBuoy, label: "ثبت تیکت" },
    ],
  },
];

export function findCustomerDashboardItem(pathname: string) {
  const normalizedPathname = normalizeCustomerDashboardPathname(pathname);
  const flattened = customerDashboardNavigation.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));
  return flattened
    .filter((item) => isCustomerDashboardItemActive(normalizedPathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0] ?? flattened[0];
}

function normalizeCustomerDashboardPathname(pathname: string) {
  if (pathname.startsWith("/user/silver-wallet") || pathname.startsWith("/user/toman-wallet")) return "/user/wallet";
  if (pathname.startsWith("/user/sell-silver")) return "/user/buy-silver";
  return pathname;
}

export function isCustomerDashboardItemActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/user") return false;
  return pathname.startsWith(`${href}/`);
}
