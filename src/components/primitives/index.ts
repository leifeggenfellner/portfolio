/**
 * Public surface of the primitive layer.
 *
 * Rules for what belongs here:
 *  - presentational only, zero portfolio content
 *  - depends only on @lib + tokens (never on apps/shell)
 *  - variant- or compound-driven, props stay narrow
 */
export { RetroButton, type RetroButtonProps } from "./RetroButton";
export { RetroCard } from "./RetroCard";
export { WindowHeader, type WindowHeaderProps } from "./WindowHeader";
export { RetroWindow, type RetroWindowProps } from "./RetroWindow";
