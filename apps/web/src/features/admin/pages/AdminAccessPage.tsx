"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BanknoteArrowDown,
  Ban,
  CalendarRange,
  CircleDollarSign,
  CreditCard,
  Download,
  Eye,
  Filter,
  FileText,
  FileSpreadsheet,
  Loader2,
  LogOut,
  MoreHorizontal,
  Pencil,
  ReceiptText,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  Undo2,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "@/shared/ui/sonner";

import {
  assignAdminRolePermissions,
  assignAdminUserRoles,
  createAdminRole,
  deleteAdminRole,
  deleteAdminUser,
  exportAdminUsers,
  getAdminPermissions,
  getAdminRoles,
  getAdminStaff,
  getAdminUsers,
  revokeAdminUserSessions,
  restoreAdminRole,
  restoreAdminUser,
  updateAdminRole,
  updateAdminUserStatus,
  type PermissionGroups,
  type AccessQuery,
  type RoleItem,
  type UserItem,
  type UserKycStatus,
  type UserStats,
  type UserStatus,
} from "@/features/admin/api/admin-access-api";
import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  createAdminManualTomanWithdrawal,
  getAdminManualTomanWithdrawalOptions,
} from "@/features/admin/api/admin-silver-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import { useI18n, type Lang } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatMobileDisplay, formatPlatformDate } from "@/shared/lib/date-format";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

type AccessMode = "users" | "roles" | "permissions";
type UserScope = "all" | "staff";
type UserActionPayload = {
  action: "delete" | "restore" | "revoke" | "roles" | "status";
  id: string;
  roleIds?: string[];
  userStatus?: UserStatus;
};
type UserRecordAccess = {
  deliveryRequests: boolean;
  gatewayTransactions: boolean;
  invoices: boolean;
  payments: boolean;
  productOrders: boolean;
  refunds: boolean;
  silverOrders: boolean;
  tomanWithdrawals: boolean;
  walletTransactions: boolean;
};

