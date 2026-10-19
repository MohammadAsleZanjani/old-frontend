"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = string;
export type Theme = "dark" | "light";
export type Direction = "rtl" | "ltr";

export interface LanguageOption {
  code: string;
  direction: Direction;
  isDefault?: boolean;
  name: string;
  nativeName: string;
  sortOrder?: number;
}

export const baseTranslations = {
  fa: {
    dir: "rtl" as "rtl" | "ltr",
    name: "فارسی",
    nav: { home: "خانه", services: "خدمات", portfolio: "نمونه‌کارها", process: "فرآیند", tech: "تکنولوژی", blog: "بلاگ", about: "درباره ما", contact: "تماس با ما", cta: "شروع پروژه" },
    hero: {
      badge: "سیستم آنلاین",
      tag: "// SETAYESH.OS · v15.0",
      title1: "طراحی و توسعه",
      title2: "نرم‌افزارهای اختصاصی،",
      title3: "هوشمند و سازمانی",
      desc: "ستایش با بیش از ۱۵ سال تجربه، راهکارهای نرم‌افزاری، اپلیکیشن، هوش مصنوعی، ERP، CRM، زیرساخت و پلتفرم‌های اختصاصی را برای رشد کسب‌وکارها طراحی و پیاده‌سازی می‌کند.",
      ctaPrimary: "شروع پروژه",
      ctaSecondary: "مشاهده خدمات",
      stats: [
        { v: "+۱۵ سال تجربه" },
        { v: "+۶۴۲۰ پروژه" },
        { v: "+۹۲۸۰ مشتری" },
        { v: "راهکارهای سازمانی" },
      ],
      mrr: "MRR", latency: "LATENCY P95", throughput: "THROUGHPUT", error: "ERROR RATE",
      opsLive: "ops · live", streaming: "streaming", terminal: "ترمینال زنده‌ی استقرار",
    },
    stats: { projects: "پروژه تکمیل‌شده", clients: "مشتری راضی", years: "سال تجربه", experts: "متخصص فعال" },
    services: {
      badge: "خدمات ستایش", title1: "یک تیم.", title2: "دوازده تخصص.", title3: "یک پلتفرم برای رشد دیجیتال شما.",
      desc: "از نرم‌افزارهای enterprise تا راهکارهای هوش مصنوعی و بلاکچین — تیم ستایش با بیش از ۶٬۴۲۰ پروژه‌ی موفق در کنار شماست.",
      cta: "مشاهده‌ی جزئیات",
      list: [
        ["هوش مصنوعی", "طراحی مدل‌های اختصاصی، ادغام LLM، چت‌بات، بینایی ماشین و سامانه‌های پیش‌بینی."],
        ["توسعه نرم‌افزار سفارشی", "نرم‌افزارهای سازمانی scalable با Node.js، NestJS، Laravel و معماری میکروسرویس."],
        ["طراحی وب‌سایت تخصصی", "وب‌سایت فروشگاهی، خبری، صرافی فیات و رمز ارز، CMS اختصاصی و پلتفرم آگهی."],
        ["اپلیکیشن اندروید", "اپ‌های Native و Flutter با عملکرد بالا، طراحی مدرن و یکپارچگی کامل با بک‌اند."],
        ["اپلیکیشن iOS", "توسعه‌ی iOS با Swift و معماری استاندارد App Store برای بازارهای جهانی."],
        ["ERP و CRM سازمانی", "اتوماسیون اداری برای سازمان‌های دولتی و خصوصی بزرگ، با ماژول‌های اختصاصی."],
        ["بلاکچین و رمزارز", "صرافی OTC، طلای آبشده، کیف‌پول، توکن‌سازی و قراردادهای هوشمند."],
        ["زیرساخت سرور", "پیکربندی سرور، Kubernetes، Docker، CDN، load balancing و امنیت زیرساخت."],
        ["سرور اختصاصی", "مشاوره و راه‌اندازی Data Center خصوصی، مانیتورینگ ۲۴ ساعته و SLA تضمینی."],
        ["سئو و دیجیتال مارکتینگ", "تا قرارگیری در صفحه‌ی اول گوگل کنار شما هستیم — Technical + Content SEO."],
        ["CMS و اسکریپت آماده", "اسکریپت‌های اختصاصی فروشگاهی، خبری، طلا آبشده و چندفروشگاهی."],
        ["مشاوره‌ی استارتاپ", "از ایده تا MVP، طراحی معماری محصول، CTO as a Service و راهبری فنی."],
      ] as [string, string][],
    },
    portfolio: {
      badge: "نمونه‌کارها", title1: "محصولاتی که", title2: "حرف می‌زنند.", all: "مشاهده‌ی همه ←",
      items: [
        ["اسکریپت طلای آبشده | گلدمن", "Marketplace · Trading"],
        ["صرافی رمز ارز OTC", "Blockchain · FinTech"],
        ["اسکریپت چندفروشگاهی", "E-commerce · SaaS"],
        ["نیوزمن — پلتفرم خبری", "Publishing · CMS"],
        ["تریدمن — معاملات هوشمند", "AI · Trading"],
        ["سامانه‌ی ERP دولتی", "Enterprise · Govtech"],
      ] as [string, string][],
    },
    process: {
      badge: "فرآیند ما", title1: "از ایده تا", title2: "محصول جهانی",
      steps: [
        ["کشف و مشاوره", "تحلیل نیاز، تعیین scope، طراحی نقشه‌راه فنی."],
        ["طراحی UX/UI", "Wireframe، Prototype و طراحی Design System اختصاصی."],
        ["توسعه چابک", "Sprint‌های دو هفته‌ای با تحویل مداوم و تست خودکار."],
        ["تست و امنیت", "QA، Pen-test و بهینه‌سازی Performance قبل از Deploy."],
        ["استقرار و رشد", "CI/CD، مانیتورینگ ۲۴/۷ و پشتیبانی حرفه‌ای دائمی."],
      ] as [string, string][],
    },
    tech: { badge: "Tech Stack", title1: "ساخته شده با", title2: "بهترین‌ها", desc: "از مدرن‌ترین تکنولوژی‌های جهان برای ساخت محصولات شما استفاده می‌کنیم." },
    testimonials: {
      badge: "نظر مشتریان", title1: "رضایت‌مندی،", title2: "میراث ۱۵ ساله‌ی ما.",
      items: [
        ["مهدی", "تهران", "بنیان‌گذار استارتاپ", "اکثر شرکت‌های ایران و چند شرکت خارجی را شش ماه بررسی کردم تا به ستایش رسیدم. تخصص و حرفه‌ای‌گری بی‌نظیر."],
        ["رامین", "تبریز", "مدیر فنی", "با وجود تعداد زیاد پروژه‌های فعال، تمام نیازهای من را از قبل برنامه‌نویسی کرده بودند. سامانه‌ی پیچیده‌ام در کمتر از دو روز راه‌اندازی شد."],
        ["محمد", "شیراز", "صاحب کسب‌وکار", "تنها شرکت دارای اسکریپت طلای آبشده در کشور. سرعت پاسخگویی و کیفیت کار فوق‌العاده است."],
        ["راست‌چین", "مارکت‌پلیس", "همکار رسمی", "محصول تریدمن با ۹ فروش و ۷ دیدگاه پنج‌ستاره، بالاترین رضایت‌مندی را داشت."],
      ] as [string, string, string, string][],
    },
    faq: {
      badge: "سوالات متداول", title1: "هر چه می‌خواهید", title2: "بپرسید.",
      items: [
        ["چقدر سابقه در حوزه‌ی نرم‌افزار دارید؟", "بیش از ۱۵ سال فعالیت مستمر، با ۶٬۴۲۰ پروژه‌ی تکمیل‌شده و ۹٬۲۸۰ مشتری راضی."],
        ["آیا برای پروژه‌های اختصاصی هم کار می‌کنید؟", "بله — ما سایت آماده نمی‌فروشیم؛ سایت می‌سازیم."],
        ["از چه تکنولوژی‌هایی استفاده می‌کنید؟", "Next.js، React، NestJS، Laravel، Flutter، Kubernetes، AI و Blockchain."],
        ["پشتیبانی پس از تحویل چگونه است؟", "پشتیبانی حرفه‌ای ۲۴/۷ با SLA تضمین‌شده و به‌روزرسانی مکرر."],
        ["آیا مجوز رسمی دارید؟", "بله — شورای عالی انفورماتیک، نظام صنفی رایانه‌ای، TUV آلمان، ISO 9001 و اینماد."],
      ] as [string, string][],
    },
    blog: {
      badge: "بلاگ", title1: "تازه‌ترین", title2: "دانستنی‌ها.", all: "همه‌ی مقاله‌ها ←", more: "ادامه مطلب",
      items: [
        ["۱۰ دی ۱۴۰۴", "FinTech", "چگونه سایت خرید و فروش طلای آبشده راه‌اندازی کنیم؟", "هر آن‌چه قبل از طراحی پلتفرم معاملاتی طلا باید بدانید."],
        ["۱۲ مهر ۱۴۰۳", "Telegram", "چرا بازی‌های تلگرامی بسازیم؟", "بازار رو به رشد Mini-game‌های تلگرام و فرصت‌های درآمدی."],
        ["۲۷ خرداد ۱۴۰۳", "Crypto", "چرا از صرافی ارز دیجیتال استفاده کنیم؟", "مزایای صرافی‌های متمرکز و نکات امنیتی."],
      ] as [string, string, string, string][],
    },
    cta: {
      badge: "آماده‌ی شروع", title1: "ایده‌ی شما را به", title2: "محصولی جهانی", title3: "تبدیل می‌کنیم.",
      desc: "همین حالا یک جلسه‌ی مشاوره‌ی رایگان رزرو کنید — تیم ستایش در کمتر از ۲۴ ساعت پاسخ خواهد داد.",
      primary: "رزرو مشاوره", secondary: "تماس مستقیم",
      email: "ایمیل", telegram: "تلگرام", phone: "موبایل", tel1: "تلفن ۱", tel2: "تلفن ۲",
    },
    codeShowcase: {
      badge: "SETAYESH.OS · CONSOLE",
      title: "یک پلتفرم. بی‌نهایت قابلیت.",
      desc: "از ایجنت‌های هوش مصنوعی تا استقرار سراسری — همه‌چیز با چند خط کد.",
    },
    footer: {
      tagline: "بیش از ۱۵ سال تجربه در توسعه‌ی نرم‌افزار، AI، ERP، بلاکچین و زیرساخت سازمانی.",
      app: "اپلیکیشن را دریافت کنید", appDesc: "تجربه‌ی ستایش در جیب شما — اعلان لحظه‌ای پروژه‌ها و پشتیبانی مستقیم.",
      services: "خدمات", company: "شرکت", legal: "قانونی",
      servicesLinks: ["نرم‌افزار سفارشی", "هوش مصنوعی", "ERP / CRM", "بلاکچین", "موبایل", "سئو"],
      companyLinks: ["درباره ما", "نمونه‌کارها", "بلاگ", "تماس", "همکاری"],
      legalLinks: ["حریم خصوصی", "شرایط استفاده", "کوکی‌ها"],
      rights: "تمامی حقوق محفوظ است.",
      downloadIos: "نسخه مناسب آیفون", appStore: "Web App",
      downloadAndroid: "نسخه اندروید", googlePlay: "Direct Download",
    },
  },
  en: {
    dir: "ltr" as "rtl" | "ltr",
    name: "English",
    nav: { home: "Home", services: "Services", portfolio: "Portfolio", process: "Process", tech: "Tech", blog: "Blog", about: "About", contact: "Contact", cta: "Start a project" },
    hero: {
      badge: "System online",
      tag: "// SETAYESH.OS · v15.0",
      title1: "Designing",
      title2: "intelligent, enterprise",
      title3: "software products.",
      desc: "With 15+ years of experience, Setayesh builds custom software, AI solutions, ERP/CRM, blockchain, mobile apps and dedicated infrastructure for ambitious teams.",
      ctaPrimary: "Start a project",
      ctaSecondary: "Explore services",
      stats: [{ v: "15+ years" }, { v: "6,420+ projects" }, { v: "9,280+ clients" }, { v: "Enterprise solutions" }],
      mrr: "MRR", latency: "LATENCY P95", throughput: "THROUGHPUT", error: "ERROR RATE",
      opsLive: "ops · live", streaming: "streaming", terminal: "live deployment terminal",
    },
    stats: { projects: "Projects shipped", clients: "Happy clients", years: "Years in business", experts: "Active experts" },
    services: {
      badge: "What we do", title1: "One team.", title2: "Twelve disciplines.", title3: "One platform for your digital growth.",
      desc: "From enterprise software to AI and blockchain — Setayesh has delivered 6,420+ successful projects.",
      cta: "Learn more",
      list: [
        ["Artificial Intelligence", "Custom models, LLM integration, chatbots, computer vision and predictive systems."],
        ["Custom Software", "Scalable enterprise platforms with Node.js, NestJS, Laravel and microservices."],
        ["Web Development", "E-commerce, news, fiat & crypto exchanges, custom CMS and listing platforms."],
        ["Android Apps", "Native and Flutter apps with premium UX and full backend integration."],
        ["iOS Apps", "Swift-built iOS apps following App Store standards for global markets."],
        ["ERP & CRM", "Office automation for large public and private organizations with custom modules."],
        ["Blockchain", "OTC exchanges, gold marketplace, wallets, tokenization and smart contracts."],
        ["Server Infrastructure", "Server config, Kubernetes, Docker, CDN, load balancing and security."],
        ["Dedicated Hosting", "Private data center setup, 24/7 monitoring and guaranteed SLA."],
        ["SEO & Marketing", "Technical + content SEO until you rank on Google's first page."],
        ["CMS & Scripts", "Custom e-commerce, news, gold-trading and multi-vendor scripts."],
        ["Startup Consulting", "From idea to MVP, product architecture and CTO-as-a-Service."],
      ] as [string, string][],
    },
    portfolio: {
      badge: "Selected work", title1: "Products that", title2: "speak for themselves.", all: "View all →",
      items: [
        ["Goldman — Gold Trading Script", "Marketplace · Trading"],
        ["OTC Crypto Exchange", "Blockchain · FinTech"],
        ["Multi-vendor Script", "E-commerce · SaaS"],
        ["Newsman — Publishing Platform", "Publishing · CMS"],
        ["Trademan — Smart Trading", "AI · Trading"],
        ["Government ERP System", "Enterprise · Govtech"],
      ] as [string, string][],
    },
    process: {
      badge: "How we work", title1: "From idea to", title2: "global product",
      steps: [
        ["Discovery", "Needs analysis, scope definition, technical roadmap."],
        ["UX / UI Design", "Wireframes, prototypes and a tailored design system."],
        ["Agile Delivery", "Two-week sprints with continuous delivery and automated testing."],
        ["QA & Security", "Pen-testing and performance tuning before deployment."],
        ["Deploy & Grow", "CI/CD, 24/7 monitoring and ongoing premium support."],
      ] as [string, string][],
    },
    tech: { badge: "Tech Stack", title1: "Built with", title2: "the best", desc: "We use the world's most modern technologies to ship your product." },
    testimonials: {
      badge: "Testimonials", title1: "Client trust,", title2: "earned over 15 years.",
      items: [
        ["Mehdi", "Tehran", "Startup founder", "I evaluated dozens of companies for six months before finding Setayesh. The expertise is unmatched."],
        ["Ramin", "Tabriz", "CTO", "Despite their workload, everything I needed was already built. My complex system was live in under two days."],
        ["Mohammad", "Shiraz", "Business owner", "The only team with a proper gold-trading script. Response time and quality are exceptional."],
        ["RastChin", "Marketplace", "Partner", "Trademan has 9 sales and 7 five-star reviews — the highest satisfaction on our platform."],
      ] as [string, string, string, string][],
    },
    faq: {
      badge: "FAQ", title1: "Ask us", title2: "anything.",
      items: [
        ["How experienced is Setayesh?", "15+ years in business, 6,420 completed projects and 9,280 happy clients."],
        ["Do you take custom projects?", "Yes — we don't sell templates, we build products from scratch."],
        ["Which technologies do you use?", "Next.js, React, NestJS, Laravel, Flutter, Kubernetes, AI and Blockchain."],
        ["What about post-launch support?", "Premium 24/7 support with guaranteed SLA and regular updates."],
        ["Are you officially certified?", "Yes — Supreme Informatics Council, TUV Germany, ISO 9001 and more."],
      ] as [string, string][],
    },
    blog: {
      badge: "Blog", title1: "Latest", title2: "insights.", all: "All articles →", more: "Read more",
      items: [
        ["Dec 31, 2025", "FinTech", "How to launch a gold-trading marketplace", "Everything to know before designing a precious-metals trading platform."],
        ["Oct 3, 2024", "Telegram", "Why build Telegram mini-games?", "The booming market of Telegram mini-games and revenue opportunities."],
        ["Jun 16, 2024", "Crypto", "Why use a crypto exchange?", "Centralized exchange benefits compared to standalone wallets."],
      ] as [string, string, string, string][],
    },
    cta: {
      badge: "Ready to start", title1: "Turn your idea into", title2: "a global product", title3: ".",
      desc: "Book a free consultation now — we'll respond in under 24 hours.",
      primary: "Book a call", secondary: "Call directly",
      email: "Email", telegram: "Telegram", phone: "Mobile", tel1: "Tel 1", tel2: "Tel 2",
    },
    codeShowcase: {
      badge: "SETAYESH.OS · CONSOLE",
      title: "One platform. Infinite capabilities.",
      desc: "From AI agents to global deployment — all in a few lines of code.",
    },
    footer: {
      tagline: "15+ years building software, AI, ERP, blockchain and enterprise infrastructure.",
      app: "Get the app", appDesc: "The Setayesh experience in your pocket — instant project alerts and direct support.",
      services: "Services", company: "Company", legal: "Legal",
      servicesLinks: ["Custom Software", "Artificial Intelligence", "ERP / CRM", "Blockchain", "Mobile", "SEO"],
      companyLinks: ["About", "Portfolio", "Blog", "Contact", "Careers"],
      legalLinks: ["Privacy", "Terms", "Cookies"],
      rights: "All rights reserved.",
      downloadIos: "iPhone version", appStore: "Web App",
      downloadAndroid: "Android version", googlePlay: "Direct Download",
    },
  },
  ar: {
    dir: "rtl" as "rtl" | "ltr",
    name: "العربية",
    nav: { home: "الرئيسية", services: "الخدمات", portfolio: "أعمالنا", process: "المنهجية", tech: "التقنيات", blog: "المدونة", about: "من نحن", contact: "اتصل بنا", cta: "ابدأ مشروعك" },
    hero: {
      badge: "النظام يعمل",
      tag: "// SETAYESH.OS · v15.0",
      title1: "تصميم وتطوير",
      title2: "برمجيات مؤسسية",
      title3: "ذكية ومخصّصة",
      desc: "بأكثر من ۱۵ سنة من الخبرة، تقدّم ستايش حلول البرمجة المخصصة، الذكاء الاصطناعي، ERP، CRM، البلوكشين، تطبيقات الجوال والبنية التحتية.",
      ctaPrimary: "ابدأ مشروعك",
      ctaSecondary: "استعرض الخدمات",
      stats: [{ v: "۱۵+ سنة" }, { v: "+۶٬۴۲۰ مشروع" }, { v: "+۹٬۲۸۰ عميل" }, { v: "حلول مؤسسية" }],
      mrr: "MRR", latency: "LATENCY P95", throughput: "THROUGHPUT", error: "ERROR RATE",
      opsLive: "ops · live", streaming: "streaming", terminal: "محطة النشر الحية",
    },
    stats: { projects: "مشروع مكتمل", clients: "عميل راضٍ", years: "سنة خبرة", experts: "خبير نشط" },
    services: {
      badge: "خدماتنا", title1: "فريق واحد.", title2: "اثنا عشر تخصصاً.", title3: "منصة واحدة لنموك الرقمي.",
      desc: "من البرمجيات المؤسسية إلى الذكاء الاصطناعي والبلوكشين — أكثر من ۶٬۴۲۰ مشروعاً ناجحاً.",
      cta: "اقرأ المزيد",
      list: [
        ["الذكاء الاصطناعي", "نماذج مخصصة، تكامل LLM، روبوتات الدردشة، الرؤية الحاسوبية والتنبؤ."],
        ["البرمجيات المخصصة", "منصات مؤسسية قابلة للتوسع باستخدام Node.js وNestJS وLaravel."],
        ["تطوير الويب", "متاجر، مواقع إخبارية، منصات تداول العملات والإعلانات."],
        ["تطبيقات Android", "تطبيقات Native وFlutter بأداء عالي وتجربة متميزة."],
        ["تطبيقات iOS", "تطبيقات iOS بـ Swift وفق معايير App Store."],
        ["ERP وCRM", "أتمتة المكاتب للمؤسسات الكبيرة بوحدات مخصصة."],
        ["البلوكشين", "منصات OTC، تداول الذهب، المحافظ، الترميز والعقود الذكية."],
        ["البنية التحتية", "إعداد الخوادم، Kubernetes، Docker، CDN والأمان."],
        ["الاستضافة المخصصة", "إعداد مركز بيانات خاص، مراقبة ۲۴/۷ وSLA مضمون."],
        ["السيو والتسويق", "سيو تقني ومحتوى حتى تصل للصفحة الأولى من Google."],
        ["CMS وسكريبتات", "سكريبتات مخصصة للتجارة، الأخبار، تداول الذهب ومتعدد البائعين."],
        ["استشارات الشركات الناشئة", "من الفكرة إلى MVP، تصميم البنية وقيادة فنية."],
      ] as [string, string][],
    },
    portfolio: {
      badge: "أعمال مختارة", title1: "منتجات", title2: "تتحدث عن نفسها.", all: "عرض الكل ←",
      items: [
        ["جولدمان — سكريبت تداول الذهب", "Marketplace · Trading"],
        ["منصة OTC للعملات", "Blockchain · FinTech"],
        ["سكريبت متعدد المتاجر", "E-commerce · SaaS"],
        ["نيوزمان — منصة إخبارية", "Publishing · CMS"],
        ["تريدمان — تداول ذكي", "AI · Trading"],
        ["نظام ERP حكومي", "Enterprise · Govtech"],
      ] as [string, string][],
    },
    process: {
      badge: "منهجيتنا", title1: "من الفكرة إلى", title2: "منتج عالمي",
      steps: [
        ["الاكتشاف", "تحليل المتطلبات وتحديد النطاق وخارطة الطريق."],
        ["تصميم UX/UI", "Wireframes ونماذج أولية ونظام تصميم مخصص."],
        ["تطوير Agile", "Sprint كل أسبوعين مع تسليم مستمر واختبار آلي."],
        ["الجودة والأمان", "اختبارات الاختراق وضبط الأداء قبل النشر."],
        ["النشر والنمو", "CI/CD، مراقبة ۲۴/۷ ودعم متميز مستمر."],
      ] as [string, string][],
    },
    tech: { badge: "Tech Stack", title1: "مبني بـ", title2: "الأفضل", desc: "نستخدم أحدث التقنيات في العالم لبناء منتجاتك." },
    testimonials: {
      badge: "آراء العملاء", title1: "ثقة العملاء،", title2: "إرث ۱۵ عاماً.",
      items: [
        ["مهدي", "طهران", "مؤسس شركة ناشئة", "قيّمت العشرات من الشركات لستة أشهر قبل أن أصل إلى ستايش. الخبرة استثنائية."],
        ["رامين", "تبريز", "مدير تقني", "رغم ضغط العمل، كل ما احتجته كان جاهزاً. منصتي المعقدة نُشرت خلال يومين."],
        ["محمد", "شيراز", "صاحب عمل", "الفريق الوحيد لديه سكريبت تداول الذهب الحقيقي. السرعة والجودة استثنائية."],
        ["راست‌چين", "Marketplace", "شريك رسمي", "تريدمان حصل على ۹ مبيعات و۷ تقييمات بخمس نجوم."],
      ] as [string, string, string, string][],
    },
    faq: {
      badge: "الأسئلة الشائعة", title1: "اسألنا", title2: "أي شيء.",
      items: [
        ["ما خبرة ستايش؟", "+۱۵ سنة و۶٬۴۲۰ مشروعاً مكتملاً و۹٬۲۸۰ عميلاً راضياً."],
        ["هل تنفّذون مشاريع مخصصة؟", "نعم — لا نبيع قوالب، نبني منتجات من الصفر."],
        ["ما التقنيات المستخدمة؟", "Next.js، React، NestJS، Laravel، Flutter، Kubernetes، AI وBlockchain."],
        ["ماذا عن الدعم بعد الإطلاق؟", "دعم متميز ۲۴/۷ مع SLA مضمون وتحديثات منتظمة."],
        ["هل لديكم شهادات رسمية؟", "نعم — مجلس المعلوماتية، TUV الألمانية، ISO 9001 وأكثر."],
      ] as [string, string][],
    },
    blog: {
      badge: "المدونة", title1: "أحدث", title2: "الرؤى.", all: "كل المقالات ←", more: "اقرأ المزيد",
      items: [
        ["۳۱ ديسمبر ۲۰۲۵", "FinTech", "كيف تطلق منصة تداول الذهب؟", "كل ما تحتاج معرفته قبل تصميم منصة تداول المعادن النفيسة."],
        ["۳ أكتوبر ۲۰۲۴", "Telegram", "لماذا بناء ألعاب تيليجرام؟", "سوق ألعاب تيليجرام المصغّرة وفرص الدخل."],
        ["۱۶ يونيو ۲۰۲۴", "Crypto", "لماذا منصة تداول مركزية؟", "مزايا المنصات المركزية مقارنة بالمحافظ."],
      ] as [string, string, string, string][],
    },
    cta: {
      badge: "جاهز للبدء", title1: "حوّل فكرتك إلى", title2: "منتج عالمي", title3: ".",
      desc: "احجز استشارة مجانية الآن — نرد خلال ۲۴ ساعة.",
      primary: "احجز مكالمة", secondary: "اتصل مباشرة",
      email: "البريد", telegram: "تيليجرام", phone: "جوال", tel1: "هاتف ۱", tel2: "هاتف ۲",
    },
    codeShowcase: {
      badge: "SETAYESH.OS · CONSOLE",
      title: "منصّة واحدة. إمكانات لا نهائية.",
      desc: "من وكلاء الذكاء الاصطناعي إلى النشر العالمي — بأسطر قليلة من الكود.",
    },
    footer: {
      tagline: "+۱۵ سنة من بناء البرمجيات والذكاء الاصطناعي وERP والبلوكشين والبنية المؤسسية.",
      app: "حمّل التطبيق", appDesc: "تجربة ستايش في جيبك — تنبيهات فورية ودعم مباشر.",
      services: "الخدمات", company: "الشركة", legal: "قانوني",
      servicesLinks: ["برمجيات مخصصة", "الذكاء الاصطناعي", "ERP / CRM", "بلوكشين", "تطبيقات", "سيو"],
      companyLinks: ["من نحن", "أعمالنا", "المدونة", "تواصل", "وظائف"],
      legalLinks: ["الخصوصية", "الشروط", "ملفات تعريف الارتباط"],
      rights: "جميع الحقوق محفوظة.",
      downloadIos: "نسخة آيفون", appStore: "Web App",
      downloadAndroid: "نسخة أندرويد", googlePlay: "Direct Download",
    },
  },
};

