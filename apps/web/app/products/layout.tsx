import type { ReactNode } from "react";

import { SiteChrome } from "@/features/silver-platform/components";

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
