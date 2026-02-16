import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isCandidate = message.type === 'candidate';
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className="message-system">
        <span className="system-icon">{message.speakerAvatar}</span>
        <span className="system-text">{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`message-bubble ${isCandidate ? 'message-candidate' : 'message-interviewer'}`}>
      {!isCandidate && (
        <div className="message-avatar">{message.speakerAvatar}</div>
      )}
      <div className="message-body">
        <div className="message-header">
          <span className="message-name">{message.speakerName}</span>
        </div>
        <div className="message-content">{message.content}</div>
      </div>
      {isCandidate && (
        <div className="message-avatar">{message.speakerAvatar}</div>
      )}
    </div>
  );
}
