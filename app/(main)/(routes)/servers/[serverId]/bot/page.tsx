"use client"
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";

import {
	Form,
	FormControl,
	FormField,
	FormItem
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { BotMessageSquare, Loader2, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

// Add custom message type with function call
interface CustomMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	createdAt?: Date;
	functionCall?: {
		name: string;
		arguments: {
			theme: 'light' | 'dark' | 'system';
		};
	};
}

const formSchema = z.object({
	content: z.string().min(1)
});

const BotPage = () => {
	const { setTheme, theme } = useTheme();
	const [themeChanging, setThemeChanging] = useState(false);

	// Regular chat implementation
	const { messages, input, handleInputChange, handleSubmit, status, reload, error } = useChat({ 
		api: "/api/openAI",
	});

	const scrollRef = useRef<HTMLDivElement>(null);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			content: "",
		}
	});

	const isLoading = form.formState.isSubmitting;

	// Function to handle theme changes
	const handleThemeChange = (newTheme: string) => {
		setThemeChanging(true);
		// Add slight delay to make theme change visible
		setTimeout(() => {
			setTheme(newTheme);
			setThemeChanging(false);
			toast.success(`Theme changed to ${newTheme} mode`);
		}, 500);
	};

	// Check for theme-related messages
	useEffect(() => {
		if (messages.length > 0) {
			const lastMessage = messages[messages.length - 1];
			
			// Only process bot responses (not user messages)
			if (lastMessage.role === 'assistant') {
				const content = lastMessage.content;
				
				// Match exact phrases for theme changes
				if (content.includes("I'll switch to dark mode for you now.")) {
					handleThemeChange('dark');
				} else if (content.includes("I'll switch to light mode for you now.")) {
					handleThemeChange('light');
				} else if (content.includes("I'll switch to system theme for you now.")) {
					handleThemeChange('system');
				}
			}
		}
	}, [messages]);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

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

			{/* Message Area */}
			<div className="flex-1 flex flex-col py-4 overflow-y-auto p-8">
				<ScrollArea className="flex flex-col-reverse mt-auto">
					{messages.map((message) => (
						<div
							key={message.id}
							className="p-4 pl-0"
						>
							<div>
								<span className="text-xs opacity-70 mt-1 block">
									{message.role === 'user' ? 'YOU' : 'BOT'}
								</span>
								<p className="whitespace-pre-wrap">{message.content}</p>
								<span className="text-xs opacity-70 mt-1 block">
									{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>
						</div>
					))}
				</ScrollArea>
				<div ref={scrollRef} />
			</div>

			{/* Input Form */}
			<Form {...form}>
				<form onSubmit={handleSubmit}>
					<FormField
						control={form.control}
						name="content"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<div className="relative p-4 pb-6">
										<Input
											disabled={isLoading || themeChanging}
											className="px-4 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
											value={input}
											onChange={handleInputChange}
											placeholder={themeChanging ? "Changing theme..." : "Type your message..."}
										/>
										<div className="absolute top-3 right-8">
											{
												(status === "streaming" || themeChanging) && (
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

export default BotPage;