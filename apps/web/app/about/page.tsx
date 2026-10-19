import type { Metadata } from "next";

import { LandingPage } from "@/features/silver-platform/components";
import { getPublicCmsPage } from "@/features/silver-platform/content-api";

export const metadata: Metadata = {
  description: "درباره نقره لند، خدمات و رویکرد این پلتفرم در خرید، فروش، نگهداری و تحویل نقره.",
  title: "درباره ما | نقره لند",
};

export default async function Page() {
  return <LandingPage initialPage={await getPublicCmsPage("about")} kind="about" />;
}
