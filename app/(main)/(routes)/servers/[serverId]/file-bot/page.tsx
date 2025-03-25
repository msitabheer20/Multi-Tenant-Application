"use client"

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { useEffect, useRef, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import FileUploadModal from '@/components/chat/chat-file-upload';

import {
	Form,
	FormControl,
	FormField,
	FormItem
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { BotMessageSquare, Loader2, Plus } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
// import Script from "next/script";

export interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: number;
}

const formSchema = z.object({
	content: z.string().min(1)
});

declare global {
	interface Window {
		pdfjsLib: any;
	}
}

const FileBotPage = () => {

	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [files, setFiles] = useState<FileData[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processingStatus, setProcessingStatus] = useState<string>('');
	const chatContainerRef = useRef<HTMLDivElement>(null);
	const [isPdfLibLoading, setIsPdfLibLoading] = useState(true);
	const [isPdfLibLoaded, setIsPdfLibLoaded] = useState(false);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	const processPdfFile = async (file: File): Promise<string> => {
		if (!window.pdfjsLib) {
			throw new Error('PDF.js library not loaded');
		}

		try {
			// console.log('Starting PDF processing for:', file.name);
			const arrayBuffer = await file.arrayBuffer();
			// console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);

			const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
			// console.log('PDF loaded, pages:', pdf.numPages);

			let fullText = '';
			let hasText = false;

			for (let i = 1; i <= pdf.numPages; i++) {
				// console.log(`Processing page ${i}/${pdf.numPages}`);
				const page = await pdf.getPage(i);
				const textContent = await page.getTextContent();
				const pageText = textContent.items
					.map((item: any) => item.str)
					.join(' ');

				if (pageText.trim().length > 0) {
					hasText = true;
					fullText += pageText + '\n';
					// console.log(`Page ${i} text length:`, pageText.length);
				} else {
					// console.log(`Page ${i} contains no extractable text`);
				}
			}

			if (!hasText) {
				throw new Error('This PDF appears to be image-based or contains no extractable text. Please ensure the PDF contains actual text content.');
			}

			// console.log('Total extracted text length:', fullText.length);
			return fullText;
		} catch (error) {
			console.error('Error processing PDF:', error);
			throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	};

	const handleFileUpload = async (files: FileList | null) => {
		if (!files?.length) return;

		setIsProcessing(true);
		setProcessingStatus('Processing files...');

		// Add single upload message
		setMessages(prev => [
			...prev,
			{
				id: Date.now().toString(),
				role: 'system',
				content: 'Uploading file...',
				timestamp: Date.now(),
			},
		]);

		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				if (file.size > 5 * 1024 * 1024) {
					setMessages(prev => [
						...prev,
						{
							id: Date.now().toString(),
							role: 'system',
							content: `File ${file.name} is too large. Maximum size is 5MB.`,
							timestamp: Date.now(),
						},
					]);
					continue;
				}

				const fileData: FileData = {
					id: Math.random().toString(36).substring(7),
					name: file.name,
					type: file.type,
					size: file.size,
				};

				setFiles(prev => [...prev, fileData]);

				if (file.type === 'application/pdf') {

					let attempts = 0;
					const maxAttempts = 10;
					while (!isPdfLibLoaded && attempts < maxAttempts) {
						await new Promise(resolve => setTimeout(resolve, 500));
						attempts++;
						console.log(`Waiting for PDF.js to load... Attempt ${attempts}/${maxAttempts}`);
					}


					if (!isPdfLibLoaded) {
						throw new Error('Please refresh the page and try again.');
					}
					const content = await processPdfFile(file);
					if (!content.trim()) {
						throw new Error('No text content could be extracted from the PDF. The file might be image-based or have security restrictions.');
					}

					// Process document through Pinecone
					const response = await fetch('/api/process-document', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							fileId: fileData.id,
							content,
							metadata: {
								pages: (await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise).numPages,
							},
						}),
					});

					if (!response.ok) {
						throw new Error('Failed to process document in vector database');
					}

					const result = await response.json();
					// console.log('Document processing result:', result);
				} else {
					// Handle text files
					const text = await file.text();

					// Process document through Pinecone
					const response = await fetch('/api/process-document', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							fileId: fileData.id,
							content: text,
							metadata: {
								filename: file.name,
								type: file.type,
								size: file.size,
							},
						}),
					});

					if (!response.ok) {
						throw new Error('Failed to process document in vector database');
					}

					const result = await response.json();
					// console.log('Document processing result:', result);
				}
			}

			// Add completion message
			setMessages(prev => [
				...prev,
				{
					id: Date.now().toString(),
					role: 'system',
					content: 'File uploaded successfully. You can now ask questions about its content.',
					timestamp: Date.now(),
				},
			]);
		} catch (error) {
			console.error('Error processing files:', error);
			setMessages(prev => [
				...prev,
				{
					id: Date.now().toString(),
					role: 'system',
					content: `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
					timestamp: Date.now(),
				},
			]);
		} finally {
			setIsProcessing(false);
			setProcessingStatus('');
		}
	};

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
			// console.log('Starting chat request...');
			// console.log('Files state:', files);
			// console.log('User message:', userMessage);

			const response = await fetch('/api/filebot', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: userMessage,
					files: files.map(f => ({
						id: f.id,
						name: f.name,
					})),
				}),
			});

			// console.log('Response status:', response.status);
			// console.log('Response headers:', Object.fromEntries(response.headers.entries()));

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				console.error('Error response data:', errorData);
				throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			// console.log('Success response data:', data);
			setMessages(prev => [
				...prev,
				{
					id: Date.now().toString(),
					role: 'assistant',
					content: data.content,
					timestamp: Date.now(),
				},
			]);
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

	const handleRemoveFile = async (fileId: string) => {
		try {
			// Remove file from Pinecone
			const response = await fetch('/api/delete-file', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ fileId }),
			});

			if (!response.ok) {
				throw new Error('Failed to delete file');
			}

			// Remove file from local state
			setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));

			// Add system message about file removal
			setMessages(prev => [
				...prev,
				{
					id: Date.now().toString(),
					role: 'system',
					content: 'File removed successfully. You can continue chatting with the remaining files.',
					timestamp: Date.now(),
				},
			]);
		} catch (error) {
			console.error('Error removing file:', error);
			setMessages(prev => [
				...prev,
				{
					id: Date.now().toString(),
					role: 'system',
					content: 'Failed to remove file. Please try again.',
					timestamp: Date.now(),
				},
			]);
		}
	};

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			content: "",
		}
	})

	//  const isLoading = form.formState.isSubmitting;

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollIntoView({ behavior: "smooth" })
		}
	}, [messages])

	useEffect(() => {
		// Setup Pinecone index when component mounts
		const setupPinecone = async () => {
			try {
				const response = await fetch('/api/setup-pinecone', {
					method: 'POST',
				});
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.details || data.error || 'Failed to setup Pinecone index');
				}
				// console.log('Pinecone index setup completed');
			} catch (error) {
				console.error('Error setting up Pinecone:', error);
				setMessages(prev => [...prev, {
					id: Date.now().toString(),
					role: 'system',
					content: `Error setting up Pinecone: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your environment variables and try again.`,
					timestamp: Date.now(),
				}]);
			}
		};

		setupPinecone();
	}, []);

	useEffect(() => {
		const initPdfJs = async () => {
			try {
				setIsPdfLibLoading(true);
				// Load PDF.js script
				const script = document.createElement('script');
				script.src = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
				script.async = true;

				script.onload = () => {
					// Set up the worker
					window.pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
					setIsPdfLibLoaded(true);
					setIsPdfLibLoading(false);
					console.log('PDF.js library loaded successfully');
				};

				script.onerror = (error) => {
					console.error('Error loading PDF.js:', error);
					setIsPdfLibLoading(false);
					setMessages(prev => [...prev, {
						id: Date.now().toString(),
						role: 'system',
						content: 'Error loading PDF.js library. Please refresh the page.',
						timestamp: Date.now(),
					}]);
				};

				document.head.appendChild(script);
			} catch (error) {
				console.error('Error initializing PDF.js:', error);
				setIsPdfLibLoading(false);
				setMessages(prev => [...prev, {
					id: Date.now().toString(),
					role: 'system',
					content: 'Error initializing PDF.js library. Please refresh the page.',
					timestamp: Date.now(),
				}]);
			}
		};

		initPdfJs();
	}, []);

	return (
		<div className="bg-white dark:bg-[#313338] flex flex-col h-screen">
			{/* <Script
				src="//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
				onLoad={() => {
					window.pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
					setIsPdfLibLoaded(true);
				}}
			/> */}
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


			<div className="flex-1 flex flex-col py-4 overflow-y-auto p-8">
				<ScrollArea className="flex flex-col-reverse mt-auto">

					{messages.length === 0 && (
						<div className="text-center text-gray-500">
							{isPdfLibLoading ? (
								<div className="flex items-center justify-center space-x-2">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
									<span>Loading PDF support...</span>
								</div>
							) : (
								'Click the plus icon to upload a document and ask questions about its content.'
							)}
						</div>
					)}

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
										<button
											type="button"
											onClick={() => setIsUploadModalOpen(true)}
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
											{
												isProcessing && (
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
			<FileUploadModal
				isOpen={isUploadModalOpen}
				onClose={() => setIsUploadModalOpen(false)}
				files={files}
				onFileUpload={handleFileUpload}
				onFileRemove={handleRemoveFile}
			/>
		</div>
	)
}

export default FileBotPage;