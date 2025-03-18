"use client"
import { useChat } from "@ai-sdk/react";
import { UserAvatar } from "@/components/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      messages?.map((message, index) => (
       <div key={index} className={`mb-4`}
       >
        <div className="relative group flex items-center hover:bg-black/5 p-4 transition w-full">
         <div className="group flex gap-x-2 items-start w-full">
          <div className="cursor-pointer hover:drop-shadow-md transition">
           <UserAvatar src={member.profile.imageUrl} />
          </div>
          <div className="flex flex-col w-full">
           <div className="flex items-center gap-x-2">
            <div className="flex items-center">
             <p className="font-semibold text-sm hover:underline cursor-pointer">
              {member.profile.name}
             </p>
             <ActionTooltip label={member.role}>
              {roleIconMap[member.role]}
             </ActionTooltip>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
             {timestamp}
            </span>
           </div>
           {isImage && (
            <a
             href={fileUrl}
             target="_blank"
             rel="noopener noreferrer"
             className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48"
            >
             <Image
              src={fileUrl}
              alt={content}
              fill
              className="object-cover"
             />
            </a>
           )}
           {
            isPDF && (
             <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10" >
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
              <a
               href={fileUrl}
               target="_blank"
               rel="noopener noreferrer"
               className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
              >
               PDF File
              </a>
             </div >
            )
           }
           {!fileUrl && !isEditing && (
            <p className={cn(
             "text-sm text-zinc-600 dark:text-zinc-300",
             deleted && "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1"
            )}>
             {content}
             {isUpdated && !deleted && (
              <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
               (edited)
              </span>
             )}
            </p>
           )}
           {!fileUrl && isEditing && (
            <Form {...form}>
             <form
              className="flex items-center w-full gap-x-2 pt-2"
              onSubmit={form.handleSubmit(onSubmit)}
             >
              <FormField
               control={form.control}
               name="content"
               render={({ field }) => (
                <FormItem className="flex-1">
                 <FormControl>
                  <div className="relative w-full">
                   <Input
                    disabled={isLoading}
                    className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                    placeholder="Edited message"
                    {...field}
                   />
                  </div>
                 </FormControl>
                </FormItem>
               )}
              />
              <Button disabled={isLoading} size="sm" variant="primary">
               Save
              </Button>
             </form>
             <span className="text-[10px] mt-1 text-zinc-400">
              Press escape to cancel, enter to save
             </span>
            </Form>
           )}
          </div>
         </div>
         {canDeleteMessage && (
          <div className="hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm">
           {canEditMessage && (
            <ActionTooltip label="Edit">
             <Edit
              onClick={() => setIsEditing(true)}
              className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
             />
            </ActionTooltip>
           )}
           <ActionTooltip label="Delete">
            <Trash
             onClick={() => onOpen("deleteMessage", {
              apiUrl: `${socketUrl}/${id}`,
              query: socketQuery,
             })}
             className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            />
           </ActionTooltip>
          </div>
         )}
        </div>
       </div>
      ))
     }
    </ScrollArea>
   </div>
  </div>
 )
}