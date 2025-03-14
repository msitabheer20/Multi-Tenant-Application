"use client"

import { X } from 'lucide-react'
import Image from "next/image"

import { UploadDropzone } from "@/lib/uploadthing"
import { useState } from 'react';
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

    const fileType = value?.split(".").pop();

    if (value && fileType !== "pdf") {
        return (

            <div className="container relative h-20 w-20">
                <Image
                    fill
                    src={value}
                    alt="Upload"
                    className="rounded-full"
                />
                <button
                    onClick={() => onChange("")}
                    className="bg-rose-500 text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
                    type="button"
                >
                    <X className='h-4 w-4'/>
                </button>
            </div>
        )
    }

    return (
        <div className='container'>
            <UploadDropzone
                endpoint={endpoint}
                onClientUploadComplete={(res) => {
                    console.log(res?.[0]);
                    onChange(res?.[0].ufsUrl);
                    setFileUploaded(true);
                }}
                onUploadError={(error: Error) => {
                    console.log(error);
                }}
            />
            {/* {
                fileUploaded && (
                    <button className="bg-blue-500 text-white px-4 py-2 rounded">
                        Upload Image
                    </button>
                )
            } */}
        </div>
    )
}