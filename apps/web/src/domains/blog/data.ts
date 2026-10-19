import type { Lang } from "@/shared/i18n";
import { formatPlatformDate } from "@/shared/lib/date-format";

export type Localized = Record<Lang, string>;

export type BlogPost = {
  slug: string;
  category: string;
  tags: string[];
  date: string; // ISO
  readMin: number;
  author: { name: Localized; role: Localized; avatar: string };
  title: Localized;
  excerpt: Localized;
  cover: string; // local image path or tailwind gradient classes
  content: Localized; // markdown-lite (## headings, paragraphs, - bullets, ```code)
};

const author = {
  name: { fa: "تیم ستایش", en: "Setayesh Team", ar: "فريق ستايش" },
  role: { fa: "تحریریه فنی", en: "Engineering Editorial", ar: "التحرير الهندسي" },
  avatar: "S",
};

export const POSTS: BlogPost[] = [
  {
    slug: "launch-melted-gold-marketplace",
    category: "دانستنی ها",
    tags: ["gold", "melted-gold", "marketplace", "payments", "kyc", "seo"],
    date: "2026-01-10",
    readMin: 12,
    author,
    cover: "/assets/legacy/setayeshco/post_1767202905.jpg",
    title: {
      fa: "چگونه سایت خرید و فروش طلای آبشده راه‌اندازی کنیم؟ هرآنچه قبل از طراحی باید بدانید",
      en: "How to Launch a Melted-Gold Trading Website: What to Know Before Design",
      ar: "كيف تطلق موقعا لشراء وبيع الذهب المذاب؟ كل ما يجب معرفته قبل التصميم",
    },
    excerpt: {
      fa: "راهنمای کامل طراحی سایت خرید و فروش طلای آبشده؛ از قیمت لحظه‌ای، امنیت، احراز هویت و تسویه تا سئو و اعتمادسازی.",
      en: "A practical guide to melted-gold marketplace design, real-time pricing, security, KYC, settlement and SEO.",
      ar: "دليل عملي لتصميم منصة ذهب مذاب مع التسعير اللحظي والأمان والتحقق والتسوية وتحسين محركات البحث.",
    },
    content: {
      fa: `## مقدمه\nبا رشد سرمایه گذاری آنلاین و افزایش نوسانات بازار طلا، بسیاری از فعالان این حوزه به دنبال راهی مطمئن برای خرید و فروش طلای آبشده به صورت آنلاین هستند.\n\n## آیا راه اندازی این سایت توجیه دارد؟\nطلای آبشده به دلیل نداشتن اجرت، نقدشوندگی بالا و محبوبیت در بین سرمایه گذاران، یکی از پرمعامله ترین بخش های بازار طلاست. ورود این بازار به فضای آنلاین محدودیت زمان و مکان را حذف می کند و سرعت معاملات را افزایش می دهد.\n\n## امکانات ضروری\nپلتفرم باید قیمت لحظه ای، سفارش خرید و فروش، محاسبه دقیق وزن و کارمزد، احراز هویت، امنیت پرداخت، لاگ مالی و داشبورد مدیریت را پوشش دهد.\n\n## سئو و اعتماد\nصفحات محتوایی هدفمند، اسکیما، سرعت، FAQ و قوانین شفاف باعث رتبه بهتر و اعتماد بیشتر کاربران می شود.`,
      en: `## Introduction\nAs online investment grows and gold prices fluctuate, businesses need a reliable way to buy and sell melted gold online.\n\n## Why It Makes Sense\nMelted gold is attractive because it has no making charge, high liquidity and strong investor demand. Online trading removes time and location limits.\n\n## Essential Features\nThe platform needs real-time pricing, buy and sell orders, precise weight and fee calculation, KYC, secure payment, financial logs and an admin dashboard.\n\n## SEO and Trust\nTargeted content, schema, speed, FAQs and transparent rules help the product rank and convert users.`,
      ar: `## مقدمة\nمع نمو الاستثمار عبر الإنترنت وتقلب أسعار الذهب، تحتاج الشركات إلى طريقة موثوقة لبيع وشراء الذهب المذاب.\n\n## جدوى المشروع\nالذهب المذاب بلا أجور صياغة، عالي السيولة ومطلوب بين المستثمرين. التداول عبر الإنترنت يزيل حدود الوقت والمكان.\n\n## الميزات الأساسية\nتحتاج المنصة إلى سعر لحظي، أوامر شراء وبيع، حساب الوزن والعمولة، تحقق هوية، دفع آمن ولوحة إدارة.\n\n## السيو والثقة\nالمحتوى المتخصص، البيانات المنظمة، السرعة، الأسئلة الشائعة والقوانين الواضحة تساعد على الظهور والثقة.`,
    },
  },
  {
    slug: "telegram-mini-games-opportunity",
    category: "دانستنی ها",
    tags: ["telegram", "mini-game", "mini-apps", "growth", "gamification"],
    date: "2024-10-03",
    readMin: 7,
    author,
    cover: "/assets/legacy/setayeshco/post_1727921756.png",
    title: {
      fa: "چرا بازی های تلگرامی بسازیم؟",
      en: "Why You Should Build a Telegram Mini-Game",
      ar: "لماذا تبني لعبة تيليجرام؟",
    },
    excerpt: {
      fa: "بازی های تلگرامی روشی سریع، کم هزینه و ویروسی برای افزایش تعامل کاربران، معرفی برند و رشد کسب و کار هستند.",
      en: "Telegram games are a fast, low-friction way to increase engagement, spread a brand and launch viral campaigns.",
      ar: "ألعاب تيليجرام طريقة سريعة ومنخفضة التكلفة لزيادة التفاعل ونشر العلامة التجارية.",
    },
    content: {
      fa: `## چرا بازی تلگرامی جذاب است؟\nتلگرام یکی از پرکاربردترین پیام رسان های دنیاست و کاربران آن به دنبال محتوای جدید، ساده و قابل اشتراک گذاری هستند.\n\n## تعامل و رشد\nگروه ها، کانال ها، جدول امتیاز، دعوت دوستان و چالش های روزانه باعث می شوند بازی به شکل طبیعی بین کاربران پخش شود.\n\n## کاربرد تجاری\nبازی تلگرامی می تواند برای معرفی محصول، جمع آوری لید، افزایش آگاهی از برند و ارائه تخفیف استفاده شود.`,
      en: `## Why Telegram Games Work\nTelegram has a massive active audience and users share lightweight content inside chats, groups and channels.\n\n## Engagement and Growth\nLeaderboards, friend invites, rewards and daily challenges encourage users to share the experience.\n\n## Business Use Cases\nA Telegram game can introduce products, collect leads, distribute discounts and support campaigns.`,
      ar: `## لماذا تعمل ألعاب تيليجرام؟\nيملك تيليجرام جمهورا ضخما ويشارك المستخدمون المحتوى الخفيف داخل المجموعات والقنوات.\n\n## التفاعل والنمو\nجداول النقاط، دعوة الأصدقاء والجوائز تشجع المستخدمين على مشاركة اللعبة.\n\n## استخدامات تجارية\nيمكن استخدام اللعبة للتعريف بالمنتجات وجمع العملاء المحتملين وتقديم الخصومات.`,
    },
  },
  {
    slug: "why-use-crypto-exchange",
    category: "دانستنی ها",
    tags: ["crypto-exchange", "exchange", "token", "blockchain", "security", "trading"],
    date: "2024-06-16",
    readMin: 8,
    author,
    cover: "/assets/legacy/setayeshco/post_1718527731.jpg",
    title: {
      fa: "چرا از صرافی ارز دیجیتال استفاده کنیم؟",
      en: "Why Use a Centralized Crypto Exchange",
      ar: "لماذا تستخدم منصة تداول مركزية؟",
    },
    excerpt: {
      fa: "دلایل استفاده از صرافی ارز دیجیتال؛ امنیت، سرعت، تنوع رمزارزها، ساخت توکن اختصاصی و بلاکچین اختصاصی.",
      en: "Why crypto exchanges matter: security, speed, asset variety, custom token creation and private blockchain design.",
      ar: "أسباب استخدام منصة تداول العملات الرقمية: الأمان والسرعة وتنوع الأصول والرموز المخصصة.",
    },
    content: {
      fa: `## چرا صرافی ارز دیجیتال؟\nصرافی ارز دیجیتال یکی از بهترین راه ها برای ورود به بازار رمزارزهاست و معامله امن، سریع و ساده را فراهم می کند.\n\n## مزایا\nامنیت بالا، سرعت معامله، تنوع ارزها، کارمزد کمتر، ساخت توکن اختصاصی و امکان طراحی بلاکچین اختصاصی از مزایای مهم این حوزه هستند.\n\n## نتیجه گیری\nطراحی صرافی حرفه ای باید فنی، مالی، امنیتی و تجربه محور باشد.`,
      en: `## Why Use a Crypto Exchange?\nA crypto exchange combines fast trading, secure accounts, asset management and market access.\n\n## Benefits\nSecurity, speed, asset variety, lower fees, custom token creation and private blockchain design make exchanges powerful products.\n\n## Conclusion\nA professional exchange needs product design, financial logic and security engineering from day one.`,
      ar: `## لماذا منصة تداول؟\nمنصة تداول العملات الرقمية تجمع التداول السريع والحسابات الآمنة وإدارة المحافظ في تجربة واحدة.\n\n## المزايا\nالأمان، السرعة، تنوع الأصول، الرسوم الأقل، الرموز المخصصة والبلوكچين الخاص من أهم الفوائد.`,
    },
  },
  {
    slug: "decentralized-app-dapp-development",
    category: "مهارت ها",
    tags: ["dapp", "decentralized-app", "blockchain", "web3", "smart-contract"],
    date: "2024-01-08",
    readMin: 9,
    author,
    cover: "/assets/legacy/setayeshco/post_1704688156.jpg",
    title: {
      fa: "طراحی اپ غیر متمرکز (dapp)",
      en: "Decentralized App (DApp) Development",
      ar: "تصميم تطبيق لا مركزي (DApp)",
    },
    excerpt: {
      fa: "راهنمای طراحی و توسعه اپ غیر متمرکز؛ از قرارداد هوشمند و کیف پول تا تجربه کاربری، امنیت و مقیاس پذیری.",
      en: "A practical guide to DApp design, smart contracts, wallet connection, UX, security and scalability.",
      ar: "دليل لتصميم تطبيقات DApp والعقود الذكية وربط المحافظ وتجربة المستخدم والأمان.",
    },
    content: {
      fa: `## اپ غیر متمرکز چیست؟\nDApp نرم افزاری است که منطق اصلی آن روی بلاکچین و قراردادهای هوشمند اجرا می شود.\n\n## اجزای اصلی\nقرارداد هوشمند، رابط وب یا موبایل، اتصال کیف پول، ایندکسر داده و ماژول های امنیتی اجزای اصلی محصول هستند.\n\n## امنیت و تجربه کاربری\nاتصال کیف پول، کارمزد، وضعیت تراکنش و خطاها باید ساده باشد و قرارداد هوشمند قبل از انتشار تست و ممیزی شود.`,
      en: `## What Is a DApp?\nA decentralized app runs its core logic through blockchain networks and smart contracts.\n\n## Core Components\nSmart contracts, a web or mobile interface, wallet connection, data indexing and security modules shape the product.\n\n## UX and Security\nWallet connection, gas fees and transaction states must be clear, while contracts need testing and audits before launch.`,
      ar: `## ما هو DApp؟\nالتطبيق اللامركزي يعمل من خلال شبكة بلوكچين وعقود ذكية.\n\n## المكونات\nالعقود الذكية، واجهة الويب أو الموبايل، ربط المحفظة، فهرسة البيانات ووحدات الأمان.\n\n## الأمان والتجربة\nيجب تبسيط الرسوم وحالة المعاملة واختبار العقود قبل الإطلاق.`,
    },
  },
  {
    slug: "what-is-blockchain",
    category: "دانستنی ها",
    tags: ["blockchain", "bitcoin", "defi", "nft", "smart-contract", "web3"],
    date: "2024-01-08",
    readMin: 10,
    author,
    cover: "/assets/legacy/setayeshco/post_1704688078.jpg",
    title: {
      fa: "بلاکچین چیست؟",
      en: "What Is Blockchain?",
      ar: "ما هي البلوكچين؟",
    },
    excerpt: {
      fa: "تعریف ساده بلاکچین، نحوه کار بلاک ها و نودها، کاربردها در ارز دیجیتال، NFT، دیفای و قرارداد هوشمند.",
      en: "A simple explanation of blockchain, blocks, nodes, cryptocurrency, NFTs, DeFi and smart contracts.",
      ar: "شرح مبسط للبلوكچين والكتل والعقد والعملات الرقمية وNFT وDeFi والعقود الذكية.",
    },
    content: {
      fa: `## بلاکچین چیست؟\nبلاکچین شبکه ای غیر متمرکز است که با رمزنگاری، تاریخچه تراکنش ها را در دفتر کل عمومی ذخیره می کند.\n\n## تعریف ساده\nداده ها در بسته هایی به نام بلاک ذخیره می شوند. هر بلاک پس از تایید به زنجیره اضافه می شود و نسخه ای از آن روی نودهای شبکه نگهداری می شود.\n\n## کاربردها\nارز دیجیتال، DApp، زنجیره تامین، رأی گیری، NFT و قرارداد هوشمند از کاربردهای مهم بلاکچین هستند.`,
      en: `## What Is Blockchain?\nBlockchain is a decentralized network that uses cryptography to store transaction history in a shared digital ledger.\n\n## Simple Definition\nTransactions are grouped into blocks, verified and added to a chain that network nodes keep copies of.\n\n## Use Cases\nCryptocurrency, DApps, supply-chain systems, voting, NFTs and smart contracts are major use cases.`,
      ar: `## ما هي البلوكچين؟\nالبلوكچين شبكة لا مركزية تستخدم التشفير لتخزين تاريخ المعاملات في دفتر رقمي مشترك.\n\n## تعريف بسيط\nتجمع المعاملات في كتل، يتم التحقق منها، ثم تضاف إلى السلسلة وتحتفظ العقد بنسخ منها.\n\n## الاستخدامات\nالعملات الرقمية، التطبيقات اللامركزية، سلسلة التوريد، التصويت، NFT والعقود الذكية.`,
    },
  },
  {
    slug: "what-is-nft",
    category: "مهارت ها",
    tags: ["nft", "blockchain", "digital-asset", "marketplace", "web3"],
    date: "2024-01-08",
    readMin: 8,
    author,
    cover: "/assets/legacy/setayeshco/post_1704687929.jpg",
    title: {
      fa: "ان اف تی(NFT) چیست؟",
      en: "What Is an NFT?",
      ar: "ما هو NFT؟",
    },
    excerpt: {
      fa: "NFT چیست و چگونه مالکیت دیجیتال، هنر، بازی، کلکسیون و بازارهای Web3 را متحول می کند؟",
      en: "What NFTs are and how they change digital ownership, art, games, collectibles and Web3 marketplaces.",
      ar: "ما هي رموز NFT وكيف تغير الملكية الرقمية والفن والألعاب والأسواق اللامركزية.",
    },
    content: {
      fa: `## NFT چیست؟\nNFT یا توکن غیر قابل تعویض یک دارایی دیجیتال منحصر به فرد است که مالکیت آن روی بلاکچین ثبت می شود.\n\n## کاربردها\nهنر دیجیتال، آیتم های بازی، زمین مجازی، موسیقی، بلیت رویداد، گواهی مالکیت و کلکسیون از کاربردهای رایج NFT هستند.\n\n## طراحی محصول\nبرای موفقیت در NFT باید داستان برند، ارزش دارایی، قرارداد هوشمند امن، صفحه فرود سئو شده و تجربه خرید ساده طراحی شود.`,
      en: `## What Is an NFT?\nAn NFT is a unique digital asset whose ownership is recorded on a blockchain.\n\n## Use Cases\nDigital art, game items, virtual land, music, event tickets, certificates and collectibles are common examples.\n\n## Product Design\nA successful NFT product needs a strong story, real value, secure smart contracts, SEO-ready landing pages and a simple buying experience.`,
      ar: `## ما هو NFT؟\nNFT هو أصل رقمي فريد تسجل ملكيته على البلوكچين.\n\n## الاستخدامات\nالفن الرقمي، عناصر الألعاب، الأراضي الافتراضية، الموسيقى، التذاكر والشهادات من أشهر الاستخدامات.\n\n## تصميم المنتج\nيحتاج المنتج إلى قصة واضحة، قيمة حقيقية، عقد ذكي آمن، صفحة سيو وتجربة شراء بسيطة.`,
    },
  },
];

export const CATEGORIES = Array.from(new Set(POSTS.map(p => p.category)));
export const ALL_TAGS = Array.from(new Set(POSTS.flatMap(p => p.tags)));

export function getPost(slug: string) {
  return POSTS.find(p => p.slug === slug);
}

export function relatedPosts(slug: string, n = 3) {
  const cur = getPost(slug);
  if (!cur) return [];
  return POSTS.filter(p => p.slug !== slug)
    .sort((a, b) => {
      const sa = (a.category === cur.category ? 2 : 0) + a.tags.filter(t => cur.tags.includes(t)).length;
      const sb = (b.category === cur.category ? 2 : 0) + b.tags.filter(t => cur.tags.includes(t)).length;
      return sb - sa;
    })
    .slice(0, n);
}

export function formatDate(iso: string, lang: Lang) {
  return formatPlatformDate(iso, { day: "numeric", month: "short", year: "numeric" }, lang);
}
