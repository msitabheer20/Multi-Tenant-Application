"use client"
import { use } from "react";
import { SlackBotUI } from "@/components/slack/SlackBotUI";

interface SlackBotPageProps {
  params: Promise<{
    serverId: string;
  }>
}

const SlackBotPage = ({ params }: SlackBotPageProps) => {

  const resolvedParams = use(params);
  
  return <SlackBotUI />;
}

export default SlackBotPage;