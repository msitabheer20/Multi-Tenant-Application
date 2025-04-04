"use client"
import { useChat } from "@ai-sdk/react";
import { UserAvatar } from "@/components/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { FileIcon } from "lucide-react";
import { Edit, Trash } from "lucide-react";
import { cn } from "@/lib/utils";

export const ChatBotMessage = () => {
 const { messages, input, handleInputChange, handleSubmit, reload, error } = useChat({ api: "/api/chatbot" });

 return (
  <div className="bg-white dark:bg-[#313338] flex flex-col h-screen">

   {/* Chat Header */}
   <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
    <UserAvatar
     src="https://cdn-1.webcatalog.io/catalog/discord-bot-list/discord-bot-list-icon-filled-256.png?v=1714774149420"
     className="h-8 w- md:h-8 md:w-8 mr-2"
    />
    <p className="font-semibold text-md text-black dark:text-white">
     AI Assistant
    </p>
   </div>

   {/* Chat Item */}
   <div className="flex-1 flex flex-col py-4 overflow-y-auto">
    <ScrollArea className="flex flex-col-reverse mt-auto">
     {
      messages?.length === 0 && (
       <div className="w-full mt-32 text-gray-500 items-center justify-center flex gap-3">
        no messages yet
       </div>
      )
     }

     {
      messages?.map((message, index) => {
        const isUserMessage = message.role === 'user';
        return (
          <div key={index} className="mb-4">
            <div className="relative group flex items-center hover:bg-black/5 p-4 transition w-full">
              <div className="group flex gap-x-2 items-start w-full">
                <div className="cursor-pointer hover:drop-shadow-md transition">
                  <UserAvatar 
                    src={isUserMessage ? "/placeholder-user.jpg" : "https://cdn-1.webcatalog.io/catalog/discord-bot-list/discord-bot-list-icon-filled-256.png?v=1714774149420"} 
                  />
                </div>
                <div className="flex flex-col w-full">
                  <div className="flex items-center gap-x-2">
                    <div className="flex items-center">
                      <p className="font-semibold text-sm hover:underline cursor-pointer">
                        {isUserMessage ? "You" : "AI Assistant"}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })
     }
    </ScrollArea>
   </div>

   {/* Chat Input */}
   <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-2">
     <input
      type="text"
      value={input}
      onChange={handleInputChange}
      placeholder="Type a message..."
      className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm text-gray-900 dark:text-gray-100"
     />
     <button
      type="submit"
      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
     >
      Send
     </button>
    </div>
   </form>
  </div>
 )
}