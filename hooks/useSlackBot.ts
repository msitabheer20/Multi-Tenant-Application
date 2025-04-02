import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ChatMessage } from '@/components/slack/ChatMessage';
import { SlackLunchReport, SlackUpdateReport, SlackReportStatusReport } from '@/lib/types/slack';

export interface UseSlackBotProps {
  messages: ChatMessage[];
  isLoading: boolean;
  input: string;
  selectedContent: { content: string, name: string } | null;
  setInput: (value: string) => void;
  setSelectedContent: (value: { content: string, name: string } | null) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  clearHistory: () => void;
}

export function useSlackBot(): UseSlackBotProps {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{ content: string, name: string } | null>(null);

  // Add effect to log messages when they change
  useEffect(() => {
    console.log("Messages updated:", messages);
  }, [messages]);

  const clearHistory = () => {
    setMessages([]);
    toast.success('Chat history cleared');
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
      console.log('Starting chat request...');
      console.log('User message:', userMessage);

      const response = await fetch('/api/slackbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response data:', errorData);
        throw new Error(errorData?.error || errorData?.content || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Success response data:', data);

      // Check if the response contains an error message
      if (data.error || (data.content && data.content.includes('I encountered an error'))) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.content || data.error,
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      // Handle Slack Lunch Status response
      if (data.functionCall && data.functionCall.name === 'getSlackLunchStatus') {
        const result = data.functionCall.result as SlackLunchReport;
        
        // Check if we have a valid result with users before continuing
        if (!result || !result.users) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: "Error: Unable to retrieve channel data. The channel might not exist or the bot doesn't have access to it.",
              timestamp: Date.now(),
            },
          ]);
          return;
        }
        
        // Process lunch status data and update messages
        handleLunchStatusResponse(result);
      }
      
      // Handle Slack Update Status response
      else if (data.functionCall && data.functionCall.name === 'getSlackUpdateStatus') {
        const result = data.functionCall.result as SlackUpdateReport;
        
        // Check if we have a valid result with users before continuing
        if (!result || !result.users) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: "Error: Unable to retrieve channel data. The channel might not exist or the bot doesn't have access to it.",
              timestamp: Date.now(),
            },
          ]);
          return;
        }
        
        // Process update status data and update messages
        handleUpdateStatusResponse(result);
      }
      
      // Handle Slack Report Status response
      else if (data.functionCall && data.functionCall.name === 'getSlackReportStatus') {
        const result = data.functionCall.result as SlackReportStatusReport;
        
        // Check if we have a valid result with users before continuing
        if (!result || !result.users) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: "Error: Unable to retrieve channel data. The channel might not exist or the bot doesn't have access to it.",
              timestamp: Date.now(),
            },
          ]);
          return;
        }
        
        // Process report status data and update messages
        handleReportStatusResponse(result);
      }
      
      // Handle normal text response
      else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.content,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error) {
      console.error('Full error details:', error);
      
      // Determine the error message
      let errorMessage = 'An error occurred while processing your request.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: errorMessage,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLunchStatusResponse = (result: SlackLunchReport) => {
    console.log("Lunch status result users:", result.users);
    
    // Add the customContent to messages (the actual table component will be added by the main component)
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        customContent: { type: 'lunchStatus', data: result },
      } as any,
    ]);
  };

  const handleUpdateStatusResponse = (result: SlackUpdateReport) => {
    // Add the customContent to messages (the actual table component will be added by the main component)
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        customContent: { type: 'updateStatus', data: result },
      } as any,
    ]);
  };

  const handleReportStatusResponse = (result: SlackReportStatusReport) => {
    // Add the customContent to messages (the actual table component will be added by the main component)
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        customContent: { type: 'reportStatus', data: result },
      } as any,
    ]);
  };

  return {
    messages,
    isLoading,
    input,
    selectedContent,
    setInput,
    setSelectedContent,
    handleSubmit,
    clearHistory,
  };
} 