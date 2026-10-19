"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, CheckCheck, ChevronDown, Coins, Inbox, Languages, LogOut, Menu, Moon, Plus, Search, SlidersHorizontal, Sun } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotificationItem,
  type NotificationListQuery,
} from "@/features/admin/api/admin-notifications-api";
import { adminNavigation, findAdminItem } from "@/features/admin/config/admin-navigation";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import { useAuth } from "@/shared/auth/AuthProvider";
import { languageLabel, languageShortLabel, useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { cn } from "@/shared/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { BrandLogo } from "@/shared/ui/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

interface AdminShellProps {
  access?: {
    isSuperAdmin: boolean;
    permissions: string[];
    roleNames: string[];
  };
  children: ReactNode;
}

export function AdminShell({ access, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const { dir, lang, languages, setLang, setTheme, theme } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const [operationSearch, setOperationSearch] = useState("");
  const [notificationFilter, setNotificationFilter] = useState<"all" | "archived" | "read" | "unread" | "urgent">("unread");
  const accessQuery = useQuery({
    enabled: access === undefined,
    queryFn: () => getAdminOverview(),
    queryKey: ["admin-dashboard-overview"],
    retry: 1,
    staleTime: 30_000,
  });
  const shellAccess = access ?? accessQuery.data?.access;
  const activeItem = findAdminItem(pathname);
  const isRtl = dir === "rtl";
  const isAccessLoading = !shellAccess && accessQuery.isLoading;
  const useNavigationFallback = !shellAccess && !isAccessLoading;
  const profileName = [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(" ");
  const accountName = profileName || user?.email || shellAccess?.roleNames?.[0] || "Admin";
  const initials = accountName.slice(0, 2).toUpperCase();
  const operationResults = useMemo(() => {
    const term = operationSearch.trim().toLowerCase();
    if (!shellAccess && !useNavigationFallback) return [];
    if (term.length < 2) return [];
    return adminNavigation
      .flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
      .filter((item) => !isDuplicateSilverProductItem(item.group, item.href))
      .filter((item) => useNavigationFallback || !item.permission || hasAdminPermission(shellAccess, item.permission))
      .filter((item) => [item.label, item.description, item.group, item.href].some((value) => value.toLowerCase().includes(term)))
      .slice(0, 7);
  }, [operationSearch, shellAccess, useNavigationFallback]);
  const canManageNotifications = hasAdminPermission(shellAccess, "notifications.inbox.view");
  const notificationQuery: NotificationListQuery = {
    page: 1,
    pageSize: 6,
    priority: notificationFilter === "urgent" ? "URGENT" : undefined,
    sortOrder: "desc",
    status: notificationFilter === "all" || notificationFilter === "urgent" ? undefined : notificationFilter.toUpperCase() as NotificationListQuery["status"],
  };
  const notifications = useQuery({
    enabled: canManageNotifications,
    queryFn: () => getAdminNotifications(notificationQuery),
    queryKey: ["admin-top-notifications", notificationFilter],
    retry: 1,
    staleTime: 20_000,
  });
  const unreadNotifications = useQuery({
    enabled: canManageNotifications,
    queryFn: () => getAdminNotifications({ page: 1, pageSize: 1, status: "UNREAD" }),
    queryKey: ["admin-top-notifications-unread"],
    retry: 1,
    staleTime: 20_000,
  });

  const sidebar = (
    <AdminSidebar
      isAllowed={(permission) => useNavigationFallback || !permission || hasAdminPermission(shellAccess, permission)}
      isLoading={isAccessLoading}
      dir={dir}
      pathname={pathname}
    />
  );
  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    router.replace("/");
    router.refresh();
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground" dir={dir}>
        <div className={cn(
          "fixed inset-y-0 z-30 hidden w-80 bg-card/75 shadow-[0_20px_80px_-50px_var(--glow)] backdrop-blur-xl lg:block",
          isRtl ? "right-0 border-l border-border" : "left-0 border-r border-border",
        )}>
          {sidebar}
        </div>
        <div className={cn("text-start rtl:text-right ltr:text-left", isRtl ? "lg:pr-80" : "lg:pl-80")}>
          <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="flex min-h-16 items-center gap-3 px-4 text-start lg:px-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="lg:hidden" size="icon" variant="outline" aria-label={t("Open admin menu")}>
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-80 p-0" side={isRtl ? "right" : "left"}>
                  {sidebar}
                </SheetContent>
              </Sheet>

              <div className="min-w-0 flex-1 text-start">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{t(activeItem.group)}</span>
                  <span>/</span>
                  <span>{t(activeItem.label)}</span>
                </div>
                <h1 className="truncate text-lg font-semibold">{t(activeItem.label)}</h1>
              </div>

              <form
                className="hidden max-w-sm flex-1 items-center md:flex"
                onSubmit={(event) => {
                  event.preventDefault();
                  const target = operationResults[0];
                  if (target) {
                    setOperationSearch("");
                    router.push(target.href as never);
                  }
                }}
              >
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-10 rounded-lg ps-9"
                    onChange={(event) => setOperationSearch(event.target.value)}
                    placeholder={t("Search operations")}
                    value={operationSearch}
                  />
                  {operationSearch.trim().length >= 2 ? (
                    <div className="absolute top-12 z-50 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-[0_22px_80px_-38px_var(--glow)]">
                      {operationResults.length ? (
                        <div className="max-h-96 overflow-auto p-1">
                          {operationResults.map((result) => {
                            const Icon = result.icon;
                            return (
                              <Link
                                className="flex items-start gap-3 rounded-md px-3 py-2.5 text-start transition hover:bg-secondary"
                                href={result.href as never}
                                key={result.href}
                                onClick={() => setOperationSearch("")}
                              >
                                <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold">{t(result.label)}</span>
                                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{t(result.group)} · {t(result.description)}</span>
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-sm text-muted-foreground">{t("No permitted admin operation matches this search.")}</div>
                      )}
                    </div>
                  ) : null}
                </div>
              </form>

              <AdminNotificationDropdown
                align={isRtl ? "start" : "end"}
                canManage={canManageNotifications}
                dir={dir}
                filter={notificationFilter}
                notifications={notifications.data?.items ?? []}
                pending={notifications.isLoading}
                setFilter={setNotificationFilter}
                unreadCount={unreadNotifications.data?.total ?? unreadNotifications.data?.meta?.total ?? 0}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} size="icon" variant="outline" aria-label={t("Toggle theme")}>
                    <Moon className="size-5 dark:block light:hidden" />
                    <Sun className="hidden size-5 light:block" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("Theme")}</TooltipContent>
              </Tooltip>

              <DropdownMenu dir={dir}>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2" variant="outline" aria-label={t("Change language")}>
                    <Languages className="size-4" />
                    <span className="hidden sm:inline">{languageShortLabel(lang)}</span>
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-44 text-start">
                  <DropdownMenuLabel>{t("Language")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {languages.map((option) => (
                    <DropdownMenuItem
                      className={cn(option.code === lang && "bg-secondary font-semibold")}
                      key={option.code}
                      onClick={() => setLang(option.code)}
                    >
                      <span className="flex-1">{languageLabel(option)}</span>
                      <span className="text-xs text-muted-foreground">{languageShortLabel(option.code)}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu dir={dir}>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2" variant="outline">
                    <Avatar className="size-7">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-32 truncate sm:inline">{accountName}</span>
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-56 text-start">
                  <DropdownMenuLabel>{t("Admin account")}</DropdownMenuLabel>
                  {user?.email ? <DropdownMenuLabel className="truncate pt-0 text-xs font-normal text-muted-foreground" dir="ltr">{user.email}</DropdownMenuLabel> : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={"/user" as never}>{t("User Dashboard")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={"/admin/profile" as never}>{t("My profile")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={"/admin/profile/security" as never}>{t("Security")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => void handleSignOut()}>
                    <LogOut className="size-4" />
                    {t("Logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="px-4 py-6 text-start rtl:text-right ltr:text-left lg:px-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}

function AdminNotificationDropdown({
  align,
  canManage,
  dir,
  filter,
  notifications,
  pending,
  setFilter,
  unreadCount,
}: {
  align: "end" | "start";
  canManage: boolean;
  dir: "ltr" | "rtl";
  filter: "all" | "archived" | "read" | "unread" | "urgent";
  notifications: AdminNotificationItem[];
  pending: boolean;
  setFilter: (filter: "all" | "archived" | "read" | "unread" | "urgent") => void;
  unreadCount: number;
}) {
  const queryClient = useQueryClient();
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const markOneRead = useMutation({
    mutationFn: (id: string) => markAdminNotificationRead(id),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Notification could not be marked read")),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-top-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-top-notifications-unread"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });
  const markAllRead = useMutation({
    mutationFn: () => markAllAdminNotificationsRead(),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Notifications could not be marked read")),
    onSuccess: () => {
      toast.success(t("Notifications marked read."));
      void queryClient.invalidateQueries({ queryKey: ["admin-top-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-top-notifications-unread"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });
  const filters: Array<{ icon: typeof Inbox; label: string; value: typeof filter }> = [
    { icon: Inbox, label: "All", value: "all" },
    { icon: AlertTriangle, label: "Unread", value: "unread" },
    { icon: CheckCheck, label: "Read", value: "read" },
    { icon: SlidersHorizontal, label: "Urgent", value: "urgent" },
  ];

  return (
    <DropdownMenu dir={dir}>
      <DropdownMenuTrigger asChild>
        <Button className="relative" size="icon" variant="outline" aria-label={t("Notifications")}>
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute -end-1 -top-1 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-5 text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-[min(28rem,calc(100vw-2rem))] p-0 text-start">
        <div className="border-b border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DropdownMenuLabel className="p-0 text-base">{t("Notification center")}</DropdownMenuLabel>
              <p className="mt-1 text-xs text-muted-foreground">{t("Important updates about users, orders, payments, delivery, content, and support.")}</p>
            </div>
            <Badge variant={unreadCount ? "destructive" : "outline"}>{unreadCount} {t("unread")}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {filters.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  className={cn("h-auto flex-col gap-1 px-2 py-2 text-xs", filter === item.value && "border-primary bg-primary/10 text-primary")}
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  type="button"
                  variant="outline"
                >
                  <Icon className="size-4" />
                  {t(item.label)}
                </Button>
              );
            })}
          </div>
        </div>

        {!canManage ? (
          <div className="p-4 text-sm text-muted-foreground">{t("You do not have permission to view or manage these notifications.")}</div>
        ) : pending ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-16 rounded-lg" key={index} />)}
          </div>
        ) : notifications.length ? (
          <div className="max-h-96 overflow-auto p-2">
            {notifications.map((notification) => (
              <Link
                className="block rounded-lg border border-transparent p-3 transition hover:border-border hover:bg-secondary/70"
                href={`/admin/system/operations/${notification.id}` as never}
                key={notification.id}
                onClick={() => {
                  if (notification.status === "UNREAD") markOneRead.mutate(notification.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{notification.body}</p>
                  </div>
                  <Badge variant={notification.status === "UNREAD" ? "destructive" : "outline"}>{t(notification.status)}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{t(notification.event)}</span>
                  <span>·</span>
                  <span>{t(notification.priority)}</span>
                  {notification.entityType ? (
                    <>
                      <span>·</span>
                      <span>{t(notification.entityType)}</span>
                    </>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid min-h-40 place-items-center p-4 text-sm text-muted-foreground">{t("No notifications match this filter.")}</div>
        )}

        <DropdownMenuSeparator />
        <div className="grid gap-2 p-3 sm:grid-cols-3">
          <Button asChild variant="outline">
            <Link href={"/admin/system/operations" as never}>
              <Inbox className="size-4" />
              {t("Show all")}
            </Link>
          </Button>
          <Button disabled={!canManage || !unreadCount || markAllRead.isPending} onClick={() => markAllRead.mutate()} variant="outline">
            <CheckCheck className="size-4" />
            {t("Read all")}
          </Button>
          <Button asChild>
            <Link href={"/admin/system/operations/create" as never}>
              <Plus className="size-4" />
              {t("Add new")}
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AdminSidebar({
  dir,
  isAllowed,
  isLoading,
  pathname,
}: {
  dir: "ltr" | "rtl";
  isAllowed: (permission?: string) => boolean | undefined;
  isLoading: boolean;
  pathname: string;
}) {
  const activeItem = findAdminItem(pathname);
  const activeGroup = activeItem.group ?? adminNavigation[0]?.label;
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const isRtl = dir === "rtl";
  const accordionTriggerIndicatorClass =
    "[&>svg:last-child]:-rotate-90 rtl:[&>svg:last-child]:rotate-90 [&[data-state=open]>svg:last-child]:rotate-0 rtl:[&[data-state=open]>svg:last-child]:rotate-0";
  return (
    <div className="flex h-full flex-col text-start rtl:text-right ltr:text-left" dir={dir} style={{ textAlign: isRtl ? "right" : "left" }}>
      <div className="border-b border-border/70 p-5">
        <Link className="flex items-center gap-3 text-start rtl:text-right ltr:text-left" href={"/admin" as never}>
          <BrandLogo className="size-14 shrink-0" />
          <span className="min-w-0">
            <span className="block text-lg font-black">{t("مدیریت نقره")}</span>
            <span className="block truncate text-xs text-muted-foreground">{t("مرکز کنترل معاملات و کیف پول")}</span>
          </span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-4 text-start rtl:text-right ltr:text-left" dir={dir} style={{ textAlign: isRtl ? "right" : "left" }}>
          {isLoading ? <AdminSidebarSkeleton /> : null}
          {!isLoading ? (
          <Accordion className="space-y-2" defaultValue={activeGroup ? [activeGroup] : []} key={activeGroup} type="multiple">
          {adminNavigation.map((group) => {
            const visibleItems = group.items.filter((item) => !isDuplicateSilverProductItem(group.label, item.href) && isAllowed(item.permission));
            if (!visibleItems.length) return null;
            const GroupIcon = group.icon;
            const groupActive = group.label === activeGroup;
            return (
              <AccordionItem className="rounded-xl border border-border/70 bg-card/35 px-2" key={group.label} value={group.label}>
                <AccordionTrigger className={cn(
                  "py-3 text-start text-xs font-semibold uppercase tracking-normal no-underline hover:no-underline rtl:text-right ltr:text-left",
                  accordionTriggerIndicatorClass,
                  groupActive ? "text-foreground" : "text-muted-foreground",
                )}>
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-start rtl:text-right ltr:text-left">
                    <GroupIcon className="size-4 shrink-0" />
                    <span className="truncate">{t(group.label)}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeItem.href === item.href;
                    return (
                      <Link
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition rtl:text-right ltr:text-left",
                          active
                            ? "bg-gradient-gold text-gold-foreground shadow-elegant"
                            : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                        )}
                        href={item.href as never}
                        key={item.href}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>
                        {item.primaryAction ? <Badge variant={active ? "secondary" : "outline"}>{t("New")}</Badge> : null}
                      </Link>
                    );
                  })}
                </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
          </Accordion>
          ) : null}
        </nav>
      </ScrollArea>
    </div>
  );
}

function isDuplicateSilverProductItem(groupLabel: string, href: string) {
  if (groupLabel !== "نقره") return false;
  return href === "/admin/shop/products"
    || href.startsWith("/admin/shop/products/")
    || href === "/admin/products/create"
    || href.startsWith("/admin/shop/inventory");
}

function AdminSidebarSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, groupIndex) => (
        <div className="rounded-lg border border-border/70 bg-background/25 p-3" key={groupIndex}>
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 shrink-0 rounded" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-10/12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
