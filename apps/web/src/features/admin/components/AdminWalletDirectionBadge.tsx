import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import type { AdminWalletTransactionDirection } from "@/features/admin/api/admin-silver-api";
import { Badge } from "@/shared/ui/badge";

export function AdminWalletDirectionBadge({ direction, t }: { direction: AdminWalletTransactionDirection; t: (text: string) => string }) {
  return <Badge className={direction === "INCREASE" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"} variant="outline">{direction === "INCREASE" ? <ArrowUpCircle className="size-3.5" /> : <ArrowDownCircle className="size-3.5" />}{t(direction === "INCREASE" ? "Credit increase" : "Credit decrease")}</Badge>;
}
