import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';

export default function Message({ message, userName, ...handlers }) {
  if (message.role === 'user') {
    return <UserMessage message={message} userName={userName} onEdit={handlers.onEdit} />;
  }
  return <AssistantMessage message={message} {...handlers} />;
}
