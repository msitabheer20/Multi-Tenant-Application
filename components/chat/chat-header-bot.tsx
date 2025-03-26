{/* <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
				<ClientMobileToggle serverId={params.serverId} />
				<UserAvatar
					src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9FjyaXXzava7DyGX2cWojowsjmxiD_tOxqg&s"
					className="h-8 w- md:h-8 md:w-8 mr-2"
				/>
				<p className="font-semibold text-md text-black dark:text-white">
					File Assistant
				</p>
			</div> */}



import { Hash } from "lucide-react";
import { MobileToggle } from "@/components/mobile-toggle";
import { UserAvatar } from "@/components/user-avatar"; 
import { SocketIndicator } from "@/components/socket-indicator";

interface ChatBotHeaderProps {
    serverId: string;
    name: string;
    type: "channel" | "conversation" | "bot";
    imageUrl?: string;
}

export const ChatBotHeader = ({
    serverId,
    name,
    type,
    imageUrl
}: ChatBotHeaderProps) => {
    return (
        <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
            <MobileToggle serverId={serverId} />
            {type === "channel" && (
                <Hash className="w-5 h-5 text-zinc-500 dark:text-zinc-400 mr-2" />
            )}
            {type === "conversation" && (
                <UserAvatar
                    src={imageUrl}
                    className="h-8 w- md:h-8 md:w-8 mr-2"
                />
            )}
            {type === "bot" && (
                <UserAvatar
                    src={imageUrl}
                    className="h-8 w- md:h-8 md:w-8 mr-2"
                />
            )}
            <p className="font-semibold text-md text-black dark:text-white">
                {name}
            </p>
            <div className="ml-auto flex items-center">
                <SocketIndicator />
            </div>
        </div>
    )
}