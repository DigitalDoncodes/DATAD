import { FileText, Image as ImageIcon, FileSpreadsheet, FileCode, File as FileIcon, X, Loader2 } from 'lucide-react';

const ICONS = {
  image: ImageIcon,
  pdf: FileText,
  doc: FileText,
  code: FileCode,
  sheet: FileSpreadsheet,
  other: FileIcon,
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentChip({ attachment, onRemove }) {
  const Icon = ICONS[attachment.type] || FileIcon;
  return (
    <div
      className="
        flex items-center gap-2 rounded-xl border border-[var(--dax-border)]
        bg-[var(--dax-surface)] py-1.5 pl-2 pr-1.5
      "
    >
      {attachment.type === 'image' && attachment.previewUrl ? (
        <img src={attachment.previewUrl} alt="" className="h-7 w-7 rounded-lg object-cover" />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--dax-bg)] text-[var(--dax-text-muted)]">
          <Icon size={14} />
        </span>
      )}
      <div className="min-w-0 max-w-[9rem]">
        <p className="truncate text-xs font-medium text-[var(--dax-text)]">{attachment.name}</p>
        <p className="text-[10px] text-[var(--dax-text-muted)]">
          {attachment.status === 'reading' ? 'Reading…' : formatSize(attachment.size)}
        </p>
      </div>
      {attachment.status === 'reading' ? (
        <Loader2 size={12} className="animate-spin text-[var(--dax-text-muted)]" />
      ) : (
        <button
          type="button"
          onClick={() => onRemove?.(attachment.id)}
          aria-label={`Remove ${attachment.name}`}
          className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--dax-text-muted)] hover:bg-[var(--dax-surface-hover)]"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
