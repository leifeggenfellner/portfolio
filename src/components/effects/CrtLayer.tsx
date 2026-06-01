/**
 * CrtLayer — the always-on-top vaporwave CRT effect layer.
 * Toggle intensity by setting [data-crt="off|subtle|full"] on
 * <html>. This component is purely presentational and inert
 * (pointer-events: none). Disabled when reduced-motion is set.
 */
export function CrtLayer() {
  return (
    <div className="crt-layer" aria-hidden>
      <div className="crt-scanlines" />
      <div className="crt-glow" />
      <div className="crt-noise" />
      <div className="crt-vignette" />
    </div>
  );
}
