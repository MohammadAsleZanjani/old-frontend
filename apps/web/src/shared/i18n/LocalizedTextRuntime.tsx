"use client";

import { useEffect } from "react";

import { useI18n } from "@/shared/i18n";
import { canonicalizeUiText, translateUiText } from "@/shared/i18n/ui-copy";

const originalText = new WeakMap<Text, string>();
const translatedAttrNames = ["aria-description", "aria-label", "alt", "data-placeholder", "placeholder", "title"] as const;

export function LocalizedTextRuntime() {
  const { lang } = useI18n();

  useEffect(() => {
    let observer: MutationObserver | undefined;
    let rafId: number | undefined;
    let startRafId: number | undefined;
    const pendingRoots = new Set<ParentNode>();

    const translateTree = (root: ParentNode) => {
      translateTextNodes(root, lang);
      translateAttributes(root, lang);
    };

    const scheduleTree = (root: ParentNode) => {
      pendingRoots.add(root);
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = undefined;
        const roots = Array.from(pendingRoots);
        pendingRoots.clear();
        roots.forEach(translateTree);
      });
    };

    const start = () => {
      translateTree(document.body);

      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === "characterData" && mutation.target instanceof Text) {
            translateTextNode(mutation.target, lang);
            continue;
          }

          for (const node of mutation.addedNodes) {
            if (node instanceof Text) translateTextNode(node, lang);
            if (node instanceof HTMLElement) scheduleTree(node);
          }

          if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
            translateElementAttributes(mutation.target, lang);
          }
        }
      });

      observer.observe(document.body, {
        attributes: true,
        attributeFilter: [...translatedAttrNames],
        characterData: true,
        childList: true,
        subtree: true,
      });
    };

    startRafId = window.requestAnimationFrame(start);

    return () => {
      if (startRafId) window.cancelAnimationFrame(startRafId);
      if (rafId) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [lang]);

  return null;
}

function translateTextNodes(root: ParentNode, lang: ReturnType<typeof useI18n>["lang"]) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || shouldSkipText(parent)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => translateTextNode(node, lang));
}

function translateTextNode(node: Text, lang: ReturnType<typeof useI18n>["lang"]) {
  const parent = node.parentElement;
  if (!parent || shouldSkipText(parent)) return;

  const current = node.nodeValue ?? "";
  const source = resolveSourceText(current, originalText.get(node), lang);
  originalText.set(node, source);
  const translated = translateUiText(source, lang);
  const value = preserveSurroundingWhitespace(current, translated);
  if (value !== current) node.nodeValue = value;
}

function preserveSurroundingWhitespace(current: string, translated: string) {
  const leading = current.match(/^\s+/)?.[0] ?? "";
  const trailing = current.match(/\s+$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function translateAttributes(root: ParentNode, lang: ReturnType<typeof useI18n>["lang"]) {
  if (root instanceof HTMLElement) translateElementAttributes(root, lang);
  root.querySelectorAll<HTMLElement>(translatedAttrNames.map((name) => `[${name}]`).join(",")).forEach((element) => {
    translateElementAttributes(element, lang);
  });
}

function translateElementAttributes(element: HTMLElement, lang: ReturnType<typeof useI18n>["lang"]) {
  if (shouldSkipAttributes(element)) return;

  for (const attr of translatedAttrNames) {
    const value = element.getAttribute(attr);
    if (!value) continue;

    const sourceAttr = `data-i18n-source-${attr}`;
    const source = resolveSourceText(value, element.getAttribute(sourceAttr), lang);
    element.setAttribute(sourceAttr, source);
    const translated = translateUiText(source, lang);
    if (translated !== value) element.setAttribute(attr, translated);
  }
}

function resolveSourceText(current: string, storedSource: string | null | undefined, lang: ReturnType<typeof useI18n>["lang"]) {
  const currentSource = canonicalizeUiText(current);
  if (!storedSource) return currentSource;

  const canonicalStored = canonicalizeUiText(storedSource);
  const storedVariants = new Set([
    canonicalStored,
    translateUiText(canonicalStored, lang),
    translateUiText(canonicalStored, "fa"),
    translateUiText(canonicalStored, "en"),
    translateUiText(canonicalStored, "ar"),
  ]);
  if (storedVariants.has(current) || storedVariants.has(currentSource)) return canonicalStored;

  return currentSource;
}

function shouldSkipText(element: HTMLElement) {
  return Boolean(
    element.closest(
      "script,style,pre,code,kbd,samp,textarea,input,[contenteditable='true'],[data-i18n-skip='true']",
    ),
  );
}

function shouldSkipAttributes(element: HTMLElement) {
  return Boolean(element.closest("script,style,pre,code,kbd,samp,[contenteditable='true'],[data-i18n-skip='true']"));
}
