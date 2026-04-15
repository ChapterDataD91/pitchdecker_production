import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ---------------------------------------------------------------------------
// Design-system firewall between the editor and /output-template/.
// See /output-template/README.md for the full rationale.
// ---------------------------------------------------------------------------

/**
 * Inside /output-template/**: only `@/lib/types` is allowed as an editor-side
 * import. Everything else that would couple the output to the editor's design
 * system is banned.
 */
const outputTemplateRestrictedImports = {
  paths: [
    { name: "@/lib/theme", message: "Output template must not import editor theme tokens. Use /output-template/brand.ts instead." },
    { name: "tailwindcss", message: "Output template is Tailwind-free." },
    { name: "next/font", message: "Output template loads fonts via brand.ts (Typekit + Google Fonts <link>s)." },
    { name: "next/font/google", message: "Output template loads fonts via brand.ts." },
    { name: "next/font/local", message: "Output template loads fonts via brand.ts." },
    { name: "framer-motion", message: "Output template animations live in /output-template/scripts/ (vanilla JS). No React animation libs." },
    { name: "react", message: "Output template emits HTML strings, not React components." },
    { name: "react-dom", message: "Output template emits HTML strings, not React components." },
    { name: "next", message: "Output template is framework-agnostic. Next.js primitives belong in /app or /components." },
    { name: "zustand", message: "Output template is stateless. No stores." },
    { name: "@dnd-kit/core", message: "Output template has no client-side interactivity beyond /scripts/." },
  ],
  patterns: [
    { group: ["@/components/*", "@/components"], message: "Output template must not import editor UI components." },
    { group: ["@/app/*"], message: "Output template must not import from the Next.js app directory." },
    { group: ["@/lib/store/*", "@/lib/hooks/*"], message: "Output template must not import editor state or hooks." },
    { group: ["@/lib/mcp/*"], message: "Output template does not call MCP. The publish route does." },
    { group: ["@/lib/validators/*"], message: "Validators are an editor concern; output template receives already-validated data." },
    { group: ["next/*"], message: "Output template is framework-agnostic." },
  ],
};

/**
 * Outside /output-template/**: only the barrel `@/output-template` is allowed.
 * Deep imports into internal files are banned so the module boundary is real.
 */
const editorRestrictedImports = {
  patterns: [
    {
      group: ["@/output-template/*"],
      message: "Import from '@/output-template' (the barrel) only. Internal paths are not part of the public API.",
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["output-template/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", outputTemplateRestrictedImports],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "config/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", editorRestrictedImports],
    },
  },
]);

export default eslintConfig;
