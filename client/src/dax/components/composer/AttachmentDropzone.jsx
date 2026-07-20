import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { UploadCloud } from 'lucide-react';

export default function AttachmentDropzone({ onFiles, children }) {
  const { isOver, dropzoneProps } = useDragAndDrop(onFiles);
  return (
    <div {...dropzoneProps} className="relative">
      {children}
      {isOver && (
        <div
          className="
            pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2
            rounded-2xl border-2 border-dashed border-[var(--dax-accent)]
            bg-[var(--dax-accent-soft)]/90 text-sm font-medium text-[var(--dax-accent)]
          "
        >
          <UploadCloud size={16} />
          Drop files to attach
        </div>
      )}
    </div>
  );
}
