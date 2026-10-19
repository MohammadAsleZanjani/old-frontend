import type { Metadata } from "next";

import { TermsPage } from "@/features/silver-platform/terms";

export const metadata: Metadata = {
  description: "قوانین و مقررات استفاده از خدمات نقره‌لند، معاملات نقره، پرداخت، برداشت، تحویل فیزیکی و پاداش معرفی.",
  title: "قوانین و مقررات نقره‌لند",
};

export default function Page() {
  return <TermsPage />;
}
