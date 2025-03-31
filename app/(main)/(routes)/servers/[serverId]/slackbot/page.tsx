"use client"
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { useEffect, useRef, useState, use } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ReactNode } from 'react';

import {
	Form,
	FormControl,
	FormField,
	FormItem
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface SlackBotPageProps {
	params: Promise<{
		serverId: string;
	}>
}

const formSchema = z.object({
	content: z.string().min(1)
});

export interface Message {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: number;
	isCustomContent?: boolean;
	customContentType?: 'lunchStatus';
	customData?: any;
}

interface SlackUser {
	name: string;
	id: string;
	status: string;
	lunchStartTime?: string;
	lunchEndTime?: string;
}

interface SlackLunchReport {
	channel: string;
	timeframe: string;
	users: SlackUser[];
	total: number;
	timestamp: string;
}


const SlackBotPage = ({ params }: SlackBotPageProps) => {
	const resolvedParams = use(params);
	const [messages, setMessages] = useState<Message[]>(() => {
		// Load messages from localStorage on initial render
		if (typeof window !== 'undefined') {
			const savedMessages = localStorage.getItem(`bot-chat-messages-${resolvedParams.serverId}`);
			return savedMessages ? JSON.parse(savedMessages) : [];
		}
		return [];
	});
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(`bot-chat-messages-${resolvedParams.serverId}`, JSON.stringify(messages));
		}
	}, [messages, resolvedParams.serverId]);

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

			const response = await fetch('/api/slackbot', {
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

			if (data.functionCall && data.functionCall.name === 'getSlackLunchStatus') {
				const { channelName, timeframe } = data.functionCall.arguments;
				const result = data.functionCall.result as SlackLunchReport;
				console.log("result users are here: ", result.users);
				// Add assistant message with the lunch status table
				setMessages(prev => [
					...prev,
					{
						id: Date.now().toString(),
						role: 'assistant',
						content: '',
						timestamp: Date.now(),
						isCustomContent: true,
						customContentType: 'lunchStatus',
						customData: result
					}
				]);
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
			<div className="text-md font-semibold px-3 flex items-center justify-between h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
				<div className="flex items-center">
					<UserAvatar
						src="https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/306_Slack_logo-512.png"
						className="h-8 w- md:h-8 md:w-8 mr-2"
					/>
					<p className="font-semibold text-md text-black dark:text-white">
						Slack Assistant
					</p>
				</div>
				<button
					onClick={() => {
						localStorage.removeItem(`bot-chat-messages-${resolvedParams.serverId}`);
						setMessages([]);
						toast.success('Chat history cleared');
					}}
					className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
				>
					Clear History
				</button>
			</div>


			<div className="flex-1 flex flex-col py-4 overflow-y-auto p-8">
				<ScrollArea className="flex flex-col-reverse mt-auto">

					{messages.map((message) => (
						<div
							key={message.id}
							className="p-4 pl-0"
						>
							<div>
								<span className="text-xs opacity-70 mb-1 block">
									{message.role === 'user' ? 'YOU' : message.role === 'assistant' ? 'BOT' : 'SYSTEM'}
								</span>
								
								{!message.isCustomContent && (
									<div dangerouslySetInnerHTML={{ __html: message.content }} />
								)}
								
								{message.isCustomContent && message.customContentType === 'lunchStatus' && message.customData && (
									<div className="w-full md:w-2/3 lg:w-4/5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
										{/* Header */}
										<div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
											<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
												Lunch Status for #{message.customData.channel} ({message.customData.timeframe})
											</h3>
											<div className="mt-2 flex flex-wrap gap-2">
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
													Total users: {message.customData.users.filter((user: any) => user.name !== "checkbot").length}
												</span>
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${message.customData.total > 0
													? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
													: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
												}`}>
													Missing tags: {message.customData.users.filter((user: any) => user.name !== "checkbot" && user.status !== "complete").length}
												</span>
											</div>
										</div>

										{/* Table data */}
										<div className="overflow-x-auto">
											<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
												<thead className="bg-gray-50 dark:bg-gray-900">
													<tr>
														<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
														<th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
														<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
														<th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lunch Start</th>
														<th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lunch End</th>
														<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
													</tr>
												</thead>
												<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
													{message.customData.users
														.filter((user: any) => user.name !== "checkbot")
														.sort((a: any, b: any) => {
															if (a.status !== "complete" && b.status === "complete") return -1;
															if (a.status === "complete" && b.status !== "complete") return 1;
															return a.name.localeCompare(b.name);
														})
														.map((user: any, index: number) => {
															// Calculate time gap if both timestamps exist
															let timeGap = null;
															let isLongBreak = false;

															if (user.lunchStartTime && user.lunchEndTime) {
																const startTime = new Date(user.lunchStartTime).getTime();
																const endTime = new Date(user.lunchEndTime).getTime();
																const diffInMinutes = Math.round((endTime - startTime) / (1000 * 60));
																timeGap = diffInMinutes;
																isLongBreak = diffInMinutes > 30;
															}

															// Set status style based on status
															let statusBgClass = '';
															let statusTextClass = '';

															if (user.status === "complete") {
																statusBgClass = 'bg-green-100 dark:bg-green-900';
																statusTextClass = 'text-green-800 dark:text-green-200';
															} else if (user.status === "missing both tags") {
																statusBgClass = 'bg-red-100 dark:bg-red-900';
																statusTextClass = 'text-red-800 dark:text-red-200';
															} else if (user.status === "missing #lunchstart") {
																statusBgClass = 'bg-yellow-100 dark:bg-yellow-900';
																statusTextClass = 'text-yellow-800 dark:text-yellow-200';
															} else {
																statusBgClass = 'bg-orange-100 dark:bg-orange-900';
																statusTextClass = 'text-orange-800 dark:text-orange-200';
															}

															const displayStatus = user.status === "missing #lunchend"
																? "missing #lunchend/lunchover"
																: user.status;

															// Format timestamps
															const startTime = user.lunchStartTime
																? new Date(user.lunchStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
																: '-';

															const endTime = user.lunchEndTime
																? new Date(user.lunchEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
																: '-';

															// Row background color for alternating rows
															const rowBgClass = index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-800';

															return (
																<tr key={user.id} className={rowBgClass}>
																	<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
																		{user.name}
																		{/* Show times on mobile */}
																		{(user.lunchStartTime || user.lunchEndTime) && (
																			<div className="sm:hidden mt-1 text-xs text-gray-500 dark:text-gray-400">
																				{user.lunchStartTime && <div>Start: {startTime}</div>}
																				{user.lunchEndTime && <div>End: {endTime}</div>}
																			</div>
																		)}
																	</td>
																	<td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
																		{user.id}
																	</td>
																	<td className="px-6 py-4 whitespace-nowrap text-sm">
																		<span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBgClass} ${statusTextClass}`}>
																			{displayStatus}
																		</span>
																	</td>
																	<td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
																		{startTime}
																	</td>
																	<td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
																		{endTime}
																	</td>
																	<td className="px-6 py-4 whitespace-nowrap text-sm">
																		{timeGap !== null ? (
																			<span className={isLongBreak
																				? 'text-red-600 dark:text-red-400 font-medium'
																				: 'text-green-600 dark:text-green-400'
																			}>
																				{timeGap} min {isLongBreak ? '⚠️' : '✅'}
																			</span>
																		) : (
																			'-'
																		)}
																	</td>
																</tr>
															);
														})}
												</tbody>
											</table>
										</div>
									</div>
								)}
								
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

export default SlackBotPage;
