"use client"

import { use } from "react";
import { FileBotUI } from "@/components/file-bot/FileBotUI";

interface FileBotPageProps {
	params: Promise<{
		serverId: string;
	}>
}

const FileBotPage = ({ params }: FileBotPageProps) => {
	const resolvedParams = use(params);
	
	return <FileBotUI serverId={resolvedParams.serverId} />;
}

export default FileBotPage;