const userStatuses: Array<"all" | UserStatus> = ["all", "ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "INACTIVE"];
const userKycStatuses: Array<"all" | UserKycStatus> = ["all", "NOT_STARTED", "PENDING", "APPROVED", "REJECTED"];

const emptyRoleForm = {
  description: "",
  id: "",
  name: "",
  permissionKeys: [] as string[],
};

export function AdminAccessPage({ initialSearch = "", mode, userScope = "staff" }: { initialSearch?: string; mode: AccessMode; userScope?: UserScope }) {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<"all" | UserStatus>("all");
  const [kycStatus, setKycStatus] = useState<"all" | UserKycStatus>("all");
  const [registeredFrom, setRegisteredFrom] = useState("");
  const [registeredTo, setRegisteredTo] = useState("");
  const [deleted, setDeleted] = useState<"with" | "only" | "without">("without");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeRecord, setActiveRecord] = useState<UserItem | RoleItem | PermissionGroups | null>(null);
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const queryClient = useQueryClient();
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const permission = mode === "users" ? "users.view" : "roles.view";
  const allowed = hasAdminPermission(access, permission);
  const canAdjustWallet = !!access && (access.isSuperAdmin || access.permissions.includes("silver.wallets.adjust"));
  const canCreateManualWithdrawal = hasAdminPermission(access, "silver.withdrawals.manage");
  const canManageRoles = hasAdminPermission(access, "users.roles.assign");
  const canCreateUser = hasAdminPermission(access, "users.create");
  const canDeleteUser = hasAdminPermission(access, "users.delete");
  const canExportUsers = hasAdminPermission(access, "users.export");
  const canRevokeUserSessions = hasAdminPermission(access, "users.sessions.revoke");
  const canUpdateUser = hasAdminPermission(access, "users.update");
  const canEditRoles = hasAdminPermission(access, "roles.update") && hasAdminPermission(access, "roles.permissions.assign");
  const canCreateRole = hasAdminPermission(access, "roles.create") && hasAdminPermission(access, "roles.permissions.assign");
  const canDeleteRole = hasAdminPermission(access, "roles.delete");
  const userRecordAccess: UserRecordAccess = {
    deliveryRequests: hasAdminPermission(access, "silver.delivery.manage"),
    gatewayTransactions: hasAdminPermission(access, "payments.view"),
    invoices: hasAdminPermission(access, "invoices.view"),
    payments: hasAdminPermission(access, "payments.view"),
    productOrders: hasAdminPermission(access, "orders.view"),
    refunds: hasAdminPermission(access, "refunds.manage"),
    silverOrders: hasAdminPermission(access, "silver.orders.view"),
    tomanWithdrawals: hasAdminPermission(access, "silver.withdrawals.view"),
    walletTransactions: hasAdminPermission(access, "silver.wallets.view"),
  };
  const userFilters: AccessQuery = {
    deleted,
    kycStatus: kycStatus === "all" ? undefined : kycStatus,
    registeredFrom: registeredFrom || undefined,
    registeredTo: registeredTo || undefined,
    search: search || undefined,
    sortOrder,
    status: status === "all" ? undefined : status,
  };
  const roles = useQuery({
    enabled: allowed && (mode === "roles" || canManageRoles),
    queryFn: () => getAdminRoles({ page: 1, pageSize: 100, search: mode === "roles" ? search : undefined, sortOrder }),
    queryKey: ["admin-access-roles", mode === "roles" ? search : "", sortOrder],
    retry: 1,
  });
  const users = useQuery({
    enabled: allowed && mode === "users",
    queryFn: () => userScope === "all"
      ? getAdminUsers({ ...userFilters, page, pageSize: 10 })
      : getAdminStaff({ ...userFilters, page, pageSize: 10 }),
    queryKey: ["admin-access-users", userScope, deleted, kycStatus, page, registeredFrom, registeredTo, search, sortOrder, status],
    retry: 1,
  });
  const pagedRoles = useQuery({
    enabled: allowed && mode === "roles",
    queryFn: () => getAdminRoles({ page, pageSize: 10, search, sortOrder }),
    queryKey: ["admin-access-paged-roles", page, search, sortOrder],
    retry: 1,
  });
  const permissions = useQuery({
    enabled: allowed && (mode === "roles" || mode === "permissions"),
    queryFn: () => getAdminPermissions(),
    queryKey: ["admin-access-permissions"],
    retry: 1,
  });
  const activeQuery = mode === "users" ? users : mode === "roles" ? pagedRoles : permissions;
  const rows = useMemo(
    () => mode === "users" ? users.data?.items ?? [] : mode === "roles" ? pagedRoles.data?.items ?? [] : flattenPermissions(permissions.data),
    [mode, pagedRoles.data?.items, permissions.data, users.data?.items],
  );
  const total = mode === "users" ? users.data?.total ?? 0 : mode === "roles" ? pagedRoles.data?.total ?? 0 : rows.length;
  const totalPages = mode === "users" ? users.data?.totalPages ?? 1 : mode === "roles" ? pagedRoles.data?.totalPages ?? 1 : 1;
  const roleOptions = roles.data?.items ?? [];
  const permissionGroups = permissions.data ?? {};
  const metrics = buildMetrics(mode, rows, total, selectedRows.length, t, users.data?.stats);
  const sectionTitle = pageTitle(mode, t, userScope);
  const createHref = userScope === "all" ? "/admin/users/create" : "/admin/access/users/create";
  const saveRole = useMutation({
    mutationFn: async () => {
      const payload = { description: roleForm.description, permissionKeys: roleForm.permissionKeys };
      if (roleForm.id) {
        await updateAdminRole(roleForm.id, { description: roleForm.description });
        return assignAdminRolePermissions(roleForm.id, roleForm.permissionKeys);
      }
      return createAdminRole({ ...payload, name: roleForm.name.trim() });
    },
    onError: (error) => toast.error(t(error instanceof Error ? error.message : "Role save failed")),
    onSuccess: () => {
      toast.success(t("Role saved."));
      setRoleForm(emptyRoleForm);
      void queryClient.invalidateQueries({ queryKey: ["admin-access-roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-access-paged-roles"] });
    },
  });
  const roleAction = useMutation({
    mutationFn: async ({ action, id }: { action: "delete" | "restore"; id: string }) => {
      if (action === "delete") return deleteAdminRole(id);
      return restoreAdminRole(id);
    },
    onError: (error) => toast.error(t(error instanceof Error ? error.message : "Role action failed")),
    onSuccess: () => {
      toast.success(t("Role updated."));
      void queryClient.invalidateQueries({ queryKey: ["admin-access-roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-access-paged-roles"] });
    },
  });
  const userAction = useMutation<UserItem | { revokedSessions: number }, Error, UserActionPayload>({
    mutationFn: ({ action, id, roleIds, userStatus }: UserActionPayload) => {
      if (action === "delete") return deleteAdminUser(id);
      if (action === "restore") return restoreAdminUser(id);
      if (action === "roles") return assignAdminUserRoles(id, roleIds ?? []);
      if (action === "revoke") return revokeAdminUserSessions(id);
      return updateAdminUserStatus(id, userStatus ?? "ACTIVE");
    },
    onError: (error) => toast.error(t(error instanceof Error ? error.message : "User action failed")),
    onSuccess: (result, variables) => {
      const message = variables.action === "revoke" && "revokedSessions" in result
        ? `${result.revokedSessions} ${t("active sessions revoked.")}`
        : t("User updated.");
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["admin-access-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-user-detail", variables.id] });
    },
  });
  const exportUsers = useMutation({
    mutationFn: async () => {
      const response = await exportAdminUsers(userFilters);
      const blob = await response.blob();
      const fallbackName = `users-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const filename = downloadFilename(response.headers.get("content-disposition")) ?? fallbackName;
      downloadBlob(filename, blob);
      return Number(response.headers.get("x-exported-records") ?? total);
    },
    onError: (error) => toast.error(t(error instanceof Error ? error.message : "Excel export failed.")),
    onSuccess: (count) => toast.success(`${count.toLocaleString(lang)} ${t("users exported to Excel.")}`),
  });

  if (overview.isLoading) return <AdminShell><AccessSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>{t("Access unavailable")}</AlertTitle><AlertDescription>{t(overview.error.message)}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t(`You need ${permission} permission for this access area.`)}</AlertDescription></Alert></AdminShell>;

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("Users & Access")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{sectionTitle}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{pageDescription(mode, lang, userScope)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {mode === "users" && canCreateUser ? <Button asChild><Link href={createHref as never}><UserPlus className="size-4" />{userScope === "all" ? t("Add user") : t("Add administrator")}</Link></Button> : null}
            {mode === "users" && userScope === "all" ? (
              canExportUsers ? <Button disabled={exportUsers.isPending || activeQuery.isLoading} onClick={() => exportUsers.mutate()} variant="outline">
                {exportUsers.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                {t("Export all filtered users to Excel")}
              </Button> : null
            ) : (
              <>
                <AdminExcelExportButton
                  disabled={activeQuery.isLoading || total === 0}
                  fetchRows={async () => {
                    if (mode === "users") return fetchAllAdminExportRows((exportPage, pageSize) => getAdminStaff({ ...userFilters, page: exportPage, pageSize }));
                    if (mode === "roles") return fetchAllAdminExportRows((exportPage, pageSize) => getAdminRoles({ page: exportPage, pageSize, search, sortOrder }));
                    return flattenPermissions(await getAdminPermissions());
                  }}
                  filename={sectionTitle}
                  sheetName={sectionTitle}
                />
                <Button disabled={!selectedRows.length} onClick={() => downloadJson(`${sectionTitle} ${t("selected")}`, rows.filter((row) => selectedRows.includes(row.id)), t("Export downloaded."))} variant="outline"><Download className="size-4" />{t("Export selected")}</Button>
              </>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {activeQuery.isLoading ? Array.from({ length: mode === "users" ? 10 : 4 }).map((_, index) => <ShadowSkeleton className="h-28" key={index} />) : metrics.map((metric) => (
            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]" key={metric.label}>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{metric.value}</div><p className="mt-1 text-xs text-muted-foreground">{metric.meta}</p></CardContent>
            </Card>
          ))}
        </section>

        <Tabs dir={dir} value={mode}>
          {userScope === "staff" ? <TabsList className="flex h-auto w-full flex-wrap justify-start rtl:[direction:rtl] ltr:[direction:ltr]" dir={dir}>
            {hasAdminPermission(access, "users.view") ? <TabsTrigger asChild value="users"><Link href={"/admin/access/users" as never}>{t("Users")}</Link></TabsTrigger> : null}
            {hasAdminPermission(access, "roles.view") ? <TabsTrigger asChild value="roles"><Link href={"/admin/access/roles" as never}>{t("Roles")}</Link></TabsTrigger> : null}
            {hasAdminPermission(access, "roles.view") ? <TabsTrigger asChild value="permissions"><Link href={"/admin/access/permissions" as never}>{t("Permissions")}</Link></TabsTrigger> : null}
          </TabsList> : null}
          <TabsContent dir={dir} value={mode}>
            <section className={mode === "roles" ? "grid gap-4 xl:grid-cols-[1fr_440px]" : "space-y-4"}>
              <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle className="flex items-center gap-2">{mode === "users" ? <Users className="size-5 text-primary" /> : <ShieldCheck className="size-5 text-primary" />}{sectionTitle} {t("registry")}</CardTitle>
                    <Button onClick={() => setShowAdvancedFilters((current) => !current)} variant="outline">{t("Advanced filters")}</Button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1fr_170px_170px_150px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search users, roles, permissions")} value={search} />
                    </div>
                    <Select dir={dir} disabled={mode !== "users"} onValueChange={(value) => { setPage(1); setStatus(value as "all" | UserStatus); }} value={status}>
                      <SelectTrigger><Filter className="size-4" /><SelectValue /></SelectTrigger>
                      <SelectContent>{userStatuses.map((option) => <SelectItem key={option} value={option}>{option === "all" ? t("All statuses") : t(labelize(option))}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select dir={dir} disabled={mode !== "users"} onValueChange={(value) => { setPage(1); setDeleted(value as "with" | "only" | "without"); }} value={deleted}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="without">{t("Active records")}</SelectItem><SelectItem value="with">{t("Include deleted")}</SelectItem><SelectItem value="only">{t("Deleted only")}</SelectItem></SelectContent>
                    </Select>
                    <Select dir={dir} onValueChange={(value: "asc" | "desc") => setSortOrder(value)} value={sortOrder}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="desc">{t("Newest first")}</SelectItem><SelectItem value="asc">{t("Oldest first")}</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {mode === "users" ? (
                    <div className="grid gap-3 rounded-lg border border-border bg-background/35 p-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
                      <div className="space-y-1.5"><Label htmlFor="registered-from">{t("Registration date from")}</Label><div className="relative"><CalendarRange className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" id="registered-from" onChange={(event) => { const value = event.target.value; setPage(1); setRegisteredFrom(value); if (registeredTo && value > registeredTo) setRegisteredTo(value); }} type="date" value={registeredFrom} /></div></div>
                      <div className="space-y-1.5"><Label htmlFor="registered-to">{t("Registration date to")}</Label><div className="relative"><CalendarRange className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" id="registered-to" min={registeredFrom || undefined} onChange={(event) => { setPage(1); setRegisteredTo(event.target.value); }} type="date" value={registeredTo} /></div></div>
                      <div className="space-y-1.5"><Label>{t("KYC status")}</Label><Select dir={dir} onValueChange={(value) => { setPage(1); setKycStatus(value as "all" | UserKycStatus); }} value={kycStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{userKycStatuses.map((option) => <SelectItem key={option} value={option}>{option === "all" ? t("All KYC statuses") : t(labelize(option))}</SelectItem>)}</SelectContent></Select></div>
                      <Button className="self-end" disabled={!registeredFrom && !registeredTo && kycStatus === "all"} onClick={() => { setPage(1); setRegisteredFrom(""); setRegisteredTo(""); setKycStatus("all"); }} type="button" variant="outline">{t("Clear report filters")}</Button>
                    </div>
                  ) : null}
                  {showAdvancedFilters ? <AdvancedSummary deleted={deleted} kycStatus={kycStatus} mode={mode} registeredFrom={registeredFrom} registeredTo={registeredTo} search={search} selected={selectedRows.length} status={status} userScope={userScope} /> : null}
                </CardHeader>
                <CardContent>
                  {activeQuery.isLoading ? <TableSkeleton /> : null}
                  {activeQuery.isError ? <Alert variant="destructive"><AlertTitle>{t("List unavailable")}</AlertTitle><AlertDescription>{t(activeQuery.error.message)}</AlertDescription></Alert> : null}
                  {!activeQuery.isLoading && !activeQuery.isError && rows.length ? (
                    mode === "permissions"
                      ? <PermissionMatrix groups={permissionGroups} search={search} />
                      : <AccessTable
                          canAdjustWallet={canAdjustWallet}
                          canCreateManualWithdrawal={canCreateManualWithdrawal}
                          canDeleteRole={canDeleteRole}
                          canDeleteUser={canDeleteUser}
                          canEditRoles={canEditRoles}
                          canManageRoles={canManageRoles}
                          canRevokeUserSessions={canRevokeUserSessions}
                          canUpdateUser={canUpdateUser}
                          mode={mode}
                          onEditRole={(role) => setRoleForm(fromRole(role))}
                          onRecord={setActiveRecord}
                          onRoleAction={(id, action) => roleAction.mutate({ action, id })}
                          onUserAction={(payload) => userAction.mutate(payload)}
                          pendingUserAction={userAction.isPending}
                          roleOptions={roleOptions}
                          rows={rows as Array<UserItem | RoleItem>}
                          selectedRows={selectedRows}
                          setSelectedRows={setSelectedRows}
                          userRecordAccess={userRecordAccess}
                          userScope={userScope}
                        />
                  ) : null}
                  {!activeQuery.isLoading && !activeQuery.isError && !rows.length ? <EmptyState /> : null}
                  {mode !== "permissions" ? (
                    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">{t("Showing")} {rows.length} {t("of")} {total} {t("records")}.</p>
                      <div className="flex gap-2">
                        <Button disabled={page <= 1 || activeQuery.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">{t("Previous")}</Button>
                        <Button disabled={page >= totalPages || activeQuery.isLoading} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">{t("Next")}</Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              {mode === "roles" ? (
                <RoleEditor
                  canSave={roleForm.id ? canEditRoles : canCreateRole}
                  form={roleForm}
                  groups={permissionGroups}
                  isPending={saveRole.isPending}
                  onChange={setRoleForm}
                  onSubmit={() => saveRole.mutate()}
                />
              ) : null}
            </section>
          </TabsContent>
        </Tabs>
      </div>
      <RecordDialog record={activeRecord} onOpenChange={(open) => !open && setActiveRecord(null)} />
    </AdminShell>
  );
}

function AccessTable(props: {
  canAdjustWallet: boolean;
  canCreateManualWithdrawal: boolean;
  canDeleteRole: boolean;
  canDeleteUser: boolean;
  canEditRoles: boolean;
  canManageRoles: boolean;
  canRevokeUserSessions: boolean;
  canUpdateUser: boolean;
  mode: Exclude<AccessMode, "permissions">;
  onEditRole: (role: RoleItem) => void;
  onRecord: (record: UserItem | RoleItem) => void;
  onRoleAction: (id: string, action: "delete" | "restore") => void;
  onUserAction: (payload: UserActionPayload) => void;
  pendingUserAction: boolean;
  roleOptions: RoleItem[];
  rows: Array<UserItem | RoleItem>;
  selectedRows: string[];
  setSelectedRows: (rows: string[]) => void;
  userRecordAccess: UserRecordAccess;
  userScope: UserScope;
}) {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const isRtl = dir === "rtl";
  const allSelected = props.rows.length > 0 && props.rows.every((row) => props.selectedRows.includes(row.id));
  if (props.mode === "users") {
    const users = props.rows.filter((row): row is UserItem => "roleMappings" in row);
    return (
      <Table className="min-w-[1580px]" dir={dir}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={(checked) => props.setSelectedRows(checked ? users.map((row) => row.id) : [])} /></TableHead>
            <TableHead className="min-w-60">{t("User")}</TableHead>
            <TableHead className="min-w-64">{t("Contact & identity")}</TableHead>
            <TableHead className="min-w-48">{t("Account & KYC")}</TableHead>
            <TableHead className="min-w-60">{t("Balances")}</TableHead>
            <TableHead className="min-w-44">{t("Commerce activity")}</TableHead>
            <TableHead className="min-w-44">{t("Roles")}</TableHead>
            <TableHead className="min-w-44">{t("Account activity")}</TableHead>
            <TableHead className="sticky end-0 min-w-28 bg-card text-start">{t("Actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow data-state={props.selectedRows.includes(user.id) ? "selected" : undefined} key={user.id}>
              <TableCell><Checkbox checked={props.selectedRows.includes(user.id)} onCheckedChange={(checked) => props.setSelectedRows(checked ? [...props.selectedRows, user.id] : props.selectedRows.filter((id) => id !== user.id))} /></TableCell>
              <TableCell className="align-top">
                <div className="space-y-1.5">
                  <AdminUserLink userId={user.id}>{recordTitle(user)}</AdminUserLink>
                  <p className="max-w-56 truncate font-mono text-[11px] text-muted-foreground" dir="ltr" title={user.id}>{user.id}</p>
                  <p className="text-xs text-muted-foreground">{t("Joined")} {formatDate(user.createdAt)}</p>
                </div>
              </TableCell>
              <TableCell className="align-top">
                <ContactLine label={t("Mobile")} value={formatMobile(user.mobile)} verified={!!user.mobileVerifiedAt} />
                <ContactLine label={t("Email")} value={user.email || t("Not provided")} verified={!!user.emailVerifiedAt} />
                <p className="mt-1.5 text-xs text-muted-foreground">{t("National ID")}: <span className="font-mono text-foreground" dir="ltr">{user.profile?.idCardNo || "—"}</span></p>
              </TableCell>
              <TableCell className="align-top">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={user.deletedAt || user.status === "SUSPENDED" ? "destructive" : user.status === "ACTIVE" ? "default" : "outline"}>{user.deletedAt ? t("Deleted") : t(labelize(user.status))}</Badge>
                  <Badge variant={user.kycProfile?.status === "APPROVED" ? "secondary" : "outline"}>{t("KYC")}: {t(labelize(user.kycProfile?.status ?? "NOT_STARTED"))}</Badge>
                </div>
                {user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now() ? <p className="mt-2 text-xs font-medium text-destructive">{t("Locked until")} {formatDate(user.lockedUntil)}</p> : null}
                {user.failedLoginCount ? <p className="mt-1 text-xs text-muted-foreground">{t("Failed logins")}: {formatCount(user.failedLoginCount, lang)}</p> : null}
              </TableCell>
              <TableCell className="align-top"><UserBalances lang={lang} user={user} /></TableCell>
              <TableCell className="align-top">
                <ActivityLine label={t("Store orders")} value={user._count.orders} />
                <ActivityLine label={t("Silver orders")} value={user._count.silverOrders} />
                <ActivityLine label={t("Wallet transactions")} value={user._count.walletTransactions} />
              </TableCell>
              <TableCell className="align-top">
                <div className="flex max-w-44 flex-wrap gap-1">{user.roleMappings.length ? user.roleMappings.map((mapping) => <Badge key={mapping.roleId} variant="outline">{mapping.role.name}</Badge>) : <span className="text-xs text-muted-foreground">{t("No roles")}</span>}</div>
              </TableCell>
              <TableCell className="align-top">
                <p className="text-xs font-medium">{t("Last login")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{user.lastLoginAt ? formatDate(user.lastLoginAt) : t("Never")}</p>
                <p className="mt-2 text-xs text-muted-foreground">{t("Updated")} {formatDate(user.updatedAt)}</p>
              </TableCell>
              <TableCell className="sticky end-0 bg-card/95 align-top backdrop-blur">
                <UserActions
                  canAdjustWallet={props.canAdjustWallet}
                  canCreateManualWithdrawal={props.canCreateManualWithdrawal}
                  canDelete={props.canDeleteUser}
                  canManageRoles={props.canManageRoles}
                  canRevokeSessions={props.canRevokeUserSessions}
                  canUpdate={props.canUpdateUser}
                  onAction={props.onUserAction}
                  onRecord={props.onRecord}
                  pending={props.pendingUserAction}
                  roleOptions={props.roleOptions}
                  user={user}
                  userRecordAccess={props.userRecordAccess}
                  userScope={props.userScope}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
  return (
    <Table dir={dir}>
      <TableHeader><TableRow><TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={(checked) => props.setSelectedRows(checked ? props.rows.map((row) => row.id) : [])} /></TableHead><TableHead>{t("Record")}</TableHead><TableHead>{t("Status")}</TableHead><TableHead>{t("Access")}</TableHead><TableHead>{t("Updated")}</TableHead><TableHead className="text-start">{t("Actions")}</TableHead></TableRow></TableHeader>
      <TableBody>
        {props.rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell><Checkbox checked={props.selectedRows.includes(row.id)} onCheckedChange={(checked) => props.setSelectedRows(checked ? [...props.selectedRows, row.id] : props.selectedRows.filter((id) => id !== row.id))} /></TableCell>
            <TableCell><div className="space-y-1">{"roleMappings" in row ? <p><AdminUserLink userId={row.id}>{recordTitle(row)}</AdminUserLink></p> : <p className="font-semibold">{recordTitle(row)}</p>}<p className="line-clamp-1 text-xs text-muted-foreground" dir={"roleMappings" in row ? "ltr" : undefined}>{recordSubtitle(row, t)}</p></div></TableCell>
            <TableCell><Badge variant={row.deletedAt ? "destructive" : "outline"}>{"status" in row ? t(labelize(row.status)) : row.deletedAt ? t("Deleted") : row.isSystem ? t("System") : t("Custom")}</Badge></TableCell>
            <TableCell className="text-sm text-muted-foreground">{accessSummary(row, t)}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(row.updatedAt)}</TableCell>
            <TableCell className="text-start">
              <div className={cn("flex flex-wrap gap-2", isRtl ? "justify-start" : "justify-end")}>
                <Button onClick={() => props.onRecord(row)} size="sm" variant="outline"><Eye className="size-4" />{t("View")}</Button>
                {"roleMappings" in row ? null : <RoleActions canDelete={props.canDeleteRole} canEdit={props.canEditRoles} onAction={props.onRoleAction} onEdit={props.onEditRole} role={row} />}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function UserActions(props: {
  canAdjustWallet: boolean;
  canCreateManualWithdrawal: boolean;
  canDelete: boolean;
  canManageRoles: boolean;
  canRevokeSessions: boolean;
  canUpdate: boolean;
  onAction: (payload: UserActionPayload) => void;
  onRecord: (record: UserItem) => void;
  pending: boolean;
  roleOptions: RoleItem[];
  user: UserItem;
  userRecordAccess: UserRecordAccess;
  userScope: UserScope;
}) {
  const t = useAdminAccessT();
  const [confirmation, setConfirmation] = useState<"delete" | "revoke" | "suspend" | "deactivate" | null>(null);
  const [manualWithdrawalOpen, setManualWithdrawalOpen] = useState(false);
  const currentRoles = props.user.roleMappings.map((mapping) => mapping.roleId);
  const disabled = props.pending || !!props.user.deletedAt;
  const editHref = props.userScope === "all"
    ? `/admin/users/${encodeURIComponent(props.user.id)}/edit`
    : `/admin/access/users/${encodeURIComponent(props.user.id)}/edit`;
  const walletHref = `/admin/finance/wallet-adjustments?userId=${encodeURIComponent(props.user.id)}`;
  const userIdQuery = `?userId=${encodeURIComponent(props.user.id)}`;
  const hasUserRecords = Object.values(props.userRecordAccess).some(Boolean);
  const confirmAction = () => {
    if (confirmation === "delete") props.onAction({ action: "delete", id: props.user.id });
    if (confirmation === "revoke") props.onAction({ action: "revoke", id: props.user.id });
    if (confirmation === "suspend") props.onAction({ action: "status", id: props.user.id, userStatus: "SUSPENDED" });
    if (confirmation === "deactivate") props.onAction({ action: "status", id: props.user.id, userStatus: "INACTIVE" });
    setConfirmation(null);
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button aria-label={t("User actions")} disabled={props.pending} size="icon" variant="outline"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>{recordTitle(props.user)}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {props.canUpdate ? <DropdownMenuItem asChild disabled={!!props.user.deletedAt}><Link href={editHref as never}><Pencil />{t("Edit profile")}</Link></DropdownMenuItem> : null}
          <DropdownMenuItem onSelect={() => props.onRecord(props.user)}><Eye />{t("View full record")}</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!hasUserRecords}><WalletCards />{t("Transactions and records")}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              {props.userRecordAccess.walletTransactions ? <DropdownMenuItem asChild><Link href={`${"/admin/finance/wallet-transactions"}${userIdQuery}` as never}><WalletCards />{t("Wallet transactions")}</Link></DropdownMenuItem> : null}
              {props.userRecordAccess.gatewayTransactions ? <DropdownMenuItem asChild><Link href={`${"/admin/finance/gateway-transactions"}${userIdQuery}` as never}><CreditCard />{t("Gateway transactions")}</Link></DropdownMenuItem> : null}
              {props.userRecordAccess.payments ? <DropdownMenuItem asChild><Link href={`${"/admin/finance/payments"}${userIdQuery}` as never}><CreditCard />{t("All payments")}</Link></DropdownMenuItem> : null}
              {props.userRecordAccess.silverOrders ? <DropdownMenuItem asChild><Link href={`${"/admin/silver/orders"}${userIdQuery}` as never}><CircleDollarSign />{t("Silver orders")}</Link></DropdownMenuItem> : null}
              {props.userRecordAccess.productOrders ? <DropdownMenuItem asChild><Link href={`${"/admin/shop/orders"}${userIdQuery}` as never}><ShoppingBag />{t("Product orders")}</Link></DropdownMenuItem> : null}
              {props.userRecordAccess.invoices ? <DropdownMenuItem asChild><Link href={`${"/admin/finance/invoices"}${userIdQuery}` as never}><FileText />{t("Invoices")}</Link></DropdownMenuItem> : null}
              {props.userRecordAccess.refunds ? <DropdownMenuItem asChild><Link href={`${"/admin/finance/payments/refunds"}${userIdQuery}` as never}><ReceiptText />{t("Refunds")}</Link></DropdownMenuItem> : null}
              {props.userRecordAccess.tomanWithdrawals ? <DropdownMenuItem asChild><Link href={`${"/admin/finance/withdrawals"}${userIdQuery}` as never}><BanknoteArrowDown />{t("Toman withdrawals")}</Link></DropdownMenuItem> : null}
              {props.userRecordAccess.deliveryRequests ? <DropdownMenuItem asChild><Link href={`${"/admin/delivery/requests"}${userIdQuery}` as never}><Truck />{t("Delivery requests")}</Link></DropdownMenuItem> : null}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {props.canAdjustWallet ? <DropdownMenuItem asChild disabled={!!props.user.deletedAt}><Link href={walletHref as never}><CircleDollarSign />{t("Adjust balance")}</Link></DropdownMenuItem> : <DropdownMenuItem disabled><CircleDollarSign />{t("Adjust balance")}</DropdownMenuItem>}
          {props.canCreateManualWithdrawal ? <DropdownMenuItem disabled={disabled} onSelect={() => setManualWithdrawalOpen(true)}><BanknoteArrowDown />برداشت دستی تومان</DropdownMenuItem> : null}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!props.canManageRoles || disabled}><ShieldCheck />{t("Manage roles")}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {props.roleOptions.map((role) => <DropdownMenuCheckboxItem checked={currentRoles.includes(role.id)} key={role.id} onCheckedChange={() => props.onAction({ action: "roles", id: props.user.id, roleIds: currentRoles.includes(role.id) ? currentRoles.filter((id) => id !== role.id) : [...currentRoles, role.id] })}>{role.name}</DropdownMenuCheckboxItem>)}
              {!props.roleOptions.length ? <DropdownMenuItem disabled>{t("No roles available")}</DropdownMenuItem> : null}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          {props.canUpdate ? props.user.status === "SUSPENDED" || props.user.status === "INACTIVE" ? <DropdownMenuItem disabled={disabled} onSelect={() => props.onAction({ action: "status", id: props.user.id, userStatus: "ACTIVE" })}><UserCheck />{t("Activate account")}</DropdownMenuItem> : <DropdownMenuItem disabled={disabled} onSelect={() => setConfirmation("suspend")}><Ban />{t("Suspend / ban user")}</DropdownMenuItem> : null}
          {props.canUpdate && props.user.status !== "INACTIVE" ? <DropdownMenuItem disabled={disabled} onSelect={() => setConfirmation("deactivate")}><Ban />{t("Deactivate account")}</DropdownMenuItem> : null}
          {props.canRevokeSessions ? <DropdownMenuItem disabled={disabled} onSelect={() => setConfirmation("revoke")}><LogOut />{t("Sign out all devices")}</DropdownMenuItem> : null}
          {props.canDelete ? <DropdownMenuSeparator /> : null}
          {props.canDelete ? props.user.deletedAt ? <DropdownMenuItem onSelect={() => props.onAction({ action: "restore", id: props.user.id })}><Undo2 />{t("Restore user")}</DropdownMenuItem> : <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirmation("delete")}><Trash2 />{t("Delete user")}</DropdownMenuItem> : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog onOpenChange={(open) => !open && setConfirmation(null)} open={!!confirmation}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{confirmationTitle(confirmation, t)}</AlertDialogTitle><AlertDialogDescription>{confirmationDescription(confirmation, props.user, t)}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("Cancel")}</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmAction}>{t("Confirm action")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ManualWithdrawalDialog onOpenChange={setManualWithdrawalOpen} open={manualWithdrawalOpen} user={props.user} />
    </>
  );
}

function ManualWithdrawalDialog({ onOpenChange, open, user }: { onOpenChange: (open: boolean) => void; open: boolean; user: UserItem }) {
  const { lang } = useI18n();
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const idempotencyKey = useRef("");
  const queryClient = useQueryClient();
  const options = useQuery({
    enabled: open,
    queryFn: () => getAdminManualTomanWithdrawalOptions(user.id),
    queryKey: ["admin-manual-withdrawal-options", user.id],
    retry: 1,
  });

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setBankAccountId("");
    setAdminNote("");
    idempotencyKey.current = crypto.randomUUID();
  }, [open, user.id]);

  useEffect(() => {
    if (!open || bankAccountId || !options.data?.bankAccounts[0]) return;
    setBankAccountId(options.data.bankAccounts[0].id);
  }, [bankAccountId, open, options.data]);

  const createWithdrawal = useMutation({
    mutationFn: () => createAdminManualTomanWithdrawal({
      adminNote: adminNote.trim(),
      amount: Number(amount),
      bankAccountId,
      userId: user.id,
    }, idempotencyKey.current || crypto.randomUUID()),
    onError: (error) => toast.error(error instanceof Error ? error.message : "ثبت برداشت دستی انجام نشد."),
    onSuccess: async (withdrawal) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-access-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-manual-withdrawal-options", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["admin-toman-withdrawals"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-user-detail", user.id] }),
      ]);
      toast.success(`درخواست برداشت ${withdrawal.requestNumber} ثبت شد و مبلغ در کیف پول قفل شد.`);
      onOpenChange(false);
    },
  });

  const availableBalance = Number(options.data?.availableBalance ?? 0);
  const minimumAmount = Number(options.data?.minimumAmount ?? 100_000);
  const numericAmount = Number(amount);
  const canSubmit = options.data?.kycStatus === "APPROVED"
    && Boolean(bankAccountId)
    && Number.isSafeInteger(numericAmount)
    && numericAmount >= minimumAmount
    && numericAmount <= availableBalance
    && adminNote.trim().length >= 3;
  const changeAttempt = (change: () => void) => {
    change();
    idempotencyKey.current = crypto.randomUUID();
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit && !createWithdrawal.isPending) createWithdrawal.mutate();
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>ثبت برداشت دستی تومان</DialogTitle>
          <DialogDescription>برای {recordTitle(user)} یک درخواست برداشت ثبت می‌شود. مبلغ ابتدا از موجودی قابل برداشت کم و تا زمان تعیین تکلیف در وضعیت قفل‌شده نگهداری می‌شود.</DialogDescription>
        </DialogHeader>
        {options.isLoading ? <ShadowSkeleton className="h-72 rounded-xl" /> : null}
        {options.isError ? <Alert variant="destructive"><AlertTitle>اطلاعات برداشت در دسترس نیست</AlertTitle><AlertDescription>{options.error.message}</AlertDescription></Alert> : null}
        {options.data ? (
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-3 rounded-xl border bg-muted/25 p-4 sm:grid-cols-2">
              <BalanceLine label="موجودی قابل برداشت" value={`${formatBalance(options.data.availableBalance, "TOMAN", lang)} تومان`} />
              <BalanceLine label="موجودی قفل‌شده" value={`${formatBalance(options.data.lockedBalance, "TOMAN", lang)} تومان`} />
              <BalanceLine label="وضعیت احراز هویت" value={options.data.kycStatus === "APPROVED" ? "تأییدشده" : labelize(options.data.kycStatus)} />
              <BalanceLine label="حداقل برداشت" value={`${formatBalance(String(minimumAmount), "TOMAN", lang)} تومان`} />
            </div>
            {options.data.kycStatus !== "APPROVED" ? <Alert variant="destructive"><AlertTitle>احراز هویت تأیید نشده است</AlertTitle><AlertDescription>برای جلوگیری از برداشت غیرمجاز، ثبت برداشت تا تأیید KYC کاربر ممکن نیست.</AlertDescription></Alert> : null}
            {!options.data.bankAccounts.length ? <Alert variant="destructive"><AlertTitle>حساب بانکی تأییدشده وجود ندارد</AlertTitle><AlertDescription>کاربر باید ابتدا یک شماره شبای متعلق به خودش را ثبت و تأیید کند.</AlertDescription></Alert> : null}
            <div className="space-y-2">
              <Label htmlFor={`manual-withdrawal-bank-${user.id}`}>حساب بانکی مقصد</Label>
              <Select disabled={!options.data.bankAccounts.length || createWithdrawal.isPending} onValueChange={(value) => changeAttempt(() => setBankAccountId(value))} value={bankAccountId}>
                <SelectTrigger id={`manual-withdrawal-bank-${user.id}`}><SelectValue placeholder="انتخاب حساب بانکی" /></SelectTrigger>
                <SelectContent>{options.data.bankAccounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.bankName ?? "بانک"} · {account.iban} · {account.ownerName ?? "مالک تأییدشده"}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`manual-withdrawal-amount-${user.id}`}>مبلغ برداشت (تومان)</Label>
              <Input
                disabled={createWithdrawal.isPending}
                id={`manual-withdrawal-amount-${user.id}`}
                inputMode="numeric"
                max={Math.min(availableBalance, Number.MAX_SAFE_INTEGER)}
                min={minimumAmount}
                onChange={(event) => changeAttempt(() => setAmount(event.target.value))}
                placeholder={String(minimumAmount)}
                step="1"
                type="number"
                value={amount}
              />
              {numericAmount > availableBalance ? <p className="text-xs text-destructive">مبلغ واردشده بیشتر از موجودی قابل برداشت است.</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`manual-withdrawal-note-${user.id}`}>دلیل و یادداشت داخلی</Label>
              <Textarea disabled={createWithdrawal.isPending} id={`manual-withdrawal-note-${user.id}`} maxLength={1000} onChange={(event) => changeAttempt(() => setAdminNote(event.target.value))} placeholder="دلیل ثبت برداشت توسط مدیر را وارد کنید." required value={adminNote} />
            </div>
            <Alert><AlertTitle>کنترل مالی</AlertTitle><AlertDescription>این مرحله انتقال بانکی را انجام نمی‌دهد. پس از ثبت، درخواست باید در صفحه برداشت تومان تأیید و با کد پیگیری بانکی نهایی شود.</AlertDescription></Alert>
            <Button className="w-full" disabled={!canSubmit || createWithdrawal.isPending} type="submit">
              {createWithdrawal.isPending ? <Loader2 className="size-4 animate-spin" /> : <BanknoteArrowDown className="size-4" />}
              ثبت در صف برداشت و قفل‌کردن مبلغ
            </Button>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RoleActions(props: { canDelete: boolean; canEdit: boolean; onAction: (id: string, action: "delete" | "restore") => void; onEdit: (role: RoleItem) => void; role: RoleItem }) {
  const t = useAdminAccessT();
  return (
    <>
      {props.canEdit ? <Button onClick={() => props.onEdit(props.role)} size="sm" variant="outline">{t("Edit")}</Button> : null}
      {props.canDelete ? props.role.deletedAt ? <Button onClick={() => props.onAction(props.role.id, "restore")} size="sm" variant="outline"><Undo2 className="size-4" />{t("Restore")}</Button> : <Button disabled={props.role.isSystem} onClick={() => props.onAction(props.role.id, "delete")} size="sm" variant="outline"><Trash2 className="size-4" />{t("Delete")}</Button> : null}
    </>
  );
}

function RoleEditor(props: { canSave: boolean; form: typeof emptyRoleForm; groups: PermissionGroups; isPending: boolean; onChange: (form: typeof emptyRoleForm) => void; onSubmit: () => void }) {
  const t = useAdminAccessT();
  const permissionCount = props.form.permissionKeys.length;
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader><CardTitle>{props.form.id ? t("Edit role") : t("Create role")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Label className="space-y-2"><span>{t("Role name")}</span><Input disabled={!!props.form.id} onChange={(event) => props.onChange({ ...props.form, name: event.target.value })} value={props.form.name} /></Label>
        <Label className="space-y-2"><span>{t("Description")}</span><Textarea className="min-h-24" onChange={(event) => props.onChange({ ...props.form, description: event.target.value })} value={props.form.description} /></Label>
        <div className="space-y-3 rounded-lg border border-border bg-background/35 p-3">
          <div className="flex items-center justify-between"><p className="text-sm font-medium">{t("Permission matrix")}</p><Badge variant="outline">{permissionCount} {t("selected")}</Badge></div>
          <div className="max-h-80 space-y-4 overflow-auto pe-1">
            {Object.entries(props.groups).map(([module, permissions]) => {
              const selected = permissions.filter((permission) => props.form.permissionKeys.includes(permission.key)).length;
              const checked = selected === permissions.length ? true : selected > 0 ? "indeterminate" : false;
              return (
              <div className="rounded-lg border border-border bg-card/40 p-3" key={module}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        const moduleKeys = permissions.map((permission) => permission.key);
                        const remaining = props.form.permissionKeys.filter((key) => !moduleKeys.includes(key));
                        props.onChange({ ...props.form, permissionKeys: value ? [...remaining, ...moduleKeys] : remaining });
                      }}
                    />
                    <span>{permissionSectionLabel(module, t)}</span>
                  </label>
                  <Badge variant="outline">{selected}/{permissions.length}</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {permissions.map((permission) => (
                    <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-card/60 p-2.5 text-xs" key={permission.key}>
                      <Checkbox checked={props.form.permissionKeys.includes(permission.key)} onCheckedChange={(checked) => props.onChange({ ...props.form, permissionKeys: checked ? [...props.form.permissionKeys, permission.key] : props.form.permissionKeys.filter((key) => key !== permission.key) })} />
                      <span className="min-w-0"><span className="block font-semibold">{permission.description ?? permissionActionLabel(permission.action, t)}</span><span className="mt-1 block break-all font-mono text-[10px] text-muted-foreground" dir="ltr">{permission.key}</span></span>
                    </label>
                  ))}
                </div>
              </div>
            );})}
          </div>
        </div>
        <Button className="w-full" disabled={!props.canSave || props.isPending || !props.form.name.trim()} onClick={props.onSubmit}>{props.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{t("Save role")}</Button>
        {!props.canSave ? <p className="text-xs leading-6 text-muted-foreground">{t("Your role can view this matrix but cannot change role permissions.")}</p> : null}
      </CardContent>
    </Card>
  );
}

function permissionSectionLabel(module: string, t: (text: string) => string) {
  const labels: Record<string, string> = {
    "access.permissions": "تخصیص مجوزهای نقش",
    "access.roles": "نقش‌ها",
    "notifications.broadcasts": "ارسال گروهی اعلان",
    "notifications.inbox": "صندوق اعلان‌ها",
    "notifications.logs": "لاگ تحویل اعلان",
    "notifications.templates": "قالب‌های اعلان",
    "system.settings": "تنظیمات سامانه",
    "users.accounts": "حساب‌های کاربران",
    "users.security": "امنیت و نقش‌های کاربر",
  };
  return labels[module] ?? module.split(".").map((part) => t(labelize(part))).join(" / ");
}

function permissionActionLabel(action: string, t: (text: string) => string) {
  return t(labelize(action));
}

function PermissionMatrix({ groups, search }: { groups: PermissionGroups; search: string }) {
  const filtered = Object.entries(groups).map(([module, permissions]) => [module, permissions.filter((permission) => `${permission.key} ${permission.description ?? ""}`.toLowerCase().includes(search.toLowerCase()))] as const).filter(([, permissions]) => permissions.length);
  return <div className="grid gap-4 xl:grid-cols-2">{filtered.map(([module, permissions]) => <Card className="rounded-lg border-border bg-background/35" key={module}><CardHeader><CardTitle className="text-base">{module}</CardTitle></CardHeader><CardContent className="grid gap-2">{permissions.map((permission) => <div className="rounded-md border border-border bg-card/70 p-3" key={permission.id}><p className="font-mono text-sm font-semibold">{permission.key}</p><p className="mt-1 text-xs text-muted-foreground">{permission.description ?? permission.action}</p></div>)}</CardContent></Card>)}</div>;
}

function AdvancedSummary(props: { deleted: string; kycStatus: string; mode: AccessMode; registeredFrom: string; registeredTo: string; search: string; selected: number; status: string; userScope: UserScope }) {
  const t = useAdminAccessT();
  return <div className="grid gap-3 rounded-lg border border-border bg-background/35 p-3 text-sm md:grid-cols-3 xl:grid-cols-6"><Summary label={t("Mode")} value={pageTitle(props.mode, t, props.userScope)} /><Summary label={t("Search")} value={props.search || t("None")} /><Summary label={t("Account status")} value={props.status === "all" ? t("All statuses") : t(labelize(props.status))} /><Summary label={t("KYC status")} value={props.kycStatus === "all" ? t("All KYC statuses") : t(labelize(props.kycStatus))} /><Summary label={t("Registration period")} value={`${props.registeredFrom || t("Beginning")} — ${props.registeredTo || t("Today")}`} /><Summary label={t("Selection")} value={`${props.selected} ${t("selected")}; ${t("deleted scope")} ${t(props.deleted)}`} /></div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><p className="font-medium">{label}</p><p className="mt-1 text-muted-foreground">{value}</p></div>;
}

function RecordDialog(props: { onOpenChange: (open: boolean) => void; record: UserItem | RoleItem | PermissionGroups | null }) {
  const t = useAdminAccessT();
  return <Dialog onOpenChange={props.onOpenChange} open={!!props.record}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{t("Access record")}</DialogTitle><DialogDescription>{t("Full access payload for audit inspection.")}</DialogDescription></DialogHeader><pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-6">{JSON.stringify(props.record, null, 2)}</pre></DialogContent></Dialog>;
}

function fromRole(role: RoleItem) {
  return { description: role.description ?? "", id: role.id, name: role.name, permissionKeys: role.permissions?.map((item) => item.permission.key) ?? [] };
}

function flattenPermissions(groups?: PermissionGroups) {
  return Object.values(groups ?? {}).flat();
}

function buildMetrics(mode: AccessMode, rows: Array<UserItem | RoleItem | { id: string }>, total: number, selected: number, t: (text: string) => string, stats?: UserStats) {
  if (mode === "users") {
    const meta = t("All accounts in this section; independent of pagination and filters.");
    return [
      { label: t("Total"), meta, value: stats?.total ?? total },
      { label: t("Active"), meta, value: stats?.active ?? 0 },
      { label: t("Pending verification"), meta, value: stats?.pendingVerification ?? 0 },
      { label: t("Suspended"), meta, value: stats?.suspended ?? 0 },
      { label: t("Inactive"), meta, value: stats?.inactive ?? 0 },
      { label: t("Deleted"), meta, value: stats?.deleted ?? 0 },
      { label: t("KYC approved"), meta, value: stats?.kycApproved ?? 0 },
      { label: t("KYC pending"), meta, value: stats?.kycPending ?? 0 },
      { label: t("KYC not started"), meta, value: stats?.kycNotStarted ?? 0 },
      { label: t("KYC rejected"), meta, value: stats?.kycRejected ?? 0 },
    ];
  }
  return [
    { label: t("Total"), meta: `${pageTitle(mode, t)} ${t("in scope")}`, value: total },
    { label: t("Selected"), meta: t("Rows selected for export"), value: selected },
    { label: t("Active"), meta: t("Non-deleted records on page"), value: rows.filter((row) => !("deletedAt" in row) || !row.deletedAt).length },
    { label: t("System"), meta: t("System roles or grouped permissions"), value: rows.filter((row) => "isSystem" in row && row.isSystem).length },
  ];
}

function recordTitle(row: UserItem | RoleItem) {
  return "roleMappings" in row ? [row.profile?.firstName, row.profile?.lastName].filter(Boolean).join(" ") || row.email || row.mobile || row.id : row.name;
}

function recordSubtitle(row: UserItem | RoleItem, t: (text: string) => string) {
  return "roleMappings" in row ? row.email || row.mobile || row.id : row.description ?? t("No description");
}

function accessSummary(row: UserItem | RoleItem, t: (text: string) => string) {
  if ("roleMappings" in row) return row.roleMappings.map((mapping) => mapping.role.name).join(", ") || t("No roles");
  return `${row.permissions?.length ?? 0} ${t("permissions")}; ${row._count?.users ?? 0} ${t("users")}`;
}

function ContactLine({ label, value, verified }: { label: string; value: string; verified: boolean }) {
  return <div className="flex min-w-0 items-center gap-1.5 text-xs"><span className="w-12 shrink-0 text-muted-foreground">{label}</span><span className="max-w-40 truncate" dir="ltr" title={value}>{value}</span>{verified ? <BadgeCheck aria-label="verified" className="size-3.5 shrink-0 text-emerald-500" /> : null}</div>;
}

function ActivityLine({ label, value }: { label: string; value: number }) {
  return <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular-nums">{value}</span></div>;
}

function UserBalances({ lang, user }: { lang: Lang; user: UserItem }) {
  const t = (text: string) => translateUiText(text, lang);
  const toman = user.wallets.find((wallet) => wallet.currency === "TOMAN");
  const silver = user.wallets.find((wallet) => wallet.currency === "SILVER_GRAM");
  return (
    <div className="space-y-1.5 text-xs">
      <BalanceLine label={t("Toman wallet")} value={`${formatBalance(toman?.balance, "TOMAN", lang)} ${t("TOMAN")}`} />
      <BalanceLine label={t("Silver wallet")} value={`${formatBalance(silver?.balance, "SILVER_GRAM", lang)} ${t("SILVER_GRAM")}`} />
      <BalanceLine label={t("Shopping credit")} value={`${formatBalance(user.shoppingCreditAccount?.balance, "TOMAN", lang)} ${t("TOMAN")}`} />
      {Number(toman?.locked ?? 0) > 0 || Number(silver?.locked ?? 0) > 0 ? <p className="text-[11px] text-amber-600">{t("Locked balance exists")}</p> : null}
    </div>
  );
}

function BalanceLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular-nums" dir="ltr">{value}</span></div>;
}

function confirmationTitle(action: "delete" | "revoke" | "suspend" | "deactivate" | null, t: (text: string) => string) {
  if (action === "delete") return t("Delete this user?");
  if (action === "revoke") return t("Sign out all devices?");
  if (action === "deactivate") return t("Deactivate this account?");
  return t("Suspend this user?");
}

function confirmationDescription(action: "delete" | "revoke" | "suspend" | "deactivate" | null, user: UserItem, t: (text: string) => string) {
  const name = recordTitle(user);
  if (action === "delete") return `${t("This soft-deletes the account and immediately revokes its active sessions.")} ${name}`;
  if (action === "revoke") return `${t("Every active session will be revoked and the user must sign in again.")} ${name}`;
  if (action === "deactivate") return `${t("The account will be disabled and all active sessions will be revoked.")} ${name}`;
  return `${t("The user will be banned from signing in and all active sessions will be revoked.")} ${name}`;
}

function formatMobile(value?: string | null) {
  return formatMobileDisplay(value) || "—";
}

function formatBalance(value: string | undefined, currency: "SILVER_GRAM" | "TOMAN", lang: Lang) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "fa-IR", {
    maximumFractionDigits: currency === "SILVER_GRAM" ? 3 : 0,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatCount(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "fa-IR").format(value);
}

function pageTitle(mode: AccessMode, t: (text: string) => string = (text) => text, userScope: UserScope = "staff") {
  if (mode === "roles") return t("Roles");
  if (mode === "permissions") return t("Permissions");
  return userScope === "all" ? t("Users") : t("Administrators");
}

function pageDescription(mode: AccessMode, lang: Lang, userScope: UserScope = "staff") {
  if (mode === "users" && userScope === "all") {
    return ({
      ar: "إدارة جميع حسابات المستخدمين والعملاء والموظفين والأرصدة والأدوار وإجراءات الأمان من مكان واحد.",
      en: "Manage every user account, including customers and staff, with balances, roles, activity, and security actions in one place.",
      fa: "همه حساب‌های کاربری، شامل مشتریان و مدیران، موجودی‌ها، نقش‌ها، فعالیت‌ها و عملیات امنیتی را یکجا مدیریت کنید.",
    } as Record<"ar" | "en" | "fa", string>)[lang as "ar" | "en" | "fa"] ?? "همه حساب‌های کاربری، شامل مشتریان و مدیران، موجودی‌ها، نقش‌ها، فعالیت‌ها و عملیات امنیتی را یکجا مدیریت کنید.";
  }
  const descriptions = {
    permissions: {
      ar: "راجع سجل الصلاحيات المستخدم في حراس الخلفية وإجراءات الإدارة المعتمدة على الصلاحيات.",
      en: "Review which administrative actions each permission allows and keep access limited to the right roles.",
      fa: "بررسی کنید هر مجوز چه اقدام مدیریتی را فعال می‌کند و دسترسی‌ها را فقط به نقش‌های لازم اختصاص دهید.",
    },
    roles: {
      ar: "أنشئ الأدوار وعدّل الأوصاف وعيّن الصلاحيات وأدر سير عمل الحذف الناعم/الاستعادة.",
      en: "Create roles, edit descriptions, assign permissions, and restore roles that were removed by mistake.",
      fa: "نقش‌ها را ایجاد کنید، توضیحات و مجوزها را تنظیم کنید و نقش‌هایی را که اشتباهی حذف شده‌اند بازگردانید.",
    },
    users: {
      ar: "أدر حسابات الموظفين والأدوار المعينة والسجلات المحذوفة وضوابط وصول الإدارة.",
      en: "Manage staff accounts, assigned roles, deleted records, and administrative access controls.",
      fa: "حساب‌های مدیر و کارشناس، نقش‌های تخصیص‌یافته، رکوردهای حذف‌شده و کنترل‌های دسترسی پنل را مدیریت کنید.",
    },
  } satisfies Record<AccessMode, Record<"ar" | "en" | "fa", string>>;
  return descriptions[mode][lang as "ar" | "en" | "fa"] ?? descriptions[mode].fa;
}

function labelize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}

function downloadJson(label: string, items: unknown[], successMessage = "Export downloaded.") {
  if (typeof window === "undefined" || !items.length) return;
  const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 2)], { type: "application/json;charset=utf-8" });
  downloadBlob(`${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`, blob);
  toast.success(successMessage);
}

function downloadBlob(filename: string, blob: Blob) {
  if (typeof window === "undefined") return;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function downloadFilename(contentDisposition: string | null) {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
}

function EmptyState() {
  const t = useAdminAccessT();
  return <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-background/30 p-6 text-center text-sm text-muted-foreground">{t("No access records match the current filters.")}</div>;
}

function TableSkeleton() {
  return <div className="space-y-3">{Array.from({ length: 8 }).map((_, index) => <ShadowSkeleton className="h-12" key={index} />)}</div>;
}

function AccessSkeleton() {
  return <div className="space-y-6"><ShadowSkeleton className="h-28" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-28" key={index} />)}</div><ShadowSkeleton className="h-[40rem]" /></div>;
}

function useAdminAccessT() {
  const { lang } = useI18n();
  return (text: string) => translateUiText(text, lang);
}
