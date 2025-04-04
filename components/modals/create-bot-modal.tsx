"use client"

import * as z from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import qs from "query-string"
import axios from 'axios'

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { useModal } from '@/hooks/use-modal-store'
import { useEffect } from 'react'

const formSchema = z.object({
	name: z.string().min(1, {
		message: "Bot name is required."
	}),
	avatarUrl: z.string().optional(),
});

export const CreateBotModal = () => {
	const { isOpen, onClose, type } = useModal();
	const router = useRouter();
	const params = useParams();

	const isModalOpen = isOpen && type === "createChatBot"; // Change modal type to "createBot"

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			avatarUrl: "",
		}
	});

	const isLoading = form.formState.isSubmitting;

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			const url = qs.stringifyUrl({
				url: "/api/bots",
				query: {
					serverId: params?.serverId
				}
			});
			await axios.post(url, values);

			form.reset();
			router.refresh();
			onClose();
		} catch (error) {
			console.log(error);
		}
	}

	const handleClose = () => {
		form.reset();
		onClose();
	}

	return (
		<Dialog open={isModalOpen} onOpenChange={handleClose}>
			<DialogContent className="bg-white text-black p-0 overflow-hidden">
				<DialogHeader className="pt-8 px-6">
					<DialogTitle className="text-2xl text-center font-bold">
						Create Bot
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						<div className="space-y-8 px-6">
							{/* Bot Name Field */}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
											Bot Name
										</FormLabel>
										<FormControl>
											<Input
												disabled={isLoading}
												className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
												placeholder="Enter Bot Name"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Bot Avatar URL Field */}
							<FormField
								control={form.control}
								name="avatarUrl"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
											Avatar URL (Optional)
										</FormLabel>
										<FormControl>
											<Input
												disabled={isLoading}
												className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
												placeholder="Enter Avatar URL"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter className="bg-gray-100 px-6 py-4">
							<Button type="submit" variant="primary" disabled={isLoading}>
								Create
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
