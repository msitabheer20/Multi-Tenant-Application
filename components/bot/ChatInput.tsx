import React from 'react';
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  content: z.string().min(1)
});

interface ChatInputProps {
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  input: string;
  setInput: (value: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  isLoading, 
  onSubmit, 
  input, 
  setInput 
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
                  <Input
                    disabled={isLoading}
                    className="px-8 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="type your message..."
                  />
                  <div className="absolute top-3 right-8">
                    {isLoading && <Loader2 className="h-5 w-5 text-zinc-500 animate-spin my-4" />}
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