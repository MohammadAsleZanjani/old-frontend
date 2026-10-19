import { LandingPage } from "@/features/silver-platform/components";
import { getPublicCmsPage } from "@/features/silver-platform/content-api";

export default async function Page() {
  return <LandingPage initialPage={await getPublicCmsPage("faq")} kind="faq" />;
}
