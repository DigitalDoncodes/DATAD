import { motion, useReducedMotion } from 'framer-motion';
import SidebarHeader from './SidebarHeader';
import ConversationList from './ConversationList';
import SidebarFooter from './SidebarFooter';

export default function Sidebar({
  brandName,
  collapsed,
  onToggleCollapse,
  conversations,
  activeId,
  onSelect,
  onNew,
  onPin,
  onDelete,
  onRename,
  onSearch,
  onSettings,
  onExit,
  userName,
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 60 : 264 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full shrink-0 flex-col overflow-hidden border-r border-[var(--dax-border)] bg-[var(--dax-surface)]"
    >
      <SidebarHeader
        brandName={brandName}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onNew={onNew}
        onSearch={onSearch}
      />
      {!collapsed && (
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
          onPin={onPin}
          onDelete={onDelete}
          onRename={onRename}
        />
      )}
      {collapsed && <div className="flex-1" />}
      <SidebarFooter collapsed={collapsed} onSettings={onSettings} onExit={onExit} userName={userName} />
    </motion.aside>
  );
}
