/**
 * Stylelint — guards the design-token contract.
 *
 * The hard rule: no raw colors / sizes outside src/styles/tokens.css
 * and src/styles/globals.css. Components must reference tokens via
 * Tailwind utilities or `var(--token)`.
 */
export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [
    "dist/**",
    ".astro/**",
    "node_modules/**",
    "retro-os/**",
    "coverage/**",
    "playwright-report/**",
  ],
  rules: {
    // Tailwind v4 directives + custom at-rules
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "theme",
          "apply",
          "layer",
          "screen",
          "variants",
          "responsive",
          "custom-variant",
          "config",
          "plugin",
          "source",
          "utility",
          "reference",
          "import",
        ],
      },
    ],

    // Mask out a few rules that fight our retro aesthetic
    "selector-class-pattern": null,
    "custom-property-pattern": null,
    "no-descending-specificity": null,
    "alpha-value-notation": "number",
    "color-function-notation": "modern",

    // Keep the rest of the standard config strict
    "color-hex-length": "short",
    "shorthand-property-no-redundant-values": true,
    "declaration-block-no-redundant-longhand-properties": true,
  },
  overrides: [
    {
      // Token files own the raw colors; everywhere else is forbidden.
      files: ["src/**/*.css"],
      ignoreFiles: [
        "src/styles/tokens.css",
        "src/styles/globals.css",
        "src/styles/effects.css",
      ],
      rules: {
        "color-no-hex": true,
        "declaration-property-value-disallowed-list": {
          "/.*/": [
            "/^rgb\\(/",
            "/^rgba\\(/",
            "/^hsl\\(/",
            "/^hsla\\(/",
            "/^oklch\\(/",
          ],
        },
      },
    },
  ],
};
