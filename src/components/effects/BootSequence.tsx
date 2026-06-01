/**
 * BootSequence — ~4s cinematic BIOS → kernel → desktop animation.
 *
 * - Skippable: ESC, Space, click, or "Skip" button.
 * - Persists "booted" in sessionStorage so reloads in the same
 *   tab go straight to the desktop. Use ?boot=1 to force replay.
 * - Honors prefers-reduced-motion: collapses to a 200ms fade.
 *
 * Implementation: a single state machine `phase` advances on
 * timers. Lines are typed into a fake serial console.
 */
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@lib/hooks/use-prefers-reduced-motion";

const LINES = [
  "RETRO BIOS v9.95.06 — (c) Retro Systems",
  "Detecting CPU.................. OK",
  "Detecting RAM.................. 640K (the perfect amount)",
  "Detecting GPU.................. CRT-mode enabled",
  "Mounting /home/visitor......... OK",
  "Loading kernel module: vaporwave.ko",
  "Loading kernel module: window-mgr.ko",
  "Starting RetroOS desktop environment...",
];

interface Props {
  onDone: () => void;
}

export function BootSequence({ onDone }: Props) {
  const reduced = usePrefersReducedMotion();
  const [printed, setPrinted] = useState<string[]>([]);
  const [skipped, setSkipped] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      sessionStorage.setItem("retro:booted", "1");
    } catch {
      /* ignore */
    }
    onDone();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        setSkipped(true);
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(finish, 200);
      return () => clearTimeout(t);
    }
    let i = 0;
    const step = setInterval(() => {
      i += 1;
      setPrinted(LINES.slice(0, i));
      if (i >= LINES.length) {
        clearInterval(step);
        setTimeout(finish, 600);
      }
    }, 380);
    return () => clearInterval(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  if (skipped) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Booting RetroOS"
      className="fixed inset-0 z-[var(--z-boot)] flex flex-col bg-black p-6 font-mono text-[18px] text-[#3cff9c]"
      style={{ textShadow: "0 0 6px rgba(60,255,156,.6)" }}
    >
      <header className="mb-2 flex items-center justify-between text-[#9d8ac4]">
        <span>RetroOS — POST</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSkipped(true);
            finish();
          }}
          className="bevel-out bg-surface text-13 text-text px-2 py-0.5"
        >
          Skip [Esc]
        </button>
      </header>
      <pre className="m-0 flex-1 whitespace-pre-wrap">
        {printed.join("\n")}
        <span style={{ animation: "boot-cursor 1s steps(1) infinite" }}>▌</span>
      </pre>
    </div>
  );
}
