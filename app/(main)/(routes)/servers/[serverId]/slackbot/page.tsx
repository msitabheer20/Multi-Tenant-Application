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
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: number;
	customContent?: ReactNode;
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

interface ReportUser {
	id: string;
	name: string;
	hasPosted: boolean;
	timestamp?: string;
	content?: string;
	allReports?: Array<{ timestamp: string; content: string, date: string }>;
}

interface SlackReportStatusReport {
	channel: string;
	timeframe: string;
	users: ReportUser[];
	timestamp: string;
}

interface UpdateUser {
	id: string;
	name: string;
	hasPosted: boolean;
	timestamp?: string;
	content?: string;
	allUpdates?: Array<{ timestamp: string; content: string, date: string }>;
}

interface SlackUpdateReport {
	channel: string;
	timeframe: string;
	users: UpdateUser[];
	timestamp: string;
}


const SlackBotPage = ({ params }: SlackBotPageProps) => {
	const resolvedParams = use(params);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [selectedContent, setSelectedContent] = useState<{ content: string, name: string } | null>(null);

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

			// Check if the response contains an error message
			if (data.error || (data.content && data.content.includes('I encountered an error'))) {
				setMessages(prev => [
					...prev,
					{
						id: Date.now().toString(),
						role: 'assistant',
						content: data.content || data.error,
						timestamp: Date.now(),
					},
				]);
				return;
			}

			if (data.functionCall && data.functionCall.name === 'getSlackLunchStatus') {

				const result = data.functionCall.result as SlackLunchReport;
				
				// Check if we have a valid result with users before continuing
				if (!result || !result.users) {
					setMessages(prev => [
						...prev,
						{
							id: Date.now().toString(),
							role: 'assistant',
							content: "Error: Unable to retrieve channel data. The channel might not exist or the bot doesn't have access to it.",
							timestamp: Date.now(),
						},
					]);
					return;
				}
				
				console.log("result users are here: ", result.users);
				// Add assistant message with the lunch status table
				setMessages(prev => [
					...prev,
					{
						id: Date.now().toString(),
						role: 'assistant',
						content: '',
						timestamp: Date.now(),
						customContent: (
							<div className="w-full md:w-2/3 lg:w-4/5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
								{/* Header */}
								<div className="bg-zinc-50 dark:bg-zinc-800/90 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
										<i className="fas fa-utensils text-indigo-500"></i>
										Lunch Status for #{result.channel} ({result.timeframe})
									</h3>
									<div className="mt-2 flex flex-wrap gap-2">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300">
											Total users: {result.users.filter((user: any) => user.name !== "checkbot").length}
										</span>
										<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.total > 0
											? 'bg-red-200 dark:bg-red-800 dark:text-zinc-300 text-red-700 dark:text-red-400'
											: 'bg-emerald-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400'
											}`}>
											Missing tags: {result.users.filter((user: any) => user.name !== "checkbot" && user.status !== "complete").length}
										</span>
									</div>
								</div>

								{/* Table data */}
								<div className="overflow-x-auto dark:bg-zinc-800/90">
									<table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
										<thead className="bg-zinc-100 dark:bg-zinc-800">
											<tr>
												<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">User</th>
												<th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ID</th>
												<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
												<th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Lunch Start</th>
												<th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Lunch End</th>
												<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Duration</th>
											</tr>
										</thead>
										<tbody className="bg-white dark:bg-zinc-900/50 divide-y divide-gray-200 dark:divide-zinc-800">
											{result.users
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

													// Set status style based on status - use zinc colors for dark mode
													let statusBgClass = '';
													let statusTextClass = '';

													if (user.status === "complete") {
														statusBgClass = 'bg-emerald-100 dark:bg-zinc-700/90';
														statusTextClass = 'text-emerald-700 dark:text-emerald-400';
													} else if (user.status === "missing both tags") {
														statusBgClass = 'bg-red-100 dark:bg-zinc-700/90';
														statusTextClass = 'text-red-700 dark:text-red-400';
													} else if (user.status === "missing #lunchstart") {
														statusBgClass = 'bg-amber-100 dark:bg-zinc-700/90';
														statusTextClass = 'text-amber-700 dark:text-amber-400';
													} else {
														statusBgClass = 'bg-orange-100 dark:bg-zinc-700/90';
														statusTextClass = 'text-orange-700 dark:text-orange-400';
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
													const rowBgClass = index % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-800/70' : 'bg-white dark:bg-zinc-900/50';

													return (
														<tr key={user.id} className={rowBgClass}>
															<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-200">
																{user.name}
																{/* Show times on mobile */}
																{(user.lunchStartTime || user.lunchEndTime) && (
																	<div className="sm:hidden mt-1 text-xs text-zinc-500 dark:text-zinc-400">
																		{user.lunchStartTime && <div>Start: {startTime}</div>}
																		{user.lunchEndTime && <div>End: {endTime}</div>}
																	</div>
																)}
															</td>
															<td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400 font-mono text-xs">
																{user.id}
															</td>
															<td className="px-6 py-4 whitespace-nowrap text-sm">
																<span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBgClass} ${statusTextClass}`}>
																	{displayStatus}
																</span>
															</td>
															<td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
																{startTime}
															</td>
															<td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
																{endTime}
															</td>
															<td className="px-6 py-4 whitespace-nowrap text-sm">
																{timeGap !== null ? (
																	<span className={isLongBreak
																		? 'text-red-600 dark:text-red-400 font-medium'
																		: 'text-emerald-600 dark:text-emerald-400'
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
						)
					}
				]);
			}

			else if (data.functionCall && data.functionCall.name === 'getSlackUpdateStatus') {
				// Handle Slack update status function
				const result = data.functionCall.result as SlackUpdateReport;
				
				// Check if we have a valid result with users before continuing
				if (!result || !result.users) {
					setMessages(prev => [
						...prev,
						{
							id: Date.now().toString(),
							role: 'assistant',
							content: "Error: Unable to retrieve channel data. The channel might not exist or the bot doesn't have access to it.",
							timestamp: Date.now(),
						},
					]);
					return;
				}

				// Add assistant message with the update status table
				setMessages(prev => [
					...prev,
					{
						id: Date.now().toString(),
						role: 'assistant',
						content: '',
						timestamp: Date.now(),
						customContent: (
							<div className="w-full md:w-2/3 lg:w-4/5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
								{/* Header */}
								<div className="bg-zinc-50 dark:bg-zinc-800/90 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
										<i className="fas fa-clipboard-list text-indigo-500"></i>
										Update Status for #{result.channel} ({result.timeframe})
									</h3>
									<div className="mt-2 flex flex-wrap gap-2">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300">
											Users with updates: {result.users.filter(user => user.name !== "checkbot" && user.hasPosted).length}
										</span>
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400">
											Total updates: {result.users.reduce((count, user) =>
												user.name !== "checkbot" && user.allUpdates ? count + user.allUpdates.length : count, 0)}
										</span>
									</div>
								</div>

								{/* Table */}
								<div className="overflow-x-auto dark:bg-zinc-800/90">
									<table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
										<thead className="bg-zinc-100 dark:bg-zinc-800">
											<tr>
												<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">User</th>
												<th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ID</th>
												<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
												<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Date</th>
												<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Time</th>
											</tr>
										</thead>
										<tbody className="bg-white dark:bg-zinc-900/50 divide-y divide-gray-200 dark:divide-zinc-800">
											{/* Get all updates from all users */}
											{result.users
												// Filter out users with name "checkbot" and only show users with updates
												.filter(user => user.name !== "checkbot" && user.hasPosted && user.allUpdates)
												// Sort users by name
												.sort((a, b) => a.name.localeCompare(b.name))
												.flatMap((user) => {
													// For each user, create a row for each update
													return user.allUpdates!.map((update, updateIndex) => {
														// Format timestamp
														const postedTime = update.timestamp
															? new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
															: '-';

															const postedDate = update.date || '-';

														// Row background for alternating users
														const baseRowBgClass = updateIndex % 2 === 0
															? 'bg-zinc-50 dark:bg-zinc-800/70'
															: 'bg-white dark:bg-zinc-900/50';

														// Different shade for first row of each user to help visually group updates
														const rowBgClass = updateIndex === 0
															? `${baseRowBgClass} border-t-2 border-zinc-300 dark:border-zinc-700`
															: baseRowBgClass;

														return (
															<tr
																key={`${user.id}-${updateIndex}`}
																className={`${rowBgClass} cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700`}
																onClick={() => {
																	if (update.content) {
																		setSelectedContent({
																			name: `${user.name} (Update ${updateIndex + 1})`,
																			content: update.content
																		});
																	}
																}}
															>
																<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-200">
																	{user.name}
																	{updateIndex > 0 ? (
																		<span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
																			(Update {updateIndex + 1})
																		</span>
																	) : null}
																</td>
																<td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400 font-mono text-xs">
																	{user.id}
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-sm">
																	<span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-zinc-700/90 text-emerald-700 dark:text-emerald-400">
																		Posted Update
																	</span>
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
																	{postedDate}
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
																	{postedTime}
																</td>
															</tr>
														);
													});
												})}
										</tbody>
									</table>
								</div>
							</div>
						)
					}
				]);
			}

			else if (data.functionCall && data.functionCall.name === 'getSlackReportStatus') {
				// Handle Slack report status function
				const result = data.functionCall.result as SlackReportStatusReport;
				
				// Check if we have a valid result with users before continuing
				if (!result || !result.users) {
					setMessages(prev => [
						...prev,
						{
							id: Date.now().toString(),
							role: 'assistant',
							content: "Error: Unable to retrieve channel data. The channel might not exist or the bot doesn't have access to it.",
							timestamp: Date.now(),
						},
					]);
					return;
				}

				// Add assistant message with the report status table
				setMessages(prev => [
					...prev,
					{
						id: Date.now().toString(),
						role: 'assistant',
						content: '',
						timestamp: Date.now(),
						customContent: (
							<div className="w-full md:w-2/3 lg:w-4/5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
								{/* Header */}
								<div className="bg-zinc-50 dark:bg-zinc-800/90 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
										<i className="fas fa-file-alt text-indigo-500"></i>
										Report Status for #{result.channel} ({result.timeframe})
									</h3>
									<div className="mt-2 flex flex-wrap gap-2">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300">
											Users with reports: {result.users.filter(user => user.name !== "checkbot" && user.hasPosted).length}
										</span>
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400">
											Total reports: {result.users.reduce((count, user) =>
												user.name !== "checkbot" && user.allReports ? count + user.allReports.length : count, 0)}
										</span>
									</div>
								</div>

								{/* Table */}
								<div className="overflow-x-auto dark:bg-zinc-800/90">
									<table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
										<thead className="bg-zinc-100 dark:bg-zinc-800">
											<tr>
												<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">User</th>
												<th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ID</th>
												<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
												<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Date</th>
												<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Time</th>
											</tr>
										</thead>
										<tbody className="bg-white dark:bg-zinc-900/50 divide-y divide-gray-200 dark:divide-zinc-800">
											{/* Get all reports from all users */}
											{result.users
												// Filter out users with name "checkbot" and only show users with reports
												.filter(user => user.name !== "checkbot" && user.hasPosted && user.allReports)
												// Sort users by name
												.sort((a, b) => a.name.localeCompare(b.name))
												.flatMap((user) => {
													// For each user, create a row for each report
													return user.allReports!.map((report, reportIndex) => {
														// Format timestamp
														const postedTime = report.timestamp
															? new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
															: '-';

														const postedDate = report.date || '-';

														// Row background for alternating users
														const baseRowBgClass = reportIndex % 2 === 0
															? 'bg-zinc-50 dark:bg-zinc-800/70'
															: 'bg-white dark:bg-zinc-900/50';

														// Different shade for first row of each user to help visually group reports
														const rowBgClass = reportIndex === 0
															? `${baseRowBgClass} border-t-2 border-zinc-300 dark:border-zinc-700`
															: baseRowBgClass;

														return (
															<tr
																key={`${user.id}-${reportIndex}`}
																className={`${rowBgClass} cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700`}
																onClick={() => {
																	if (report.content) {
																		setSelectedContent({
																			name: `${user.name} (Report ${reportIndex + 1})`,
																			content: report.content
																		});
																	}
																}}
															>
																<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-200">
																	{user.name}
																	{reportIndex > 0 ? (
																		<span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
																			(Report {reportIndex + 1})
																		</span>
																	) : null}
																</td>
																<td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400 font-mono text-xs">
																	{user.id}
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-sm">
																	<span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-zinc-700/90 text-emerald-700 dark:text-emerald-400">
																		Posted Report
																	</span>
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
																	{postedDate}
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
																	{postedTime}
																</td>
															</tr>
														);
													});
												})}
										</tbody>
									</table>
								</div>
							</div>
						)
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
						className="h-8 md:h-8 md:w-8 mr-2"
					/>
					<p className="font-semibold text-md text-black dark:text-white">
						Slack Assistant
					</p>
				</div>
				<button
					onClick={() => {
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



								{message.customContent ? (
									<div className="custom-content">
										{message.customContent}
									</div>
								) : (
									<p dangerouslySetInnerHTML={{ __html: message.content }} />
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


			{selectedContent && (
				<div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-white dark:bg-zinc-800/90 rounded-lg shadow-lg max-w-lg w-full mx-4 p-3 border border-zinc-200 dark:border-zinc-700">
						<div className="flex justify-between items-center mb-3 px-1">
							<h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
								<i className="fas fa-comment text-indigo-500"></i>
								{selectedContent.name}
							</h3>
							<button
								onClick={() => setSelectedContent(null)}
								className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="bg-zinc-50 dark:bg-zinc-900/80 p-4 rounded-md max-h-96 overflow-y-auto border border-zinc-200 dark:border-zinc-700/80">
							<p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap text-sm">{selectedContent.content}</p>
						</div>
						<div className="mt-3 text-right">
							<button 
								onClick={() => setSelectedContent(null)} 
								className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-md transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default SlackBotPage;
