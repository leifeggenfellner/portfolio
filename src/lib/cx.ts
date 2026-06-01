/**
 * cx — tiny classnames helper. Falsy values are dropped.
 * Prefer this over template strings; it keeps Tailwind class
 * lists readable and friendly to `prettier-plugin-tailwindcss`.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
