"use client"

import { cn } from "@/lib/utils";
import { Member, MemberRole, Profile, Server } from "@prisma/client"
import { ShieldCheck } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import { useNavigationProgress } from "@/components/providers/navigation-progress-provider";

interface ServerMemberProps {
    member: Member & { profile: Profile };
    server: Server
    isBot?: boolean;
    isSlackBot?: boolean;
    isFileBot?: boolean;
}

const roleIconMap = {
    [MemberRole.GUEST]: null,
    [MemberRole.MODERATOR]: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
    [MemberRole.ADMIN]: <ShieldCheck className="h-4 w-4 ml-2 text-rose-500" />
}

export const ServerMember = ({
    member,
    server,
    isBot = false,
    isSlackBot = false,
    isFileBot = false
}: ServerMemberProps) => {

    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const { startNavigation } = useNavigationProgress();

    const onlyServerId = !params?.memberId;
    
    const isOnBotPage = pathname?.includes('/bot') && isBot;
    const isOnFileBot = pathname?.includes('/file-bot') && isFileBot;
    const isOnSlackBot = pathname?.includes('/slackbot') && isSlackBot;
    const isActive = isOnBotPage || isOnFileBot || isOnSlackBot || params?.memberId === member.id;

    const icon = roleIconMap[member.role];

    const onClick = () => {
        startNavigation();
        if (isBot) {
            router.push(`/servers/${params?.serverId}/bot`);
        }
        else if (isFileBot) {
            router.push(`/servers/${params?.serverId}/file-bot`);
        }
        else if (isSlackBot) {
            router.push(`/servers/${params?.serverId}/slackbot`);
        }
        else {
            router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
        }
    }

    console.log(member.profile.imageUrl);

    return (
        <button
            onClick={onClick}
            className={cn(
                "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1",
                isActive && "bg-zinc-700/20 dark:bg-zinc-700"
            )}
        >
            <UserAvatar
                src={member.profile.imageUrl}
                className="h-8 w-8 md:h-8 md:w-8"
            />
            <p
                className={cn(
                    "font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
                    (isActive || onlyServerId) && "text-primary dark:text-zinc-200 dark:group-hover:text-white",
                )}
            >
                {isBot ? "AI Assistant" : isFileBot ? "File Assistant" : isSlackBot ? "Slack Bot" : member.profile?.name}
            </p>
            {icon}
        </button>
    )
}