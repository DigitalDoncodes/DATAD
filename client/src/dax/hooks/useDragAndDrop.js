import { useRef, useState, useCallback } from 'react';

export function useDragAndDrop(onFiles) {
  const counter = useRef(0);
  const [isOver, setIsOver] = useState(false);

  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    counter.current += 1;
    setIsOver(true);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    counter.current -= 1;
    if (counter.current <= 0) {
      counter.current = 0;
      setIsOver(false);
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    counter.current = 0;
    setIsOver(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) onFiles?.(files);
  }, [onFiles]);

  return {
    isOver,
    dropzoneProps: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
