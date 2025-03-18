"use client"
// import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { useChat } from "@ai-sdk/react";
import { Plus, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'
import {
	Form,
	FormControl,
	FormField,
	FormItem
} from "@/components/ui/form";
import { EmojiPicker } from "@/components/emoji-picker";
import { useEffect, useRef } from "react";

interface BotPageProps {
	params: {
		serverId: string;
		botId: string;
	}
}

const BotPage = ({
	params
}: BotPageProps) => {

	const { messages, input, handleInputChange, handleSubmit, reload, error } = useChat({ api: "/api/openAI" });
	const scrollRef = useRef<HTMLDivElement>(null);
	if (error) console.log(error);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollIntoView({ behavior: "smooth" })
		}
	}, [messages])

	return (
		<div className="bg-white dark:bg-[#313338] flex flex-col h-screen p-4">
			<div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
				<UserAvatar
					src="https://cdn-1.webcatalog.io/catalog/discord-bot-list/discord-bot-list-icon-filled-256.png?v=1714774149420"
					className="h-8 w- md:h-8 md:w-8 mr-2"
				/>
				<p className="font-semibold text-md text-black dark:text-white">
					AI Assistant
				</p>
			</div>

			<div className="flex-1 flex flex-col py-4 overflow-y-auto p-4">
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
							<div
								key={index}
								className={`mb-4`}
							>
								<div
									className={`inline-block p-4 rounded-lg ${message.role === "user"
										? "bg-primary text-primary-foreground"
										: "bg-muted"
										}`}
								>
									<ReactMarkdown
										children={message.content}
										remarkPlugins={remarkGfm}
										components={{
											code({ node, inline, className, children, ...props }) {
												return inline ? (
													<code {...props} className="bg-gray-200 p-2 rounded">{children}</code>
												) : (
													<pre {...props} className="bg-gray-200 px-1 rounded">
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
					<div ref={scrollRef}></div>
				</ScrollArea>

				{/*  */}
				{/* <form
					onSubmit={handleSubmit}
					className="flex w-full items-center space-x-2"
				>
					<Input
						value={input}
						onChange={handleInputChange}
						className="flex-1"
						placeholder="Type your messages here..."
					/>
					<Button type="submit" className="size-9" size="icon">
						<Send className="size-4" />
					</Button>
				</form> */}
				<form onSubmit={handleSubmit} className="flex w-full items-center space-x-2 relative p-4">

					{/* Input Field */}
					<Input
						value={input}
						onChange={handleInputChange}
						className="w-full px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200 rounded-md"
						placeholder="Type your messages here..."
					/>

					{/* Emoji Picker on the Right */}
					{/* <div className="absolute top-7 right-12">
						<EmojiPicker onChange={(emoji: string) => handleInputChange({ target: { value: `${input} ${emoji}` } })} />
					</div> */}

					{/* Send Button */}
					{/* <Button type="submit" className="size-9" size="icon">
						<Send className="size-4" />
					</Button> */}
				</form>


				{/*  */}
			</div>
		</div>
	)
}

export default BotPage;