import DaxHome from '../home/DaxHome';
import MessageList from './MessageList';

export default function ConversationView({
  messages, userName, phase, greeting, subtitle, suggestions, onPickSuggestion,
  conversations, activeId, onOpenConversation, onNewChat, introActive,
  models, selectedModelId, onModelSelect,
  ...messageHandlers
}) {
  // No active workspace — show the home dashboard
  if (!activeId || !messages) {
    return (
      <DaxHome
        userName={userName}
        conversations={conversations || []}
        onOpenConversation={onOpenConversation}
        onNewChat={onNewChat}
        onPickSuggestion={onPickSuggestion}
        introActive={introActive}
        models={models}
        selectedModelId={selectedModelId}
        onModelSelect={onModelSelect}
      />
    );
  }

  // Active workspace — show message stream
  return (
    <MessageList
      messages={messages}
      userName={userName}
      phase={phase}
      {...messageHandlers}
    />
  );
}
