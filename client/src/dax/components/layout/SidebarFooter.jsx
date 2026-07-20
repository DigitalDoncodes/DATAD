import { Settings, LogOut } from 'lucide-react';
import IconButton from '../common/IconButton';

export default function SidebarFooter({ collapsed, onSettings, onExit, userName }) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 pb-3">
        <IconButton icon={Settings} label="Settings" onClick={onSettings} />
        {onExit && <IconButton icon={LogOut} label="Dashboard" onClick={onExit} />}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between border-t border-[var(--dax-border)] px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--dax-surface)] text-[10px] font-semibold text-[var(--dax-text-muted)]">
          {(userName || 'U').charAt(0).toUpperCase()}
        </span>
        <span className="truncate text-xs font-medium text-[var(--dax-text-muted)]">{userName || 'You'}</span>
      </div>
      <div className="flex items-center gap-0.5">
        <IconButton icon={Settings} label="Settings" size="sm" onClick={onSettings} />
        {onExit && <IconButton icon={LogOut} label="Dashboard" size="sm" onClick={onExit} />}
      </div>
    </div>
  );
}
