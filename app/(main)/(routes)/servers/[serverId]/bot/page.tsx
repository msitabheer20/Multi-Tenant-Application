"use client"

import { use } from "react";
import { BotUI } from "@/components/bot/BotUI";

interface BotPageProps {
	params: Promise<{
		serverId: string;
	}>
}

const BotPage = ({ params }: BotPageProps) => {
	const resolvedParams = use(params);
	
	return <BotUI serverId={resolvedParams.serverId} />;
}

export default BotPage;