type Dict = typeof baseTranslations.fa;

export type LandingTranslationOverrides = Partial<Record<string, Partial<Dict>>>;

const fallbackLanguages: LanguageOption[] = [
  { code: "fa", direction: "rtl", isDefault: true, name: "Persian", nativeName: "فارسی", sortOrder: 0 },
  { code: "en", direction: "ltr", name: "English", nativeName: "English", sortOrder: 1 },
  { code: "ar", direction: "rtl", name: "Arabic", nativeName: "العربية", sortOrder: 2 },
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://noghre.land/api/v1";

type Ctx = {
  dir: Direction;
  lang: Lang;
  languages: LanguageOption[];
  setLang: (l: Lang) => void;
  t: Dict;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({
  children,
  cmsTranslations,
}: {
  children: ReactNode;
  cmsTranslations?: LandingTranslationOverrides;
}) {
  // The first client render must use the same snapshot as SSR. Browser storage is
  // restored after hydration; reading it in a state initializer changes rendered
  // labels/icons before React can hydrate the server markup.
  const [languages, setLanguages] = useState<LanguageOption[]>(fallbackLanguages);
  const [lang, setLangState] = useState<Lang>(() => resolveDefaultLanguage(fallbackLanguages).code);
  const [theme, setThemeState] = useState<Theme>("light");
  const [storageRestored, setStorageRestored] = useState(false);

  useEffect(() => {
    try {
      const sl = localStorage.getItem("lang");
      const storedLanguages = localStorage.getItem("languages");
      const st = localStorage.getItem("theme") as Theme | null;
      if (storedLanguages) {
        const parsed = JSON.parse(storedLanguages) as unknown;
        if (Array.isArray(parsed)) {
          const normalized = parsed.map(normalizeLanguageOption).filter((item): item is LanguageOption => Boolean(item));
          if (normalized.length) setLanguages(sortLanguages(normalized));
        }
      }
      if (sl) setLangState(sl);
      if (st === "light" || st === "dark") setThemeState(st);
    } catch {}
    setStorageRestored(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1_200);

    void fetch(`${API_BASE}/localization/languages`, {
      cache: "force-cache",
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : undefined)
      .then((payload) => {
        if (cancelled || !Array.isArray(payload)) return;
        const normalized = payload.map(normalizeLanguageOption).filter((item): item is LanguageOption => Boolean(item));
        if (!normalized.length) return;
        const sorted = sortLanguages(normalized);
        setLanguages(sorted);
        try { localStorage.setItem("languages", JSON.stringify(sorted)); } catch {}
        if (!sorted.some((item) => item.code === lang)) {
          setLangState(resolveDefaultLanguage(sorted).code);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [lang]);

  const currentLanguage = useMemo(
    () => languages.find((item) => item.code === lang) ?? fallbackLanguages.find((item) => item.code === lang) ?? resolveDefaultLanguage(languages),
    [lang, languages],
  );
  const dir = currentLanguage.direction;

  const setLang = useCallback((nextLang: Lang) => {
    const nextLanguage = languages.find((item) => item.code === nextLang)
      ?? fallbackLanguages.find((item) => item.code === nextLang)
      ?? resolveDefaultLanguage(languages);
    setLangState(nextLang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLang;
      document.documentElement.dir = nextLanguage.direction;
    }
    try {
      localStorage.setItem("lang", nextLang);
      localStorage.setItem("langDir", nextLanguage.direction);
    } catch {}
  }, [languages]);

  useEffect(() => {
    if (!storageRestored) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem("lang", lang);
      localStorage.setItem("langDir", dir);
    } catch {}
  }, [dir, lang, storageRestored]);

  useEffect(() => {
    if (!storageRestored) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    try { localStorage.setItem("theme", theme); } catch {}
  }, [storageRestored, theme]);

  const value = useMemo<Ctx>(() => ({
    dir,
    lang,
    languages,
    setLang,
    t: mergeTranslation(baseTranslations[lang as keyof typeof baseTranslations] ?? baseTranslations.fa, cmsTranslations?.[lang]),
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState(t => (t === "dark" ? "light" : "dark")),
  }), [cmsTranslations, dir, lang, languages, setLang, theme]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}

export const LANGS: Lang[] = fallbackLanguages.map((item) => item.code);

export function languageLabel(language: LanguageOption) {
  return language.nativeName || language.name || language.code.toUpperCase();
}

export function languageShortLabel(lang: string) {
  return lang.toUpperCase();
}

function normalizeLanguageOption(value: unknown): LanguageOption | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const code = typeof record.code === "string" && record.code.trim() ? record.code.trim() : "";
  if (!code) return null;
  const rawDirection = typeof record.direction === "string" ? record.direction.toUpperCase() : undefined;
  const direction: Direction = rawDirection === "LTR" || rawDirection === "ltr" ? "ltr" : "rtl";
  return {
    code,
    direction,
    isDefault: record.isDefault === true,
    name: typeof record.name === "string" && record.name.trim() ? record.name : code.toUpperCase(),
    nativeName: typeof record.nativeName === "string" && record.nativeName.trim() ? record.nativeName : typeof record.name === "string" ? record.name : code.toUpperCase(),
    sortOrder: typeof record.sortOrder === "number" ? record.sortOrder : 0,
  };
}

function sortLanguages(items: LanguageOption[]) {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.code.localeCompare(b.code));
}

function resolveDefaultLanguage(items: LanguageOption[]) {
  return items.find((item) => item.isDefault) ?? items[0] ?? fallbackLanguages[0];
}

function mergeTranslation(base: Dict, override?: Partial<Dict>): Dict {
  if (!override) return base;
  return deepMerge(base, override) as Dict;
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base) || Array.isArray(override)) return override;
  if (typeof base !== "object" || typeof override !== "object") return override;

  const output: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    output[key] = deepMerge(output[key], value);
  }
  return output;
}
