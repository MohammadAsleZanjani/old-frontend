"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { createAdminTicket, getTicketDepartments, type TicketPriority } from "@/domains/support/support-api";
import { TicketAttachmentField } from "@/domains/support/TicketAttachmentField";
import { toTicketAttachmentInput } from "@/domains/support/support-api";
import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Textarea } from "@/shared/ui/textarea";
import type { UploadApiResult } from "@/shared/uploads/upload-api";

const priorities: TicketPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export function AdminTicketCreatePage() {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [departmentId, setDepartmentId] = useState("none");
  const [priority, setPriority] = useState<TicketPriority>("NORMAL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [relatedOrderId, setRelatedOrderId] = useState("");
  const [relatedInvoiceId, setRelatedInvoiceId] = useState("");
  const [attachments, setAttachments] = useState<UploadApiResult[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const canCreate = !!access && (access.isSuperAdmin || access.permissions.includes("tickets.reply"));
  const departments = useQuery({
    enabled: canCreate,
    queryFn: () => getTicketDepartments({ pageSize: 100 }),
    queryKey: ["admin-ticket-departments"],
    retry: 1,
  });
  const create = useMutation({
    mutationFn: () => {
      if (!customerId.trim() || !subject.trim() || !body.trim()) {
        throw new Error(t("Customer ID, subject, and first message are required."));
      }
      return createAdminTicket({
        attachments: attachments.map(toTicketAttachmentInput),
        body: body.trim(),
        customerId: customerId.trim(),
        departmentId: departmentId === "none" ? undefined : departmentId,
        priority,
        relatedInvoiceId: relatedInvoiceId.trim() || undefined,
        relatedOrderId: relatedOrderId.trim() || undefined,
        subject: subject.trim(),
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Ticket could not be created")),
    onSuccess: (ticket) => {
      toast.success(t("Ticket created."));
      router.replace(`/admin/support/tickets/${ticket.id}/edit`);
    },
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <TicketCreateSkeleton />
      </AdminShell>
    );
  }

  if (overview.isError) {
    return (
      <AdminShell>
        <Alert variant="destructive">
          <AlertTitle>{t("Admin page unavailable")}</AlertTitle>
          <AlertDescription>{overview.error.message}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  if (!canCreate) {
    return (
      <AdminShell access={access}>
        <Alert>
          <AlertTitle>{t("Permission required")}</AlertTitle>
          <AlertDescription>{t("Your account cannot use this section. Ask a senior administrator to review your role.")}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("Support / Tickets")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("Create ticket")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Open a customer-owned support case with the first visible message, department, priority, and optional commercial references.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={"/admin/support/tickets" as never}>
                <ArrowRight className="size-4" />
                {t("Back to tickets")}
              </Link>
            </Button>
            <Button disabled={create.isPending || uploadingAttachments} onClick={() => create.mutate()}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {t("Create ticket")}
            </Button>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader><CardTitle>{t("Ticket message")}</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                {t("Customer ID")}
                <Input onChange={(event) => setCustomerId(event.target.value)} placeholder={t("User UUID")} value={customerId} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("Subject")}
                <Input onChange={(event) => setSubject(event.target.value)} value={subject} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("First message")}
                <Textarea className="min-h-44" onChange={(event) => setBody(event.target.value)} value={body} />
              </label>
              <TicketAttachmentField onChange={setAttachments} onUploadingChange={setUploadingAttachments} value={attachments} />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader><CardTitle>{t("Routing")}</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                {t("Priority")}
                <Select dir={dir} onValueChange={(value: TicketPriority) => setPriority(value)} value={priority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorities.map((item) => <SelectItem key={item} value={item}>{t(item)}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("Department")}
                <Select dir={dir} disabled={departments.isLoading} onValueChange={setDepartmentId} value={departmentId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("No department")}</SelectItem>
                    {(departments.data?.items ?? []).map((department) => (
                      <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("Related order ID")}
                <Input onChange={(event) => setRelatedOrderId(event.target.value)} value={relatedOrderId} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("Related invoice ID")}
                <Input onChange={(event) => setRelatedInvoiceId(event.target.value)} value={relatedInvoiceId} />
              </label>
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminShell>
  );
}

function TicketCreateSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <ShadowSkeleton className="h-[30rem]" />
    </div>
  );
}
