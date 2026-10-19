"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { customerDashboardNavigation, findCustomerDashboardItem, isCustomerDashboardItemActive } from "@/features/customer-dashboard/config/customer-dashboard-navigation";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { cn } from "@/shared/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet";

interface CustomerDashboardShellProps {
  children: ReactNode;
  isKycVerified?: boolean;
}

export function CustomerDashboardShell({ children, isKycVerified = true }: CustomerDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { dir, lang } = useI18n();
  const [dashboardSearch, setDashboardSearch] = useState("");
  const activeItem = findCustomerDashboardItem(pathname);
  const isRtl = dir === "rtl";
  const searchResults = useMemo(() => {
    const term = dashboardSearch.trim().toLowerCase();
    if (term.length < 2) return [];
    return customerDashboardNavigation
      .flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
      .filter((item) => [item.label, item.description, item.group, item.href].some((value) => value.toLowerCase().includes(term)))
      .slice(0, 7);
  }, [dashboardSearch]);
  const sidebar = <CustomerSidebar dir={dir} isKycVerified={isKycVerified} lang={lang} pathname={pathname} />;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" dir={dir}>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="hidden shrink-0 lg:block lg:w-[300px]">
          <div className="sticky top-24 h-[calc(100svh-7rem)] min-h-0 overflow-hidden rounded-2xl border border-border glass shadow-premium">
            {sidebar}
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-5">
          <div className="rounded-2xl border border-border glass p-4 shadow-elegant">
            <div className="flex flex-wrap items-center gap-3 text-start">
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="lg:hidden" size="icon" variant="outline" aria-label="Open dashboard menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="h-svh w-80 overflow-hidden p-0" side={isRtl ? "right" : "left"}>
                  {sidebar}
                </SheetContent>
              </Sheet>
              <div className="min-w-0 flex-1 text-start">
                <div className="text-xs text-muted-foreground">{translateUiText(activeItem.group, lang)}</div>
                <h1 className="truncate text-xl font-black">{translateUiText(activeItem.label, lang)}</h1>
              </div>
              <form
                className="relative hidden min-w-72 md:block"
                onSubmit={(event) => {
                  event.preventDefault();
                  const target = searchResults[0];
                  if (target) {
                    setDashboardSearch("");
                    router.push(resolveDashboardHref(target.href, isKycVerified) as never);
                  }
                }}
              >
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 rounded-xl ps-9"
                  onChange={(event) => setDashboardSearch(event.target.value)}
                  placeholder={translateUiText("Search dashboard", lang)}
                  value={dashboardSearch}
                />
                {dashboardSearch.trim().length >= 2 ? (
                  <div className="absolute top-12 z-50 w-full overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-[0_22px_80px_-38px_var(--glow)]">
                    {searchResults.length ? (
                      <div className="max-h-96 overflow-auto p-1">
                        {searchResults.map((result) => {
                          const Icon = result.icon;
                          return (
                            <Link
                              className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-secondary"
                              href={resolveDashboardHref(result.href, isKycVerified) as never}
                              key={result.href}
                              onClick={() => setDashboardSearch("")}
                            >
                              <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold">{translateUiText(result.label, lang)}</span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{translateUiText(result.group, lang)} · {translateUiText(result.description, lang)}</span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">{translateUiText("No dashboard section matches this search.", lang)}</div>
                    )}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

function CustomerSidebar({ dir, isKycVerified, lang, pathname }: { dir: "ltr" | "rtl"; isKycVerified: boolean; lang: string; pathname: string }) {
  const activeItem = findCustomerDashboardItem(pathname);
  const ActiveIcon = activeItem.icon;
  const activeGroup = activeItem.group ?? customerDashboardNavigation[0]?.label;
  const isRtl = dir === "rtl";
  const accordionTriggerIndicatorClass =
    "[&>svg:last-child]:-rotate-90 rtl:[&>svg:last-child]:rotate-90 [&[data-state=open]>svg:last-child]:rotate-0 rtl:[&[data-state=open]>svg:last-child]:rotate-0";
  return (
    <div className="flex h-full min-h-0 flex-col text-start rtl:text-right ltr:text-left" dir={dir} style={{ textAlign: isRtl ? "right" : "left" }}>
      <div className="border-b border-border/70 p-5">
        <Link className="flex items-center gap-3 text-start rtl:text-right ltr:text-left" href={"/user" as never}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-metallic shadow-elegant">
            <ActiveIcon className="h-5 w-5 text-primary" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-black">{translateUiText("داشبورد نقره", lang)}</span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">{translateUiText("معاملات، کیف پول و تحویل", lang)}</span>
          </span>
        </Link>
      </div>
      <ScrollArea className="min-h-0 flex-1 overscroll-contain">
        <nav className="p-4 text-start rtl:text-right ltr:text-left" dir={dir} style={{ textAlign: isRtl ? "right" : "left" }}>
          <Accordion className="space-y-2" defaultValue={activeGroup ? [activeGroup] : []} key={activeGroup} type="multiple">
          {customerDashboardNavigation.map((group) => {
            const GroupIcon = group.icon;
            const groupActive = group.label === activeGroup;
            return (
              <AccordionItem className="rounded-xl border border-border/70 bg-card/35 px-2" key={group.label} value={group.label}>
                <AccordionTrigger className={cn(
                  "py-3 text-start text-xs font-semibold no-underline hover:no-underline rtl:text-right ltr:text-left",
                  accordionTriggerIndicatorClass,
                  groupActive ? "text-foreground" : "text-muted-foreground",
                )}>
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-start rtl:text-right ltr:text-left">
                    <GroupIcon className="size-4 shrink-0" />
                    <span className="truncate">{translateUiText(group.label, lang)}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeItem.href === item.href;
                    return (
                      <Link
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm transition rtl:text-right ltr:text-left",
                          active ? "bg-gradient-gold text-gold-foreground shadow-elegant" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                        )}
                        href={resolveDashboardHref(item.href, isKycVerified) as never}
                        key={item.href}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{translateUiText(item.label, lang)}</span>
                      </Link>
                    );
                  })}
                </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
          </Accordion>
        </nav>
      </ScrollArea>
    </div>
  );
}

function resolveDashboardHref(href: string, isKycVerified: boolean) {
  if (!isKycVerified && href === "/user/buy-silver") {
    return "/user/profile";
  }
  return href;
}
