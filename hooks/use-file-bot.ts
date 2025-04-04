import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { FileData } from '@/components/chat/chat-file-upload';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface UseFileBotProps {
  messages: Message[];
  isLoading: boolean;
  isProcessing: boolean;
  isPdfLibLoading: boolean;
  isPdfLibLoaded: boolean;
  isUploadModalOpen: boolean;
  processingStatus: string;
  input: string;
  files: FileData[];
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleFileUpload: (files: FileList | null) => Promise<void>;
  handleRemoveFile: (fileId: string) => Promise<void>;
  clearHistory: () => void;
  setIsUploadModalOpen: (value: boolean) => void;
}

export function useFileBot(serverId: string): UseFileBotProps {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(`file-bot-chat-messages-${serverId}`)
      return savedMessages ? JSON.parse(savedMessages) : [];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isPdfLibLoading, setIsPdfLibLoading] = useState(true);
  const [isPdfLibLoaded, setIsPdfLibLoaded] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`file-bot-chat-messages-${serverId}`, JSON.stringify(messages));
    }
  }, [messages, serverId]);

  useEffect(() => {
    const setupPinecone = async () => {
      try {
        const response = await fetch('/api/setup-pinecone', {
          method: 'POST',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to setup Pinecone index');
        }
      } catch (error) {
        console.error('Error setting up Pinecone:', error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'system',
          content: `Error setting up Pinecone: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your environment variables and try again.`,
          timestamp: Date.now(),
        }]);
      }
    };

    setupPinecone();
  }, []);

  useEffect(() => {
    const initPdfJs = async () => {
      try {
        setIsPdfLibLoading(true);
        const script = document.createElement('script');
        script.src = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;

        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          setIsPdfLibLoaded(true);
          setIsPdfLibLoading(false);
          console.log('PDF.js library loaded successfully');
        };

        script.onerror = (error) => {
          console.error('Error loading PDF.js:', error);
          setIsPdfLibLoading(false);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: 'Error loading PDF.js library. Please refresh the page.',
            timestamp: Date.now(),
          }]);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Error initializing PDF.js:', error);
        setIsPdfLibLoading(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'system',
          content: 'Error initializing PDF.js library. Please refresh the page.',
          timestamp: Date.now(),
        }]);
      }
    };

    initPdfJs();
  }, []);

  const processPdfFile = async (file: File): Promise<string> => {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library not loaded');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      let hasText = false;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        if (pageText.trim().length > 0) {
          hasText = true;
          fullText += pageText + '\n';
        }
      }

      if (!hasText) {
        throw new Error('This PDF appears to be image-based or contains no extractable text. Please ensure the PDF contains actual text content.');
      }

      return fullText;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    setIsProcessing(true);
    setProcessingStatus('Processing files...');

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'system',
        content: 'Uploading file...',
        timestamp: Date.now(),
      },
    ]);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'system',
              content: `File ${file.name} is too large. Maximum size is 5MB.`,
              timestamp: Date.now(),
            },
          ]);
          continue;
        }

        const fileData: FileData = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type: file.type,
          size: file.size,
        };

        setFiles(prev => [...prev, fileData]);

        if (file.type === 'application/pdf') {
          let attempts = 0;
          const maxAttempts = 10;
          while (!isPdfLibLoaded && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
            console.log(`Waiting for PDF.js to load... Attempt ${attempts}/${maxAttempts}`);
          }

          if (!isPdfLibLoaded) {
            throw new Error('Please refresh the page and try again.');
          }
          const content = await processPdfFile(file);
          if (!content.trim()) {
            throw new Error('No text content could be extracted from the PDF. The file might be image-based or have security restrictions.');
          }

          const response = await fetch('/api/process-document', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: fileData.id,
              content,
              metadata: {
                pages: (await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise).numPages,
              },
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to process document in vector database');
          }
        } else {
          const text = await file.text();

          const response = await fetch('/api/process-document', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: fileData.id,
              content: text,
              metadata: {
                filename: file.name,
                type: file.type,
                size: file.size,
              },
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to process document in vector database');
          }
        }
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content: 'File uploaded successfully. You can now ask questions about its content.',
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error('Error processing files:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content: `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
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
      const response = await fetch('/api/filebot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          files: files.map(f => ({
            id: f.id,
            name: f.name,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response data:', errorData);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content,
          timestamp: Date.now(),
        },
      ]);
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

  const handleRemoveFile = async (fileId: string) => {
    try {
      const response = await fetch('/api/delete-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content: 'File removed successfully. You can continue chatting with the remaining files.',
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error('Error removing file:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content: 'Failed to remove file. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem(`file-bot-chat-messages-${serverId}`);
    setMessages([]);
    toast.success("Chat history cleared");
  };

  return {
    messages,
    isLoading,
    isProcessing,
    isPdfLibLoading,
    isPdfLibLoaded,
    isUploadModalOpen,
    processingStatus,
    input,
    files,
    setInput,
    handleSubmit,
    handleFileUpload,
    handleRemoveFile,
    clearHistory,
    setIsUploadModalOpen,
  };
} 