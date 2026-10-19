import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi", ".next", "**/.next/**", "**/.expo/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "Keep server-only imports isolated to Next.js server modules or backend code.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-empty": "off",
      "prefer-const": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: [
      "**/apps/web/app/**/*.{ts,tsx}",
      "**/apps/web/src/shared/auth/**/*.{ts,tsx}",
      "**/apps/web/src/shared/i18n/**/*.{ts,tsx}",
      "**/apps/web/src/shared/ui/**/*.{ts,tsx}",
      "app/**/*.{ts,tsx}",
      "src/shared/auth/**/*.{ts,tsx}",
      "src/shared/i18n/**/*.{ts,tsx}",
      "src/shared/ui/**/*.{ts,tsx}",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
