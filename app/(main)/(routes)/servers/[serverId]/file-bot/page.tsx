"use client"
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'
import { useEffect, useRef } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
 Form,
 FormControl,
 FormField,
 FormItem
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { BotMessageSquare, Loader2, Plus } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";

const formSchema = z.object({
 content: z.string().min(1)
});

const FileBotPage = () => {
 const { onOpen } = useModal();
 const { messages, input, handleInputChange, handleSubmit, status, reload, error } = useChat({ api: "/api/openAI" });
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const apiUrl = "api/socket/messages"
  const query = {
    id: "1234"
  }
 const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
   content: "",
  }
 })

 const isLoading = form.formState.isSubmitting;

 useEffect(() => {
  if (scrollRef.current) {
   scrollRef.current.scrollIntoView({ behavior: "smooth" })
  }
 }, [messages])

 return (
  <div className="bg-white dark:bg-[#313338] flex flex-col h-screen">

   {/* Chat Header */}
   <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
    <UserAvatar
     src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9FjyaXXzava7DyGX2cWojowsjmxiD_tOxqg&s"
     className="h-8 w- md:h-8 md:w-8 mr-2"
    />
    <p className="font-semibold text-md text-black dark:text-white">
     File Assistant
    </p>
   </div>


   {/* flex flex-col-reverse mt-auto */}
   <div className="flex-1 flex flex-col py-4 overflow-y-auto p-8">
    <ScrollArea className="flex flex-col-reverse mt-auto">
     {
      messages?.map((message, index) => (
       <div
        key={index}
        className={`mb-4`}
       >
        <div
         className={`inline-block p-2 rounded-sm ${message.role === "user"
          ? "dark:bg-zinc-300 bg-zinc-600 text-primary-foreground"
          : ""
          }`}
        >
         {
          message.role === "user" ?
           <p className="font-semibold text-sm hover:underline cursor-pointer mb-2">YOU</p> :
           <p
            className="font-semibold text-sm hover:underline cursor-pointer flex items-center mb-2">
            BOT
            <BotMessageSquare className="h-4 w-4 ml-2 text-blue-500" />
           </p>
         }
         <ReactMarkdown
          children={message.content}
          remarkPlugins={remarkGfm}
          components={{
           code({ node, inline, className, children, ...props }) {
            return inline ? (
             <code {...props} className="bg-gray-200 p-2 rounded">{children}</code>
            ) : (
             <pre {...props} className="bg-zinc-500 px-1 rounded">
              <code>{children}</code>
             </pre>
            )
           },
           ul: ({ children }) => (
            <ul className="list-disc ml-4 space-y-1">
             {children}
            </ul>
           ),
           ol: ({ children }) => (
            <li className="list-decimal ml-4">{children}</li>
           )
          }}
         />
        </div>
       </div>
      ))
     }

     {
      error && (
       <div className="w-full items-center flex justify-center gap-3">
        <div>An error occured</div>
        <button className="underline" type="button" onClick={() => reload()}>
         Retry
        </button>
       </div>
      )
     }
     {/* <div ref={scrollRef}></div> */}
    </ScrollArea>
    <div ref={scrollRef} />
   </div>


   <Form {...form}>
    <form onSubmit={handleSubmit}>
     <FormField
      control={form.control}
      name="content"
      render={({ field }) => (
       <FormItem>
        <FormControl>
         <div className="relative p-4 pb-6">
          <button
           type="button"
           onClick={() => onOpen("messageFile", { apiUrl, query })}
           className="absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center"
          >
           <Plus className="text-white dark:text-[#313338]" />
          </button>
          <Input
           disabled={isLoading}
           className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
           value={input}
           onChange={handleInputChange}
           placeholder="type your message..."
          />
          <div className="absolute top-3 right-8">
           {
            status === "streaming" && (
             <Loader2 className="h-5 w-5 text-zinc-500 animate-spin my-4" />
            )
           }
          </div>
         </div>
        </FormControl>
       </FormItem>
      )}
     >

     </FormField>
    </form>
   </Form>
  </div>
 )
}

export default FileBotPage;