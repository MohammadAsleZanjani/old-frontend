"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { AuthProvider } from "@/shared/auth/AuthProvider";
import { ReferralAttributionCapture } from "@/domains/referrals/ReferralAttributionCapture";
import { I18nProvider } from "@/shared/i18n";
import { LocalizedTextRuntime } from "@/shared/i18n/LocalizedTextRuntime";
import { ReferralPolicyNotice } from "@/features/customer-dashboard/components/ReferralPolicyNotice";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 60_000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <LocalizedTextRuntime />
          <ReferralAttributionCapture />
          <ReferralPolicyNotice />
          {children}
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
