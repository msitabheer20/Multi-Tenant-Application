"use client"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { useModal } from '@/hooks/use-modal-store';
import qs from "query-string";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";



export const DeleteChannelModal = () => {
	const { isOpen, onClose, type, data } = useModal();
	const router = useRouter();

	const isModalOpen = isOpen && type === "deleteChannel"
	const { server, channel } = data;

	const [isLoading, setIsLoading] = useState(false);

	const onClick = async () => {
		try {
			setIsLoading(true);
			const url = qs.stringifyUrl({
				url: `/api/channels/${channel?.id}`,
				query: {
					serverId: server?.id
				}
			})

			await axios.delete(url);

			router.refresh();
			onClose();
			router.push(`/servers/${server?.id}`);

		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Dialog open={isModalOpen} onOpenChange={onClose}>
			<DialogContent className="bg-white dark:bg-black dark:text-zinc-300 text-black/80 p-0 overflow-hidden">
				<DialogHeader className="pt-8 px-6">
					<DialogTitle className="text-2xl text-center font-bold">
						Delete Channel
					</DialogTitle>
					<DialogDescription className="text-center text-zinc-500 dark:text-zinc-400">
						Are you sure you want to do this? <br />
						<span className="text-indigo-500 dark:text-indigo-400 font-semibold">#{channel?.name}</span> will be permanently deleted.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="bg-gray-100 dark:bg-black dark:text-zinc-300 px-6 py-4">
					<div className="flex items-center justify-between w-full">
						<Button
							disabled={isLoading}
							onClick={onClose}
							variant="ghost"
						>
							Cancel
						</Button>
						<Button
							disabled={isLoading}
							onClick={onClick}
							variant="primary"
						>
							Confirm
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}