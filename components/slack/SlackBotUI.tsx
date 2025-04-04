import React, { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { useSlackBot } from '@/hooks/use-slack-bot';
import { ChatMessageItem } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { LunchStatusTable } from './LunchStatusTable';
import { UpdateStatusTable } from './UpdateStatusTable';
import { ReportStatusTable } from './ReportStatusTable';
import { ContentModal } from './ContentModal';
import { SlackLunchReport, SlackUpdateReport, SlackReportStatusReport } from '@/lib/types/slack';

export const SlackBotUI: React.FC = () => {
  const {
    messages,
    isLoading,
    input,
    selectedContent,
    setInput,
    setSelectedContent,
    handleSubmit,
    clearHistory,
  } = useSlackBot();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

    const renderCustomContent = (customContent: any) => {
    if (!customContent || !customContent.type) return null;

    switch (customContent.type) {
      case 'lunchStatus':
        return <LunchStatusTable data={customContent.data as SlackLunchReport} />;
      case 'updateStatus':
        return <UpdateStatusTable 
          data={customContent.data as SlackUpdateReport} 
          onSelectContent={(name, content) => setSelectedContent({ name, content })}
        />;
      case 'reportStatus':
        return <ReportStatusTable 
          data={customContent.data as SlackReportStatusReport} 
          onSelectContent={(name, content) => setSelectedContent({ name, content })}
        />;
      default:
        return customContent;
    }
  };

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-screen">
      {/* Chat Header */}
      <div className="text-md font-semibold px-3 flex items-center justify-between h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
        <div className="flex items-center">
          <UserAvatar
            src="https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/306_Slack_logo-512.png"
            className="h-8 md:h-8 md:w-8 mr-2"
          />
          <p className="font-semibold text-md text-black dark:text-white">
            Slack Assistant
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
              message={{
                ...message,
                customContent: message.customContent 
                  ? renderCustomContent(message.customContent)
                  : undefined
              }}
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

      {/* Content Modal */}
      {selectedContent && (
        <ContentModal
          content={selectedContent.content}
          name={selectedContent.name}
          onClose={() => setSelectedContent(null)}
        />
      )}
    </div>
  );
}; 