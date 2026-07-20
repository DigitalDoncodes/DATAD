import { Copy, RotateCcw, Pencil, Share2, Download, ChevronLeft, ChevronRight, ArrowRightToLine, Check } from 'lucide-react';
import { useState } from 'react';
import IconButton from '../common/IconButton';
import Tooltip from '../common/Tooltip';

export default function MessageToolbar({
  onCopy, onRegenerate, onContinue, onEdit, onShare, onExport,
  onBranchPrev, onBranchNext, branchIndex, branchCount,
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const hasBranches = branchCount > 1;

  return (
    <div className="flex items-center gap-0.5">
      {hasBranches && (
        <div className="mr-1 flex items-center gap-0.5 text-[11px] text-[var(--dax-text-muted)]">
          <IconButton icon={ChevronLeft} label="Previous response" size="sm" onClick={onBranchPrev} disabled={branchIndex <= 1} />
          <span>{branchIndex}/{branchCount}</span>
          <IconButton icon={ChevronRight} label="Next response" size="sm" onClick={onBranchNext} disabled={branchIndex >= branchCount} />
        </div>
      )}
      {onCopy && (
        <Tooltip label={copied ? 'Copied' : 'Copy'}>
          <IconButton icon={copied ? Check : Copy} label="Copy" size="sm" onClick={handleCopy} />
        </Tooltip>
      )}
      {onRegenerate && <Tooltip label="Regenerate"><IconButton icon={RotateCcw} label="Regenerate" size="sm" onClick={onRegenerate} /></Tooltip>}
      {onContinue && <Tooltip label="Continue"><IconButton icon={ArrowRightToLine} label="Continue" size="sm" onClick={onContinue} /></Tooltip>}
      {onEdit && <Tooltip label="Edit"><IconButton icon={Pencil} label="Edit" size="sm" onClick={onEdit} /></Tooltip>}
      {onShare && <Tooltip label="Share"><IconButton icon={Share2} label="Share" size="sm" onClick={onShare} /></Tooltip>}
      {onExport && <Tooltip label="Export"><IconButton icon={Download} label="Export" size="sm" onClick={onExport} /></Tooltip>}
    </div>
  );
}
