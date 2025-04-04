import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface UseBotProps {
  messages: Message[];
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  clearHistory: () => void;
}

export function useBot(serverId: string): UseBotProps {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(`bot-chat-messages-${serverId}`);
      return savedMessages ? JSON.parse(savedMessages) : [];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`bot-chat-messages-${serverId}`, JSON.stringify(messages));
    }
  }, [messages, serverId]);

  useEffect(() => {
    console.log("Messages updated:", messages);
  }, [messages]);

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

      const response = await fetch('/api/chatbot', {
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
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Success response data:', data);
      
      if (data.functionCall && data.functionCall.name === 'setTheme') {
        const { theme: newTheme } = data.functionCall.arguments;
        setTheme(newTheme);
        toast.success(`Theme changed to ${newTheme} mode`);
        
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.content,
            timestamp: Date.now(),
          },
          {
            id: (Date.now() + 1).toString(),
            role: 'system',
            content: `Theme changed to ${newTheme} mode.`,
            timestamp: Date.now() + 1,
          },
        ]);
      } 
      else if (data.functionCall && data.functionCall.name === 'createServer') {
        const { name, imageUrl } = data.functionCall.arguments;
        
        try {
          const response = await fetch('/api/servers/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, imageUrl }),
          });

          if (!response.ok) {
            throw new Error('Failed to create server');
          }

          const result = await response.json();
          
          if (result.success) {
            toast.success(`Server created successfully: ${name}`);
            setMessages(prev => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.content,
                timestamp: Date.now(),
              },
              {
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: `Server created with name: ${name} and invite code: invite/${result.server?.inviteCode}`,
                timestamp: Date.now() + 1,
              },
            ]);
            router.refresh();
          } else {
            throw new Error(result.error || 'Failed to create server');
          }
        } catch (error) {
          console.error('Server creation error:', error);
          toast.error('Failed to create server');
          throw error;
        }
      }
      else if(data.functionCall && data.functionCall.name === 'deleteServer') {
        try {
          const response = await fetch(`/api/servers/${serverId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to delete server');
          }

          if (result.success) {
            toast.success(`Server deleted successfully`);
            setMessages(prev => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.content,
                timestamp: Date.now(),
              },
              {
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: `Server deleted successfully`,
                timestamp: Date.now() + 1,
              },
            ]);
            router.refresh();
          } else {
            throw new Error(result.error || 'Failed to delete server');
          }
        } catch (error) {
          console.error('Server deletion error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to delete server');
          throw error;
        }
      }
      else if(data.functionCall && data.functionCall.name === 'updateServer') {
        try {
          const response = await fetch(`/api/servers/${serverId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              name: data.functionCall.arguments.name, 
              imageUrl: data.functionCall.arguments.imageUrl 
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update server');
          }

          const result = await response.json();

          if (result.success) {
            toast.success(`Server updated successfully`);
            setMessages(prev => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.content,
                timestamp: Date.now(),
              },
              {
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: `Server updated successfully`,
                timestamp: Date.now() + 1,
              },
            ]);
            router.refresh();
          } else {
            throw new Error(result.error || 'Failed to update server');
          }
        } catch (error) {
          console.error('Server update error:', error);
          toast.error('Failed to update server');
          throw error;
        }
      }
      else if(data.functionCall && data.functionCall.name === 'getMembers') {
        try {
          const response = await fetch(`/api/servers/${serverId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to get members');
          }

          const result = await response.json();
          console.log("HELLO MEMBERS", result);

          if (result.success && result.server) {
            toast.success(`Members fetched successfully`);
            const membersList = result.server.members.map((member: any) => 
              `<div class="bg-white dark:bg-zinc-700/80 rounded-md shadow-sm p-2 mb-2 flex items-center justify-between hover:shadow-md transition-all">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full ${member.role === 'ADMIN' ? 'bg-red-500' : member.role === 'MODERATOR' ? 'bg-blue-500' : 'bg-gray-500'}"></div>
                  <span class="font-medium dark:text-zinc-100">${member.profile.name}</span>
                  <span class="text-xs text-zinc-500 dark:text-zinc-300 px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-600 rounded-full">${member.role.toLowerCase()}</span>
                </div>
                <button onclick="window.location.href='/servers/${serverId}/conversations/${member.id}'" class="text-white bg-indigo-500 hover:bg-indigo-600 px-2.5 py-1 text-xs rounded flex items-center gap-1 transition-colors">
                  <i class="fas fa-paper-plane text-xs"></i>
                  <span>Message</span>
                </button>
              </div>`
            ).join('');

            setMessages(prev => [
              ...prev,
              {
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: `<div class="w-1/3 bg-zinc-50 dark:bg-zinc-800/90 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <div class="flex items-center justify-between mb-3">
                                    <h3 class="text-md font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <i class="fas fa-users text-indigo-500"></i> Server Members (${result.server.members.length})
                                    </h3>
                                </div>
                                <div class="space-y-2">${membersList}</div>
                            </div>`,
                timestamp: Date.now() + 1,
              },
            ]);
          } else {
            throw new Error(result.error || 'Failed to get members');
          }
        } catch (error) {
          console.error('Get members error:', error);
          toast.error('Failed to get members');
          throw error;
        }
      }
      else if(data.functionCall && data.functionCall.name === 'getChannels') {
        try {
          const response = await fetch(`/api/servers/${serverId}/channels`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to get channels');
          }

          const result = await response.json();

          console.log("HELLO CHANNELS", result);

          if (result) {
            toast.success(`Channels fetched successfully`);
            const channelsList = result.map((channel: any) => 
              `<div class="bg-white dark:bg-zinc-700/80 rounded-md shadow-sm p-2 mb-2 flex items-center justify-between hover:shadow-md transition-all">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full ${channel.type === 'TEXT' ? 'bg-emerald-500' : channel.type === 'AUDIO' ? 'bg-amber-500' : 'bg-purple-500'}"></div>
                  <span class="font-medium dark:text-zinc-100">${channel.name}</span>
                  <span class="text-xs text-zinc-500 dark:text-zinc-300 px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-600 rounded-full">${channel.type.toLowerCase()}</span>
                </div>
                <button onclick="window.location.href='/servers/${serverId}/channels/${channel.id}'" class="text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 text-xs rounded flex items-center gap-1 transition-colors">
                  <i class="fas fa-paper-plane text-xs"></i>
                  <span>Message</span>
                </button>
              </div>`
            ).join('');

            setMessages((current) => [...current, {
              id: Date.now().toString(),
              content: `<div class="w-1/3 bg-zinc-50 dark:bg-zinc-800/90 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-md font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <i class="fas fa-hashtag text-emerald-500"></i> Server Channels (${result.length})
                                </h3>
                            </div>
                            <div class="space-y-2">${channelsList}</div>
                        </div>`,
              role: "assistant",
              timestamp: Date.now(),
            }]);
          } else {
            throw new Error(result.error || 'Failed to get channels');
          }
        } catch (error) {
          console.error('Get channels error:', error);
          toast.error('Failed to get channels');
          throw error;
        }
      }
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

  const clearHistory = () => {
    localStorage.removeItem(`bot-chat-messages-${serverId}`);
    setMessages([]);
    toast.success('Chat history cleared');
  };

  return {
    messages,
    isLoading,
    input,
    setInput,
    handleSubmit,
    clearHistory,
  };
} 