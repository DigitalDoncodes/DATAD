import { useEffect } from 'react';

export function useClickOutside(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside?.(e);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onOutside, active]);
}
