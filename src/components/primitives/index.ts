/**
 * Public surface of the primitive layer.
 *
 * Rules for what belongs here:
 *  - presentational only, zero portfolio content
 *  - depends only on @lib + tokens (never on apps/shell)
 *  - variant- or compound-driven, props stay narrow
 *
 * Note: RetroCard is an Astro component — import it directly
 * in .astro files via `../primitives/RetroCard.astro`.
 */
export { default as RetroButton } from "./RetroButton.svelte";
export { default as ContextMenu } from "./ContextMenu.svelte";
export { default as WindowHeader } from "./WindowHeader.svelte";
export { default as RetroWindow } from "./RetroWindow.svelte";
