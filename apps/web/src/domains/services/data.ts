// Services catalog — sourced from setayeshco.ir
import { Code2, Smartphone, Brain, Boxes, Search, Megaphone, type LucideIcon } from "lucide-react";

export type Lang = "fa" | "en" | "ar";

export type Service = {
  slug: string;
  icon: LucideIcon;
  cover: string; // gradient classes
  title: Record<Lang, string>;
  short: Record<Lang, string>;
  description: Record<Lang, string>;
  features: Record<Lang, string[]>;
  technologies: string[];
  deliverables: Record<Lang, string[]>;
  process: Record<Lang, { title: string; desc: string }[]>;
  faqs: { q: Record<Lang, string>; a: Record<Lang, string> }[];
};

export const SERVICES: Service[] = [
  {
    slug: "web-design",
    icon: Code2,
    cover: "from-amber-500/30 via-yellow-500/20 to-orange-500/30",
    title: {
      fa: "طراحی سایت و اسکریپت",
      en: "Web Design & Custom Scripts",
      ar: "تصميم المواقع والسكريبتات",
    },
    short: {
      fa: "طراحی سایت و اسکریپت اختصاصی با بالاترین کیفیت و بروزترین تکنولوژی",
      en: "Custom websites and scripts built with the highest quality and latest technology.",
      ar: "تصميم مواقع وسكريبتات مخصصة بأعلى جودة وأحدث التقنيات.",
    },
    description: {
      fa: "تیم ستایش با بیش از ۱۵ سال سابقه، انواع وب‌سایت‌های سازمانی، شرکتی، خبری، فروشگاهی، چندفروشگاهی، صرافی فیات و رمزارز، طلای آبشده و آگهی را به‌صورت کاملاً اختصاصی طراحی و برنامه‌نویسی می‌کند.",
      en: "With over 15 years of experience, the Setayesh team designs and develops fully custom corporate, news, e-commerce, multi-vendor, fiat & crypto exchange, gold-trading and classifieds websites.",
      ar: "بخبرة تزيد عن 15 عاماً، يصمم فريق ستايش مواقع شركات وأخبار ومتاجر ومنصات بورصة وذهب وإعلانات بشكل مخصص بالكامل.",
    },
    features: {
      fa: [
        "طراحی کاملاً اختصاصی و واکنش‌گرا",
        "کدنویسی تمیز و امن با مهندسی نرم‌افزار",
        "پنل مدیریت پیشرفته و چندزبانه",
        "بهینه‌سازی سرعت و سئو از پایه",
        "اتصال به درگاه‌های پرداخت و APIها",
        "پشتیبانی و به‌روزرسانی بلندمدت",
      ],
      en: [
        "Fully bespoke responsive design",
        "Clean, secure, engineering-grade code",
        "Advanced multilingual admin panel",
        "Built-in speed & SEO optimization",
        "Payment gateways & API integrations",
        "Long-term support & updates",
      ],
      ar: [
        "تصميم متجاوب مخصص بالكامل",
        "كود نظيف وآمن بهندسة برمجية",
        "لوحة تحكم متقدمة متعددة اللغات",
        "تحسين السرعة والسيو منذ البداية",
        "تكامل مع بوابات الدفع وواجهات API",
        "دعم وتحديثات طويلة الأمد",
      ],
    },
    technologies: ["Laravel", "Node.js", "Vue 3", "React", "Next.js", "PostgreSQL", "Redis"],
    deliverables: {
      fa: ["سورس کامل پروژه", "مستندات فنی", "آموزش پنل مدیریت", "۶ ماه پشتیبانی رایگان"],
      en: ["Full project source code", "Technical documentation", "Admin panel training", "6 months free support"],
      ar: ["كود المشروع الكامل", "وثائق تقنية", "تدريب على لوحة التحكم", "دعم مجاني لمدة 6 أشهر"],
    },
    process: {
      fa: [
        { title: "تحلیل و مشاوره", desc: "بررسی نیازمندی‌ها و ارائه راه‌حل مهندسی" },
        { title: "طراحی UI/UX", desc: "طراحی رابط کاربری اختصاصی و آزمون قابلیت استفاده" },
        { title: "توسعه و تست", desc: "کدنویسی، بازبینی کد و تست‌های اتوماتیک" },
        { title: "استقرار و پشتیبانی", desc: "راه‌اندازی روی سرور و پشتیبانی مستمر" },
      ],
      en: [
        { title: "Discovery & consulting", desc: "Deep requirements analysis and engineering proposal" },
        { title: "UI/UX design", desc: "Custom interface design with usability testing" },
        { title: "Build & QA", desc: "Implementation, code review and automated tests" },
        { title: "Launch & support", desc: "Deployment and ongoing maintenance" },
      ],
      ar: [
        { title: "الاستكشاف والاستشارة", desc: "تحليل المتطلبات وعرض هندسي" },
        { title: "تصميم واجهة المستخدم", desc: "تصميم مخصص واختبار قابلية الاستخدام" },
        { title: "التطوير والاختبار", desc: "تنفيذ ومراجعة الكود واختبارات آلية" },
        { title: "الإطلاق والدعم", desc: "النشر والصيانة المستمرة" },
      ],
    },
    faqs: [
      {
        q: { fa: "زمان اجرای یک پروژه چقدر است؟", en: "How long does a project take?", ar: "كم يستغرق المشروع؟" },
        a: { fa: "بسته به اسکوپ پروژه از ۲ تا ۱۲ هفته متغیر است.", en: "Depending on scope, typically 2 to 12 weeks.", ar: "حسب النطاق، عادةً من 2 إلى 12 أسبوعاً." },
      },
    ],
  },
  {
    slug: "mobile-apps",
    icon: Smartphone,
    cover: "from-sky-500/30 via-blue-500/20 to-indigo-500/30",
    title: {
      fa: "اپلیکیشن اندروید و iOS",
      en: "Android & iOS Mobile Apps",
      ar: "تطبيقات أندرويد و iOS",
    },
    short: {
      fa: "طراحی و پیاده‌سازی اپلیکیشن با امکانات منحصر به فرد و ظاهری اختصاصی",
      en: "Design and development of mobile apps with unique features and a bespoke look & feel.",
      ar: "تصميم وتطوير تطبيقات بميزات فريدة وتصميم مخصص.",
    },
    description: {
      fa: "ساخت اپلیکیشن‌های نیتیو (Kotlin / Swift) و کراس‌پلتفرم (Flutter / React Native) با تمرکز بر عملکرد، امنیت و تجربه کاربری روان.",
      en: "We build native (Kotlin / Swift) and cross-platform (Flutter / React Native) mobile apps focused on performance, security and a smooth user experience.",
      ar: "نبني تطبيقات نيتيف (Kotlin / Swift) ومتعددة المنصات (Flutter / React Native) بتركيز على الأداء والأمان وتجربة سلسة.",
    },
    features: {
      fa: ["UI/UX اختصاصی", "نوتیفیکیشن لحظه‌ای", "احراز هویت امن", "آفلاین‌فرست", "اتصال به Backend اختصاصی", "انتشار در استورها"],
      en: ["Custom UI/UX", "Realtime notifications", "Secure authentication", "Offline-first architecture", "Custom backend integration", "Store publishing"],
      ar: ["واجهة مخصصة", "إشعارات لحظية", "مصادقة آمنة", "يعمل بدون إنترنت", "تكامل مع الخادم", "النشر في المتاجر"],
    },
    technologies: ["Flutter", "React Native", "Kotlin", "Swift", "Firebase"],
    deliverables: {
      fa: ["نسخه اندروید و iOS", "API و پنل مدیریت", "انتشار در گوگل‌پلی و اپ‌استور", "پشتیبانی"],
      en: ["Android & iOS builds", "API + admin dashboard", "Play Store & App Store publishing", "Support"],
      ar: ["نسختا أندرويد و iOS", "واجهة API + لوحة تحكم", "النشر في المتاجر", "الدعم"],
    },
    process: {
      fa: [
        { title: "تحلیل و طراحی", desc: "تعریف اسکوپ، طراحی UX و پروتوتایپ" },
        { title: "توسعه چابک", desc: "اسپرینت‌های کوتاه با تحویل مرتب" },
        { title: "تست و QA", desc: "تست روی دستگاه‌های واقعی" },
        { title: "انتشار", desc: "ارسال به استورها و مانیتورینگ" },
      ],
      en: [
        { title: "Design & scope", desc: "UX design and clickable prototype" },
        { title: "Agile build", desc: "Short sprints with frequent deliveries" },
        { title: "Testing & QA", desc: "Real device testing" },
        { title: "Publishing", desc: "Store submission and monitoring" },
      ],
      ar: [
        { title: "التصميم والنطاق", desc: "تصميم UX ونموذج أولي" },
        { title: "تطوير رشيق", desc: "سبرنتات قصيرة بتسليم منتظم" },
        { title: "الاختبار", desc: "اختبار على أجهزة حقيقية" },
        { title: "النشر", desc: "إرسال للمتاجر والمتابعة" },
      ],
    },
    faqs: [],
  },
  {
    slug: "artificial-intelligence",
    icon: Brain,
    cover: "from-fuchsia-500/30 via-purple-500/20 to-violet-500/30",
    title: {
      fa: "هوش مصنوعی",
      en: "Artificial Intelligence",
      ar: "الذكاء الاصطناعي",
    },
    short: {
      fa: "استفاده از هوش مصنوعی در پروژه‌ها برای تشخیص چهره، داده‌کاوی، Big Data و...",
      en: "AI capabilities for face recognition, data mining, big data and more.",
      ar: "قدرات الذكاء الاصطناعي للتعرف على الوجه وتنقيب البيانات والبيانات الضخمة.",
    },
    description: {
      fa: "پیاده‌سازی راه‌حل‌های مبتنی بر هوش مصنوعی شامل بینایی ماشین، NLP، سیستم‌های توصیه‌گر و عامل‌های هوشمند با LLM.",
      en: "We implement AI solutions including computer vision, NLP, recommender systems and LLM-powered agents.",
      ar: "ننفذ حلول الذكاء الاصطناعي بما في ذلك الرؤية الحاسوبية ومعالجة اللغة وأنظمة التوصية ووكلاء LLM.",
    },
    features: {
      fa: ["تشخیص چهره و اشیاء", "OCR فارسی و انگلیسی", "چت‌بات هوشمند مبتنی بر LLM", "سیستم توصیه‌گر", "تحلیل پیش‌بینانه", "MLOps"],
      en: ["Face & object detection", "Persian & English OCR", "LLM-based smart chatbots", "Recommender systems", "Predictive analytics", "MLOps"],
      ar: ["كشف الوجه والكائنات", "OCR عربي وإنجليزي", "روبوتات محادثة LLM", "أنظمة التوصية", "تحليل تنبؤي", "MLOps"],
    },
    technologies: ["Python", "PyTorch", "TensorFlow", "OpenAI", "LangChain", "Vector DB"],
    deliverables: {
      fa: ["مدل آموزش‌دیده", "API استنتاج", "داشبورد مدیریت", "مستندات"],
      en: ["Trained model", "Inference API", "Admin dashboard", "Documentation"],
      ar: ["نموذج مدرّب", "واجهة استدلال", "لوحة تحكم", "وثائق"],
    },
    process: {
      fa: [
        { title: "جمع‌آوری داده", desc: "پاک‌سازی و برچسب‌گذاری" },
        { title: "آموزش مدل", desc: "آموزش، ارزیابی و تنظیم" },
        { title: "استقرار", desc: "ارائه به‌صورت API مقیاس‌پذیر" },
        { title: "نظارت", desc: "بهبود پیوسته" },
      ],
      en: [
        { title: "Data collection", desc: "Cleaning and labeling" },
        { title: "Model training", desc: "Training, evaluation, tuning" },
        { title: "Deployment", desc: "Scalable inference API" },
        { title: "Monitoring", desc: "Continuous improvement" },
      ],
      ar: [
        { title: "جمع البيانات", desc: "التنظيف والتسمية" },
        { title: "تدريب النموذج", desc: "التدريب والتقييم والضبط" },
        { title: "النشر", desc: "واجهة استدلال قابلة للتوسع" },
        { title: "المراقبة", desc: "تحسين مستمر" },
      ],
    },
    faqs: [],
  },
  {
    slug: "crm-erp",
    icon: Boxes,
    cover: "from-emerald-500/30 via-teal-500/20 to-cyan-500/30",
    title: {
      fa: "اتوماسیون اداری (CRM / ERP)",
      en: "Office Automation (CRM / ERP)",
      ar: "أتمتة المكاتب (CRM / ERP)",
    },
    short: {
      fa: "طراحی و پیاده‌سازی سامانه‌های دولتی و خصوصی بزرگ با امکانات و نیاز هر سازمان",
      en: "Design and implementation of large public and private enterprise systems tailored to your organization.",
      ar: "تصميم وتنفيذ أنظمة كبيرة للقطاعين العام والخاص مخصصة لمؤسستك.",
    },
    description: {
      fa: "ساخت سامانه‌های اختصاصی CRM، ERP، اتوماسیون اداری، انبار و حسابداری با ماژول‌های قابل توسعه و نقش‌های دسترسی پیشرفته.",
      en: "Custom CRM, ERP, office automation, warehouse and accounting systems with extensible modules and advanced role-based access.",
      ar: "أنظمة CRM و ERP وأتمتة مكتبية ومستودعات ومحاسبة مخصصة بوحدات قابلة للتوسع وأدوار وصول متقدمة.",
    },
    features: {
      fa: ["ماژولار و قابل توسعه", "گزارش‌گیری پیشرفته", "نقش‌ها و دسترسی‌ها", "گردش کار خودکار", "اتصال به سامانه‌های ثالث", "موبایل‌فرندلی"],
      en: ["Modular & extensible", "Advanced reporting", "Role-based access", "Workflow automation", "Third-party integrations", "Mobile friendly"],
      ar: ["مرن وقابل للتوسع", "تقارير متقدمة", "صلاحيات الأدوار", "أتمتة سير العمل", "تكاملات خارجية", "متوافق مع الموبايل"],
    },
    technologies: ["Laravel", "NestJS", "Vue 3", "PostgreSQL", "Microservices"],
    deliverables: {
      fa: ["سامانه کامل", "آموزش پرسنل", "مستندات", "پشتیبانی"],
      en: ["Complete system", "Staff training", "Documentation", "Support"],
      ar: ["النظام الكامل", "تدريب الموظفين", "الوثائق", "الدعم"],
    },
    process: {
      fa: [
        { title: "تحلیل فرآیند", desc: "نقشه‌برداری از گردش کار فعلی" },
        { title: "طراحی معماری", desc: "ماژول‌ها و دیتاسنتر داده" },
        { title: "پیاده‌سازی", desc: "توسعه چابک و تحویل ماژولی" },
        { title: "آموزش و استقرار", desc: "مهاجرت و آموزش کاربران" },
      ],
      en: [
        { title: "Process analysis", desc: "Mapping current workflows" },
        { title: "Architecture", desc: "Modules and data model" },
        { title: "Implementation", desc: "Agile, modular delivery" },
        { title: "Training & rollout", desc: "Data migration and user training" },
      ],
      ar: [
        { title: "تحليل العمليات", desc: "تخطيط سير العمل الحالي" },
        { title: "الهندسة المعمارية", desc: "الوحدات ونموذج البيانات" },
        { title: "التنفيذ", desc: "تسليم رشيق ومتعدد الوحدات" },
        { title: "التدريب والإطلاق", desc: "ترحيل البيانات وتدريب المستخدمين" },
      ],
    },
    faqs: [],
  },
  {
    slug: "seo",
    icon: Search,
    cover: "from-lime-500/30 via-green-500/20 to-emerald-500/30",
    title: {
      fa: "بهینه‌سازی سئو",
      en: "SEO Optimization",
      ar: "تحسين محركات البحث",
    },
    short: {
      fa: "ما تا قرار گرفتن وب‌سایت شما در صفحات ابتدایی گوگل در کنار شما هستیم.",
      en: "We work with you until your website ranks on the first pages of Google.",
      ar: "نعمل معك حتى يتصدر موقعك صفحات نتائج جوجل الأولى.",
    },
    description: {
      fa: "خدمات سئوی فنی، محتوایی و خارج صفحه به‌صورت یکپارچه، با تمرکز بر کلمات کلیدی هدف و افزایش پایدار ترافیک ارگانیک.",
      en: "Integrated technical, on-page and off-page SEO focused on target keywords and sustainable organic growth.",
      ar: "سيو تقني وداخلي وخارجي متكامل يركز على الكلمات المستهدفة ونمو عضوي مستدام.",
    },
    features: {
      fa: ["سئوی فنی و Core Web Vitals", "تحقیق کلمات کلیدی", "تولید محتوای حرفه‌ای", "لینک‌سازی باکیفیت", "گزارش ماهانه", "اسکیمای ساختاریافته"],
      en: ["Technical SEO & Core Web Vitals", "Keyword research", "Professional content writing", "High-quality link building", "Monthly reporting", "Structured schema"],
      ar: ["سيو تقني و Core Web Vitals", "بحث الكلمات المفتاحية", "كتابة محتوى احترافي", "بناء روابط عالية الجودة", "تقارير شهرية", "بيانات منظمة"],
    },
    technologies: ["GSC", "GA4", "Ahrefs", "Semrush", "Screaming Frog"],
    deliverables: {
      fa: ["گزارش حسابرسی سئو", "نقشه راه ۶ ماهه", "گزارش‌های ماهانه"],
      en: ["SEO audit report", "6-month roadmap", "Monthly reports"],
      ar: ["تقرير تدقيق السيو", "خارطة طريق 6 أشهر", "تقارير شهرية"],
    },
    process: {
      fa: [
        { title: "حسابرسی", desc: "بررسی کامل وضعیت فعلی" },
        { title: "استراتژی", desc: "تدوین نقشه راه و کلمات هدف" },
        { title: "اجرا", desc: "بهینه‌سازی فنی و محتوایی" },
        { title: "گزارش‌گیری", desc: "گزارش‌های ماهانه و بهبود" },
      ],
      en: [
        { title: "Audit", desc: "Full current-state review" },
        { title: "Strategy", desc: "Roadmap and target keywords" },
        { title: "Execution", desc: "Technical and content optimization" },
        { title: "Reporting", desc: "Monthly reports and refinement" },
      ],
      ar: [
        { title: "التدقيق", desc: "مراجعة كاملة للوضع الحالي" },
        { title: "الاستراتيجية", desc: "خارطة الطريق والكلمات المستهدفة" },
        { title: "التنفيذ", desc: "تحسين تقني ومحتوى" },
        { title: "التقارير", desc: "تقارير شهرية وتحسين مستمر" },
      ],
    },
    faqs: [],
  },
  {
    slug: "digital-marketing",
    icon: Megaphone,
    cover: "from-rose-500/30 via-pink-500/20 to-red-500/30",
    title: {
      fa: "دیجیتال مارکتینگ",
      en: "Digital Marketing",
      ar: "التسويق الرقمي",
    },
    short: {
      fa: "دیجیتال مارکتینگ جایگزین مناسبی برای روش‌های بسیار گران تبلیغات و فروش سنتی است.",
      en: "Digital marketing is a smart and affordable alternative to traditional advertising and sales.",
      ar: "التسويق الرقمي بديل ذكي وفعال للإعلانات التقليدية المكلفة.",
    },
    description: {
      fa: "طراحی و اجرای کمپین‌های یکپارچه دیجیتال شامل تبلیغات گوگل، اینستاگرام، تولید محتوا و ایمیل مارکتینگ با تمرکز بر ROI.",
      en: "Design and execute integrated digital campaigns across Google Ads, Instagram, content marketing and email — focused on ROI.",
      ar: "تصميم وتنفيذ حملات رقمية متكاملة عبر Google Ads و Instagram والمحتوى والبريد، مع التركيز على ROI.",
    },
    features: {
      fa: ["تبلیغات کلیکی Google Ads", "مدیریت شبکه‌های اجتماعی", "تولید محتوای حرفه‌ای", "ایمیل مارکتینگ", "تحلیل و گزارش", "بهینه‌سازی نرخ تبدیل"],
      en: ["Google Ads PPC", "Social media management", "Professional content production", "Email marketing", "Analytics & reporting", "Conversion rate optimization"],
      ar: ["إعلانات Google PPC", "إدارة شبكات التواصل", "إنتاج محتوى احترافي", "تسويق بريدي", "تحليلات وتقارير", "تحسين معدل التحويل"],
    },
    technologies: ["Google Ads", "Meta Ads", "GA4", "Mailchimp", "Hotjar"],
    deliverables: {
      fa: ["استراتژی کمپین", "محتوای تبلیغاتی", "گزارش هفتگی و ماهانه"],
      en: ["Campaign strategy", "Ad creatives", "Weekly & monthly reports"],
      ar: ["استراتيجية الحملة", "محتوى الإعلانات", "تقارير أسبوعية وشهرية"],
    },
    process: {
      fa: [
        { title: "کشف", desc: "شناخت برند و مخاطب" },
        { title: "برنامه‌ریزی", desc: "تدوین کمپین و کانال‌ها" },
        { title: "اجرا", desc: "راه‌اندازی و بهینه‌سازی" },
        { title: "تحلیل", desc: "گزارش و بهبود مداوم" },
      ],
      en: [
        { title: "Discovery", desc: "Brand & audience understanding" },
        { title: "Planning", desc: "Campaign and channel strategy" },
        { title: "Execution", desc: "Launch and continuous optimization" },
        { title: "Analysis", desc: "Reporting and improvement" },
      ],
      ar: [
        { title: "الاستكشاف", desc: "فهم العلامة والجمهور" },
        { title: "التخطيط", desc: "استراتيجية الحملة والقنوات" },
        { title: "التنفيذ", desc: "الإطلاق والتحسين المستمر" },
        { title: "التحليل", desc: "التقارير والتحسين" },
      ],
    },
    faqs: [],
  },
  {
    slug: "crypto-exchange-script",
    icon: Boxes,
    cover: "from-amber-500/30 via-yellow-500/20 to-orange-500/30",
    title: {
      fa: "اسکریپت صرافی رمز ارز و طراحی سایت صرافی",
      en: "Crypto Exchange Script & Exchange Website Design",
      ar: "سكربت منصة تداول العملات الرقمية وتصميم موقع الصرافة",
    },
    short: {
      fa: "طراحی سایت صرافی رمز ارز، اسکریپت صرافی فول‌نود، اسکریپت صرافی ارز دیجیتال، صرافی فیات و OTC با امنیت بانکی.",
      en: "Crypto exchange website design, full-node exchange script, fiat & OTC exchange platform with banking-grade security.",
      ar: "تصميم موقع صرافة عملات رقمية، سكربت صرافة فول نود، منصة فيات وOTC بأمان بنكي.",
    },
    description: {
      fa: "ستایش تخصصی‌ترین تیم طراحی سایت صرافی و توسعه اسکریپت صرافی رمز ارز در ایران است. اسکریپت صرافی رمز ارز فول نود، اسکریپت صرافی ارز دیجیتال، صرافی فول نود، صرافی OTC، صرافی فیات و کیف‌پول‌های اختصاصی بیت‌کوین، اتریوم، ترون و BNB با ماژول KYC، AML، احراز هویت دومرحله‌ای و درگاه پرداخت تومانی و کریپتو.",
      en: "Setayesh is Iran's leading studio for crypto exchange website design and full-node exchange script development. Full-node crypto exchange script, OTC desk, fiat exchange and custom Bitcoin, Ethereum, Tron & BNB wallets with KYC, AML, 2FA and full payment-gateway integration.",
      ar: "ستايش الفريق الأكثر تخصصاً في تصميم موقع صرافة وتطوير سكربت تداول العملات الرقمية في إيران.",
    },
    features: {
      fa: [
        "اسکریپت صرافی رمز ارز فول نود (Full Node)",
        "موتور معاملات Spot, Margin و P2P",
        "کیف‌پول هات و کلد اختصاصی (BTC, ETH, TRX, BNB)",
        "احراز هویت KYC/AML و 2FA",
        "اتصال به درگاه‌های پرداخت تومانی و شبکه شتاب",
        "پنل مدیریت پیشرفته + اپلیکیشن اندروید/iOS",
      ],
      en: [
        "Full-node crypto exchange script",
        "Spot, Margin and P2P trading engine",
        "Custom hot & cold wallets (BTC, ETH, TRX, BNB)",
        "KYC/AML verification and 2FA",
        "Local & international payment gateways",
        "Advanced admin panel + Android/iOS apps",
      ],
      ar: [
        "سكربت صرافة فول نود",
        "محرك تداول Spot وMargin وP2P",
        "محافظ ساخنة وباردة مخصصة",
        "KYC/AML والمصادقة الثنائية",
        "بوابات دفع محلية ودولية",
        "لوحة تحكم متقدمة + تطبيقات أندرويد/iOS",
      ],
    },
    technologies: ["Node.js", "NestJS", "Go", "Rust", "PostgreSQL", "Redis", "Bitcoin Core", "Geth", "Web3"],
    deliverables: {
      fa: ["سورس کامل اسکریپت صرافی", "کیف‌پول‌های فول‌نود", "اپلیکیشن موبایل", "مستندات و آموزش", "پشتیبانی فنی"],
      en: ["Full exchange source code", "Full-node wallets", "Mobile apps", "Docs & training", "Technical support"],
      ar: ["كود كامل لسكربت الصرافة", "محافظ فول نود", "تطبيق موبايل", "وثائق وتدريب", "دعم فني"],
    },
    process: {
      fa: [
        { title: "مشاوره و طراحی", desc: "تحلیل مدل کسب‌وکار صرافی و انتخاب معماری" },
        { title: "پیاده‌سازی موتور", desc: "موتور معاملات و فول‌نودها" },
        { title: "امنیت و KYC", desc: "تست نفوذ، KYC/AML و 2FA" },
        { title: "راه‌اندازی", desc: "استقرار سرور، مانیتورینگ و پشتیبانی" },
      ],
      en: [
        { title: "Consulting & design", desc: "Business model analysis and architecture" },
        { title: "Engine implementation", desc: "Matching engine and full nodes" },
        { title: "Security & KYC", desc: "Pen-testing, KYC/AML and 2FA" },
        { title: "Launch", desc: "Server deployment, monitoring & support" },
      ],
      ar: [
        { title: "الاستشارة والتصميم", desc: "تحليل نموذج العمل والهندسة" },
        { title: "بناء المحرك", desc: "محرك المطابقة وعقد فول نود" },
        { title: "الأمان وKYC", desc: "اختبار الاختراق وKYC/AML و2FA" },
        { title: "الإطلاق", desc: "النشر والمراقبة والدعم" },
      ],
    },
    faqs: [
      {
        q: { fa: "اسکریپت صرافی رمز ارز فول‌نود یعنی چه؟", en: "What is a full-node crypto exchange script?", ar: "ما هو سكربت فول نود؟" },
        a: { fa: "صرافی شما به‌جای اتکا به API صرافی‌های دیگر، مستقیماً روی نودهای اختصاصی شبکه‌های بلاکچین اجرا می‌شود.", en: "Your exchange runs directly on dedicated blockchain nodes instead of third-party APIs.", ar: "صرافتك تعمل مباشرة على عقد بلوكتشين مخصصة." },
      },
      {
        q: { fa: "آیا اسکریپت شما آماده است یا اختصاصی؟", en: "Is the script ready-made or custom?", ar: "هل السكربت جاهز أم مخصص؟" },
        a: { fa: "هر دو حالت ممکن است؛ یک هسته پایدار داریم که برای برند و قوانین هر مشتری اختصاصی توسعه می‌یابد.", en: "Both — battle-tested core, customized per brand and regulation.", ar: "كلاهما — نواة جاهزة مخصصة لكل عميل." },
      },
    ],
  },
  {
    slug: "gold-silver-script",
    icon: Boxes,
    cover: "from-yellow-500/30 via-amber-500/20 to-orange-500/30",
    title: {
      fa: "اسکریپت طلای آبشده و نقره آبشده",
      en: "Melted Gold & Silver Trading Script",
      ar: "سكربت تداول الذهب والفضة المذابة",
    },
    short: {
      fa: "اسکریپت طلای آبشده، اسکریپت نقره آبشده، اسکریپت خرید و فروش طلا، اسکریپت پلتفرم آنلاین طلا و نقره.",
      en: "Melted gold script, melted silver script, online gold & silver trading platform with live pricing.",
      ar: "سكربت ذهب مذاب، سكربت فضة مذابة، منصة تداول ذهب وفضة فورية.",
    },
    description: {
      fa: "ستایش اسکریپت طلای آبشده و نقره آبشده را به‌صورت کاملاً اختصاصی، با قیمت لحظه‌ای انس جهانی، نرخ دلار، کارمزد پلکانی، کیف‌پول داخلی، کارت اعتباری طلا، تحویل فیزیکی و الکترونیکی و اتصال به درگاه‌های بانکی پیاده‌سازی می‌کند.",
      en: "Setayesh delivers fully custom melted-gold and melted-silver trading platforms with live ounce pricing, tiered fees, internal wallets, gold credit cards, physical & digital delivery and banking gateways.",
      ar: "تطلق ستايش منصات تداول الذهب والفضة المذابة بأسعار حية ورسوم متدرجة ومحافظ داخلية وبطاقات ذهبية.",
    },
    features: {
      fa: [
        "قیمت لحظه‌ای انس، دلار و طلای ۱۸ عیار",
        "خرید و فروش طلای آبشده و نقره آبشده",
        "کیف‌پول طلایی و کارت اعتباری طلا",
        "تحویل فیزیکی و حواله بین حساب‌ها",
        "پنل کارگزاری و کارمزد پلکانی",
        "اتصال به درگاه پرداخت و حساب بانکی",
      ],
      en: [
        "Live ounce, USD and 18k gold pricing",
        "Buy/sell melted gold & silver",
        "Gold wallet and gold credit card",
        "Physical delivery and account transfers",
        "Brokerage panel with tiered fees",
        "Banking gateway integration",
      ],
      ar: [
        "أسعار أونصة ودولار وذهب 18 حية",
        "بيع وشراء ذهب وفضة مذابة",
        "محفظة ذهبية وبطاقة ائتمان ذهبية",
        "تسليم مادي وتحويلات بين الحسابات",
        "لوحة وساطة برسوم متدرجة",
        "تكامل بوابات بنكية",
      ],
    },
    technologies: ["Laravel", "NestJS", "Vue 3", "React Native", "PostgreSQL", "Redis", "WebSocket"],
    deliverables: {
      fa: ["سورس کامل اسکریپت طلا و نقره", "اپلیکیشن موبایل", "پنل ادمین", "آموزش و پشتیبانی"],
      en: ["Full gold & silver script source", "Mobile app", "Admin panel", "Training & support"],
      ar: ["كود كامل لسكربت الذهب والفضة", "تطبيق موبايل", "لوحة إدارة", "تدريب ودعم"],
    },
    process: {
      fa: [
        { title: "تحلیل بازار", desc: "بررسی مدل کارگزاری و نرخ‌گذاری" },
        { title: "طراحی UX", desc: "رابط ساده برای خرید آنی" },
        { title: "توسعه و نرخ زنده", desc: "اتصال به APIهای نرخ جهانی" },
        { title: "راه‌اندازی", desc: "استقرار، تست و پشتیبانی" },
      ],
      en: [
        { title: "Market analysis", desc: "Brokerage model and pricing logic" },
        { title: "UX design", desc: "Frictionless instant-buy flows" },
        { title: "Build + live pricing", desc: "Global rate API integration" },
        { title: "Launch", desc: "Deploy, QA and support" },
      ],
      ar: [
        { title: "تحليل السوق", desc: "نموذج الوساطة والتسعير" },
        { title: "تصميم UX", desc: "تجربة شراء فورية" },
        { title: "التطوير والأسعار الحية", desc: "تكامل APIs الأسعار العالمية" },
        { title: "الإطلاق", desc: "النشر والاختبار والدعم" },
      ],
    },
    faqs: [
      {
        q: { fa: "اسکریپت طلای آبشده برای چه کسب‌وکاری مناسب است؟", en: "Who is the melted gold script for?", ar: "لمن يناسب سكربت الذهب المذاب؟" },
        a: { fa: "برای کارگزاری‌های طلا، صرافی‌های طلا، طلافروشی‌های آنلاین و پلتفرم‌های سرمایه‌گذاری طلا و نقره.", en: "Gold brokers, gold exchanges, online jewellers and gold/silver investment platforms.", ar: "وسطاء الذهب وصرافات الذهب والمجوهرات الإلكترونية." },
      },
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
