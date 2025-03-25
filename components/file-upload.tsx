"use client"

import { FileIcon, X, Upload } from 'lucide-react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useUploadThing } from "@/lib/uploadthing"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { useState, useRef } from 'react';
// import "@uploadthing/react/styles.css";

interface FileUploadProps {
    onChange: (url?: string) => void;
    value: string;
    endpoint: "messageFile" | "serverImage"
}

export const FileUpload = ({
    onChange,
    value,
    endpoint
}: FileUploadProps) => {
    const [fileUploaded, setFileUploaded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { startUpload, isUploading } = useUploadThing(endpoint, {
        onClientUploadComplete: (res) => {
            if (res?.[0]) {
                onChange(res[0].url);
                setFileUploaded(true);
            }
        },
        onUploadError: (error: Error) => {
            console.log(error);
        },
    });

    const fileType = value?.split(".").pop();

    const handleFileSelect = async (files: FileList | null) => {
        if (files && files.length > 0) {
            setFileName(files[0].name);
            await startUpload(Array.from(files));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            setFileName(files[0].name);
        }
        await handleFileSelect(files);
    };

    if (value) {
        return (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
                <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
                <span className="ml-2 text-sm text-indigo-500 dark:text-indigo-400">
                    {fileName || "Uploaded file"}
                </span>
                <button
                    onClick={() => {
                        onChange("");
                        setFileName("");
                    }}
                    className="bg-rose-500 text-white p-1 rounded-full absolute -top-0 -right-0 shadow-sm"
                    type="button"
                >
                    <X className='h-4 w-4'/>
                </button>
            </div>
        )
    }

    return (
        <div className="relative w-full">
            <div 
                className={`
                    w-full 
                    border-2 
                    border-dashed 
                    rounded-lg 
                    p-6 
                    flex 
                    flex-col 
                    items-center 
                    gap-4
                    cursor-pointer
                    transition-colors
                    ${isDragging 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-300 hover:border-indigo-500'
                    }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    accept={endpoint === "serverImage" ? "image/*" : "image/*,.pdf"}
                />
                <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-indigo-500" />
                    <p className="text-sm font-medium text-indigo-500">
                        {endpoint === "serverImage" 
                            ? "Click or drag and drop an image" 
                            : "Click or drag and drop a file"
                        }
                    </p>
                    <p className="text-xs text-gray-500">
                        {endpoint === "serverImage" 
                            ? "Image up to 4MB" 
                            : "PDF or image up to 4MB"
                        }
                    </p>
                </div>
                {isUploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                    </div>
                )}
            </div>
        </div>
    )
}