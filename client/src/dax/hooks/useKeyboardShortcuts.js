import { useEffect } from 'react';

// map: { 'mod+k': handler, 'escape': handler }
// 'mod' means Cmd on Mac, Ctrl elsewhere.
export function useKeyboardShortcuts(map, deps = []) {
  useEffect(() => {
    function handle(e) {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      for (const combo of Object.keys(map)) {
        const parts = combo.split('+');
        const wantsMod = parts.includes('mod');
        const wantsShift = parts.includes('shift');
        const baseKey = parts[parts.length - 1];
        if (
          baseKey === key &&
          wantsMod === mod &&
          wantsShift === e.shiftKey
        ) {
          map[combo](e);
          return;
        }
      }
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
