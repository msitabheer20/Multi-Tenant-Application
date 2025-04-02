import React from 'react';
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  content: z.string().min(1)
});

interface ChatInputProps {
  isProcessing: boolean;
  isPdfLibLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  input: string;
  setInput: (value: string) => void;
  onUploadClick: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  isProcessing, 
  isPdfLibLoading, 
  onSubmit, 
  input, 
  setInput, 
  onUploadClick 
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative p-4 pb-6">
                  <button
                    type="button"
                    onClick={onUploadClick}
                    className="absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center"
                    title="Upload files"
                    disabled={isPdfLibLoading}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <Input
                    disabled={isProcessing}
                    className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="type your message..."
                  />
                  <div className="absolute top-3 right-8">
                    {isProcessing && <Loader2 className="h-5 w-5 text-zinc-500 animate-spin my-4" />}
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        >
        </FormField>
      </form>
    </Form>
  );
}; 