import React, { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { useFileBot } from '@/hooks/use-file-bot';
import { ChatMessageItem } from './ChatMessage';
import { ChatInput } from './ChatInput';
import FileUploadModal from '@/components/chat/chat-file-upload';

interface FileBotUIProps {
  serverId: string;
}

export const FileBotUI: React.FC<FileBotUIProps> = ({ serverId }) => {
  const {
    messages,
    isLoading,
    isProcessing,
    isPdfLibLoading,
    isUploadModalOpen,
    input,
    files,
    setInput,
    handleSubmit,
    handleFileUpload,
    handleRemoveFile,
    clearHistory,
    setIsUploadModalOpen,
  } = useFileBot(serverId);

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
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9FjyaXXzava7DyGX2cWojowsjmxiD_tOxqg&s"
            className="h-8 w- md:h-8 md:w-8 mr-2"
          />
          <p className="font-semibold text-md text-black dark:text-white">
            File Assistant
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
          {messages.length === 0 && (
            <div className="text-center text-gray-500">
              {isPdfLibLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span>Loading PDF support...</span>
                </div>
              ) : (
                'Click the plus icon to upload a document and ask questions about its content.'
              )}
            </div>
          )}

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
        isProcessing={isProcessing}
        isPdfLibLoading={isPdfLibLoading}
        onSubmit={handleSubmit}
        input={input}
        setInput={setInput}
        onUploadClick={() => setIsUploadModalOpen(true)}
      />

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        files={files}
        onFileUpload={handleFileUpload}
        onFileRemove={handleRemoveFile}
        isPdfLibLoading={isPdfLibLoading}
      />
    </div>
  );
}; 