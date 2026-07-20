import { PanelLeftClose, PanelLeft, SquarePen, Search, Sparkles } from 'lucide-react';
import IconButton from '../common/IconButton';

export default function SidebarHeader({ brandName, collapsed, onToggleCollapse, onNew, onSearch }) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 px-2 pt-3">
        <IconButton icon={PanelLeft} label="Expand sidebar" onClick={onToggleCollapse} />
        <IconButton icon={SquarePen} label="New chat" onClick={onNew} />
        <IconButton icon={Search} label="Search chats" onClick={onSearch} />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 px-3 pt-3">
      <div className="flex items-center gap-2 px-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--dax-accent)] text-[var(--dax-accent-contrast)]">
          <Sparkles size={13} />
        </span>
        <span className="text-sm font-semibold text-[var(--dax-text)]">{brandName}</span>
      </div>
      <div className="flex items-center gap-0.5">
        <IconButton icon={Search} label="Search chats" size="sm" onClick={onSearch} />
        <IconButton icon={SquarePen} label="New chat" size="sm" onClick={onNew} />
        <IconButton icon={PanelLeftClose} label="Collapse sidebar" size="sm" onClick={onToggleCollapse} />
      </div>
    </div>
  );
}
