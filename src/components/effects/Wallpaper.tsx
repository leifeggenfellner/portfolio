/**
 * Wallpaper — vaporwave sky + neon sun + perspective grid.
 * All layers come from CSS classes in effects.css; this
 * component just composes them.
 */
export function Wallpaper() {
  return (
    <div className="wallpaper" aria-hidden>
      <div className="wallpaper-sun" />
      <div className="wallpaper-grid" />
    </div>
  );
}
