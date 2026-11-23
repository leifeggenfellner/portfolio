/**
 * Calls `onStop` on the next key press or click anywhere, and swallows that
 * input so it doesn't also act (type into a field, close a window). For
 * full-screen toys that any input dismisses. Returns a function that stops
 * listening.
 */
export function stopOnInput(onStop: () => void, target: EventTarget = window): () => void {
  const stop = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    remove();
    onStop();
  };
  const remove = () => {
    target.removeEventListener("keydown", stop, { capture: true });
    target.removeEventListener("pointerdown", stop, { capture: true });
  };
  target.addEventListener("keydown", stop, { capture: true });
  target.addEventListener("pointerdown", stop, { capture: true });
  return remove;
}
