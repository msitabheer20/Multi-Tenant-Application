import React, { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { useBot } from '@/hooks/use-bot';
import { ChatMessageItem } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface BotUIProps {
  serverId: string;
}

export const BotUI: React.FC<BotUIProps> = ({ serverId }) => {
  const {
    messages,
    isLoading,
    input,
    setInput,
    handleSubmit,
    clearHistory,
  } = useBot(serverId);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-screen">
      {/* Chat Header */}
      <div className="text-md font-semibold px-3 flex items-center justify-between h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
        <div className="flex items-center">
          <UserAvatar
            src="https://cdn-1.webcatalog.io/catalog/discord-bot-list/discord-bot-list-icon-filled-256.png?v=1714774149420"
            className="h-8 w- md:h-8 md:w-8 mr-2"
          />
          <p className="font-semibold text-md text-black dark:text-white">
            AI Assistant
          </p>
        </div>
        <button
          onClick={clearHistory}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          Clear History
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 flex flex-col py-4 overflow-y-auto p-8">
        <ScrollArea className="flex flex-col-reverse mt-auto">
          {messages.map((message) => (
            <ChatMessageItem 
              key={message.id} 
              message={message}
            />
          ))}
        </ScrollArea>
        <div ref={scrollRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        isLoading={isLoading}
        onSubmit={handleSubmit}
        input={input}
        setInput={setInput}
      />
    </div>
  );
}; 