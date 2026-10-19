import type { Metadata } from "next";

import { WheelPage } from "@/features/public-site/pages/WheelPage";

export const metadata: Metadata = {
  description: "گردونه شانس نقره؛ برنده اعتبار خرید، تخفیف اختصاصی یا شمش نقره شوید.",
  title: "گردونه شانس نقره",
};

export default function Page() {
  return <WheelPage />;
}
