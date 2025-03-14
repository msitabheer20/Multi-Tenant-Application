"use client"
import { CldUploadWidget } from 'next-cloudinary';

const UploadImages = () => {
    return (
        <CldUploadWidget uploadPreset="taskhub">
            {({ open }) => {
                return (
                    <button onClick={() => open()}>
                        Upload an Image
                    </button>
                );
            }}
        </CldUploadWidget>
    )
}

export default UploadImages;