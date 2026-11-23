// Flat ESLint config. Lints TS, Astro, Svelte, and config files.
// Layer boundaries are enforced via `no-restricted-imports` patterns
// — these mirror docs/01-architecture.md so violations fail CI.
import js from "@eslint/js";
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import astro from "eslint-plugin-astro";
import importPlugin from "eslint-plugin-import";
import svelte from "eslint-plugin-svelte";

/** Forbid upward / sideways imports per docs/01-architecture.md */
const LAYER_RULES = {
  "src/components/primitives/**": [
    {
      group: ["@apps/*", "@shell/*", "@effects/*"],
      message: "Primitives must not depend on apps/shell/effects.",
    },
  ],
  "src/components/effects/**": [
    { group: ["@apps/*", "@shell/*"], message: "Effects must not depend on apps or shell." },
  ],
  "src/apps/*/**": [
    { group: ["@apps/*", "../*"], message: "Apps must not import other apps. Compose via the shell." },
    { group: ["@shell/*"], message: "Apps must not depend on the shell. The shell wires apps." },
  ],
  "src/lib/**": [
    {
      group: ["@/components/*", "@primitives/*", "@apps/*", "@shell/*", "@effects/*"],
      message: "lib/ is a leaf layer; do not import components.",
    },
  ],
};

const layerOverrides = Object.entries(LAYER_RULES).map(([files, patterns]) => ({
  files: [files],
  rules: { "no-restricted-imports": ["error", { patterns }] },
}));

export default [
  {
    ignores: [
      "dist/**",
      ".astro/**",
      "node_modules/**",
      "retro-os/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "*.min.*",
    ],
  },

  js.configs.recommended,

  // The service worker template; the build fills in __PRECACHE__.
  {
    files: ["src/pwa/*.js"],
    languageOptions: { globals: { ...globals.serviceworker, __PRECACHE__: "readonly" } },
  },

  // Node scripts run from package.json and CI.
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },

  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
        node: true,
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,

      // TypeScript hygiene
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description", "ts-ignore": true, "ts-nocheck": true },
      ],

      // Imports
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          "newlines-between": "never",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",
      "import/no-cycle": ["error", { maxDepth: 4 }],
      "import/no-self-import": "error",

      // TypeScript handles `no-undef` natively.
      "no-undef": "off",

      // General hygiene
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "multi-line"],
    },
  },

  // Svelte components and rune modules: the plugin's recommended rules, with
  // TypeScript in <script lang="ts">. Before this, .svelte files weren't
  // linted at all, so the layer rules below didn't reach components.
  ...svelte.configs.recommended,
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: { parser: tsparser, extraFileExtensions: [".svelte"] },
      globals: { ...globals.browser },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },

  ...layerOverrides,

  // Tests: relax assertions
  {
    files: ["tests/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
  },

  // Config files
  {
    files: ["*.config.{js,ts,mjs,cjs}", "vitest.config.ts", "playwright.config.ts", "astro.config.ts"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "no-console": "off" },
  },

  ...astro.configs.recommended,
];
