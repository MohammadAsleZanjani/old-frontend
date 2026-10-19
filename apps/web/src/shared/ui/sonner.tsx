import { Toaster as Sonner, toast as sonnerToast } from "sonner";

import { translateErrorText, translateUiText } from "@/shared/i18n/ui-copy";

type ToasterProps = React.ComponentProps<typeof Sonner>;
type ToastArgs = Parameters<typeof sonnerToast>;

function currentLang(): string {
  if (typeof window === "undefined") return "fa";
  return window.localStorage.getItem("lang") || "fa";
}

function localizeMessage<T>(message: T): T {
  return typeof message === "string" ? translateUiText(message, currentLang()) as T : message;
}

function localizeToastArgs(args: ToastArgs): ToastArgs {
  const [message, options] = args;
  if (!options) return [localizeMessage(message)] as ToastArgs;
  const toastOptions = options as NonNullable<ToastArgs[1]> & { description?: unknown };
  return [
    localizeMessage(message),
    {
      ...toastOptions,
      description: localizeMessage(toastOptions.description),
    },
  ] as ToastArgs;
}

const toast = Object.assign(
  (...args: ToastArgs) => sonnerToast(...localizeToastArgs(args)),
  sonnerToast,
  {
    error: (...args: Parameters<typeof sonnerToast.error>) => {
      const [message, options] = args as ToastArgs;
      const localizedOptions = options && "description" in options
        ? { ...options, description: typeof options.description === "string" ? translateErrorText(options.description) : options.description }
        : options;
      return sonnerToast.error(
        typeof message === "string" ? translateErrorText(message) : message,
        localizedOptions,
      );
    },
    info: (...args: Parameters<typeof sonnerToast.info>) => sonnerToast.info(...localizeToastArgs(args as ToastArgs) as Parameters<typeof sonnerToast.info>),
    message: (...args: Parameters<typeof sonnerToast.message>) => sonnerToast.message(...localizeToastArgs(args as ToastArgs) as Parameters<typeof sonnerToast.message>),
    success: (...args: Parameters<typeof sonnerToast.success>) => sonnerToast.success(...localizeToastArgs(args as ToastArgs) as Parameters<typeof sonnerToast.success>),
    warning: (...args: Parameters<typeof sonnerToast.warning>) => sonnerToast.warning(...localizeToastArgs(args as ToastArgs) as Parameters<typeof sonnerToast.warning>),
  },
);

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group font-sans"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:font-sans group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
