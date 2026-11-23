/**
 * Every app, from the manifests in `src/apps/<id>/manifest.ts`. Adding an
 * app is adding a folder; nothing else lists them.
 */
import type { AppManifest } from "@lib/app-shell";

const manifests = import.meta.glob<{ default: AppManifest }>("./*/manifest.ts", { eager: true });

/** In desktop order. */
export const APPS: readonly AppManifest[] = Object.values(manifests)
  .map((module) => module.default)
  .sort((a, b) => a.order - b.order);
