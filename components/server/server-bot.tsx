"use client"

import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";


export const ServerBot = () => {

    const params = useParams();
    const router = useRouter();

    const onClick = () => {
        // router.push(`/servers/${params?.serverId}/conversations/${member.id}`)
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1",
            )}
        >
            <UserAvatar
                src="https://cdn-1.webcatalog.io/catalog/discord-bot-list/discord-bot-list-icon-filled-256.png?v=1714774149420"
                className="h-8 w-8 md:h-8 md:w-8"
            />
            <p
                className={cn(
                    "font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
                )}
            >
                AI BOT
            </p>
        </button>
    )
}