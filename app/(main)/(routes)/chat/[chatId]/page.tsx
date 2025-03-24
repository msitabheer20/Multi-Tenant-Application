import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { setIsStreaming, setIsLoading, addMessage } from '@/store/chatSlice';

const ChatPage = ({ params }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    if (isMounted) {
      dispatch(setIsStreaming(false));
      dispatch(setIsLoading(false));
    }
  }, [isMounted, dispatch]);

  useEffect(() => {
    if (isMounted) {
      const initializeChat = async () => {
        try {
          // First setup Pinecone
          const pineconeResponse = await fetch('/api/setup-pinecone', {
            method: 'POST',
          });
          
          if (!pineconeResponse.ok) {
            const errorData = await pineconeResponse.json();
            throw new Error(errorData.details || 'Failed to setup Pinecone');
          }

          // Then initialize the chat
          const response = await axios.post(`/api/chat/${params.chatId}/messages`, {
            content: "Hello! I'm your AI assistant. How can I help you today?",
            role: "assistant",
          });

          if (response.data) {
            dispatch(addMessage(response.data));
          }
        } catch (error) {
          console.error('Error initializing chat:', error);
          toast.error('Failed to initialize chat');
        }
      };

      initializeChat();
    }
  }, [isMounted, params.chatId, dispatch]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default ChatPage; 