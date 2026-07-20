import { useLayoutEffect } from 'react';

const MAX_HEIGHT = 240;

function resize(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
}

export function useAutosizeTextarea(ref, value) {
  useLayoutEffect(() => {
    resize(ref.current);
    // The very first measurement can land before webfonts/layout settle
    // (scrollHeight reads too large and never gets a chance to re-measure
    // since `value` doesn't change again) — one more pass next frame fixes it.
    const raf = requestAnimationFrame(() => resize(ref.current));
    return () => cancelAnimationFrame(raf);
  }, [ref, value]);
}
