"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileImage, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  className?: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export function Dropzone({
  onFileAccepted,
  className,
  accept = {
    "image/*": [".jpeg", ".png", ".jpg", ".gif", ".webp"],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
}: DropzoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setError(null);
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setError("File is too large. Max size is 10MB.");
        } else {
          setError(rejection.errors[0]?.message || "Invalid file.");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        onFileAccepted(file);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
  };

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-[228px] border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-emerald-500/60 bg-emerald-950/20 scale-[1.005]"
            : "border-zinc-700/60 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-600/60",
          preview ? "border-transparent bg-transparent hover:bg-transparent hover:scale-100" : "",
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="relative w-full h-full p-2 group">
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={clearFile}
                className="p-1 bg-black/60 rounded-full hover:bg-black text-white"
                title="Remove image"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain rounded-lg shadow-md"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className={`p-3 rounded-xl transition-all duration-200 ${isDragActive ? "bg-emerald-500/15 scale-110" : "bg-zinc-800/80"}`}>
              <UploadCloud className={`w-7 h-7 transition-colors duration-200 ${isDragActive ? "text-emerald-400" : "text-zinc-400"}`} />
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="text-sm font-medium text-zinc-200">
                {isDragActive ? "Release to extract palette" : "Drop an image or click to browse"}
              </p>
              <p className="text-xs text-zinc-600">
                PNG, JPG, GIF, WebP · Max 10 MB
              </p>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
