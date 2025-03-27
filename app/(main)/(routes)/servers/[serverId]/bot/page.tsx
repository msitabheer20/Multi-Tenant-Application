"use client"
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
// import { useChat } from "@vercel/ai/react";
import { useChat } from '@ai-sdk/react'
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, use } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BotMessageSquare, Loader2, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from 'next/navigation'

import {
	Form,
	FormControl,
	FormField,
	FormItem
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface BotPageProps {
	params: Promise<{
		serverId: string;
	}>
}

const formSchema = z.object({
	content: z.string().min(1)
});

export interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: number;
}


const BotPage = ({ params }: BotPageProps) => {
	const resolvedParams = use(params);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const { setTheme } = useTheme();
	const [themeChanging, setThemeChanging] = useState(false);
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			content: "",
		}
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;
	
		const userMessage = input.trim();
		setInput('');
		setMessages(prev => [
		  ...prev,
		  {
			id: Date.now().toString(),
			role: 'user',
			content: userMessage,
			timestamp: Date.now(),
		  },
		]);
		setIsLoading(true);
	
		try {
		  console.log('Starting chat request...');
		  console.log('User message:', userMessage);
	
		  const response = await fetch('/api/chatbot', {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify({
			  message: userMessage,
			}),
		  });
	
		  console.log('Response status:', response.status);
		  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
	
		  if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			console.error('Error response data:', errorData);
			throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
		  }
	
		  const data = await response.json();
		  console.log('Success response data:', data);
		  
		  // Check if the response includes a function call
		  if (data.functionCall && data.functionCall.name === 'setTheme') {
			// Handle theme change function
			const { theme: newTheme } = data.functionCall.arguments;
			setTheme(newTheme);
			toast.success(`Theme changed to ${newTheme} mode`);
			
			// Add message about the theme change
			setMessages(prev => [
			  ...prev,
			  {
				id: Date.now().toString(),
				role: 'assistant',
				content: data.content,
				timestamp: Date.now(),
			  },
			  {
				id: (Date.now() + 1).toString(),
				role: 'system',
				content: `Theme changed to ${newTheme} mode.`,
				timestamp: Date.now() + 1,
			  },
			]);
		  } 
		  else if (data.functionCall && data.functionCall.name === 'createServer') {
			// Handle server creation function
			const { name, imageUrl } = data.functionCall.arguments;
			
			try {
				const response = await fetch('/api/servers/create', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ name, imageUrl }),
				});

				if (!response.ok) {
					throw new Error('Failed to create server');
				}

				const result = await response.json();
				
				if (result.success) {
					toast.success(`Server created successfully: ${name}`);
					setMessages(prev => [
						...prev,
						{
							id: Date.now().toString(),
							role: 'assistant',
							content: data.content,
							timestamp: Date.now(),
						},
						{
							id: (Date.now() + 1).toString(),
							role: 'system',
							content: `Server created with name: ${name} and invite code: ${result.server?.inviteCode}`,
							timestamp: Date.now() + 1,
						},
					]);
					router.refresh();
				} else {
					throw new Error(result.error || 'Failed to create server');
				}
			} catch (error) {
				console.error('Server creation error:', error);
				toast.error('Failed to create server');
				throw error;
			}
		  }

		  else if(data.functionCall && data.functionCall.name === 'deleteServer') {
			try {
				const response = await fetch(`/api/servers/${resolvedParams.serverId}`, {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || 'Failed to delete server');
				}

				if (result.success) {
					toast.success(`Server deleted successfully`);
					setMessages(prev => [
						...prev,
						{
							id: Date.now().toString(),
							role: 'assistant',
							content: data.content,
							timestamp: Date.now(),
						},
						{
							id: (Date.now() + 1).toString(),
							role: 'system',
							content: `Server deleted successfully`,
							timestamp: Date.now() + 1,
						},
					]);
					router.refresh();
				} else {
					throw new Error(result.error || 'Failed to delete server');
				}
			} catch (error) {
				console.error('Server deletion error:', error);
				toast.error(error instanceof Error ? error.message : 'Failed to delete server');
				throw error;
			}
		  }

		  else if(data.functionCall && data.functionCall.name === 'updateServer') {

			try {
				const response = await fetch(`/api/servers/${resolvedParams.serverId}`, {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ 
						name: data.functionCall.arguments.name, 
						imageUrl: data.functionCall.arguments.imageUrl 
					}),
				});

				if (!response.ok) {
					throw new Error('Failed to update server');
				}

				const result = await response.json();

				if (result.success) {
					toast.success(`Server updated successfully`);
					setMessages(prev => [
						...prev,
						{
							id: Date.now().toString(),
							role: 'assistant',
							content: data.content,
							timestamp: Date.now(),
						},
						{
							id: (Date.now() + 1).toString(),
							role: 'system',
							content: `Server updated successfully`,
							timestamp: Date.now() + 1,
						},
					]);
					router.refresh();
				} else {
					throw new Error(result.error || 'Failed to update server');
				}
			} catch (error) {
				console.error('Server update error:', error);
				toast.error('Failed to update server');
				throw error;
			}
		  }

		  else if(data.functionCall && data.functionCall.name === 'getMembers') {
			try {
				const response = await fetch(`/api/servers/${resolvedParams.serverId}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (!response.ok) {
					throw new Error('Failed to get members');
				}

				const result = await response.json();

				if (result.success) {
					const membersList = result.server.members.map((member: any) => 
						`- ${member.profile.name} (${member.role})`
					).join('\n');

					setMessages(prev => [
						...prev,
						{
							id: Date.now().toString(),
							role: 'assistant',
							content: data.content,
							timestamp: Date.now(),
						},
						{
							id: (Date.now() + 1).toString(),
							role: 'system',
							content: `Server Members:\n${membersList}`,
							timestamp: Date.now() + 1,
						},
					]);
				} else {
					throw new Error(result.error || 'Failed to get members');
				}
			} catch (error) {
				console.error('Get members error:', error);
				toast.error('Failed to get members');
				throw error;
			}
		  }

		  else {
			// Normal message
			setMessages(prev => [
			  ...prev,
			  {
				id: Date.now().toString(),
				role: 'assistant',
				content: data.content,
				timestamp: Date.now(),
			  },
			]);
		  }
		} catch (error) {
		  console.error('Full error details:', error);
		  setMessages(prev => [
			...prev,
			{
			  id: Date.now().toString(),
			  role: 'assistant',
			  content: `Error: ${error instanceof Error ? error.message : 'An error occurred while processing your request.'}`,
			  timestamp: Date.now(),
			},
		  ]);
		} finally {
		  setIsLoading(false);
		}
	  };

	// Add effect to log messages when they change
	useEffect(() => {
		console.log("Messages updated:", messages);
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
									{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>
						</div>
					))}

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
										<Input
											disabled={isLoading}
											className="px-8 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
											value={input}
											onChange={(e) => setInput(e.target.value)}
											placeholder="type your message..."
										/>
										<div className="absolute top-3 right-8">
											{
												isLoading && (
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
	);
}
export default BotPage;
