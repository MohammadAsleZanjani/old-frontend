"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { useI18n } from "@/shared/i18n";
import { translateErrorText, translateUiText } from "@/shared/i18n/ui-copy";
import { cn } from "@/shared/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-start text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:start-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:ps-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className, ...props }, ref) => {
    const { lang } = useI18n();
    return (
      <h5
        ref={ref}
        className={cn("mb-1 font-medium leading-none tracking-tight", className)}
        {...props}
      >
        {localizeChildren(children, lang)}
      </h5>
    );
  },
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ children, className, ...props }, ref) => {
  const { lang } = useI18n();
  return (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props}>
      {localizeChildren(children, lang)}
    </div>
  );
});
AlertDescription.displayName = "AlertDescription";

function localizeChildren(children: React.ReactNode, lang: ReturnType<typeof useI18n>["lang"]) {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      const translated = translateUiText(child, lang);
      if (translated !== child) return translated;
      if (/\b(error|failed|failure|invalid|expired|unavailable|unable|denied|forbidden|unauthorized|not found)\b/i.test(child)) {
        return translateErrorText(child);
      }
      return child;
    }
    return child;
  });
}

export { Alert, AlertTitle, AlertDescription };
