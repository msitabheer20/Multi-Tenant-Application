import React from 'react';
import { Message } from '@/hooks/useFileBot';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className="p-4 pl-0">
      <div>
        <span className="text-xs opacity-70 mb-1 block">
          {message.role === 'user' ? 'YOU' : message.role === 'assistant' ? 'BOT' : 'SYSTEM'}
        </span>
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs opacity-70 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}; 