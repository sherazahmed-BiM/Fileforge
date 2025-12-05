"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import { Upload, File, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

// Supported file types matching backend
const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "text/html": [".html", ".htm"],
  "text/csv": [".csv"],
  "application/json": [".json"],
  "application/xml": [".xml"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/bmp": [".bmp"],
  "image/tiff": [".tiff"],
};

interface FileWithProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

interface DropzoneProps {
  onFilesAccepted: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
}

export function Dropzone({
  onFilesAccepted,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB
  disabled = false,
}: DropzoneProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || isUploading) return;

      const newFiles = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: "pending" as const,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
      setIsUploading(true);

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            newFiles.find((nf) => nf.file === f.file)
              ? { ...f, status: "uploading" as const, progress: 50 }
              : f
          )
        );

        await onFilesAccepted(acceptedFiles);

        // Update status to completed
        setFiles((prev) =>
          prev.map((f) =>
            newFiles.find((nf) => nf.file === f.file)
              ? { ...f, status: "completed" as const, progress: 100 }
              : f
          )
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            newFiles.find((nf) => nf.file === f.file)
              ? {
                  ...f,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        );
      } finally {
        setIsUploading(false);
      }
    },
    [onFilesAccepted, disabled, isUploading]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_FILE_TYPES,
      maxFiles,
      maxSize,
      disabled: disabled || isUploading,
    });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== "completed"));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("sheet") || type.includes("excel") || type.includes("csv"))
      return "📊";
    if (type.includes("presentation") || type.includes("powerpoint")) return "📽️";
    return "📁";
  };

  const rootProps = getRootProps();

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...rootProps}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all",
          isDragActive && !isDragReject
            ? "border-primary bg-primary/5"
            : isDragReject
              ? "border-destructive bg-destructive/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
          (disabled || isUploading) && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />

        <motion.div
          className="flex flex-col items-center gap-4"
          animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
        >
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full",
              isDragActive
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Upload className="h-8 w-8" />
          </div>

          <div>
            <p className="text-lg font-medium">
              {isDragActive
                ? "Drop files here"
                : "Drag & drop files here, or click to browse"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF, DOCX, XLSX, TXT, Images, and more (max {formatFileSize(maxSize)})
            </p>
          </div>

          <Button variant="secondary" disabled={disabled || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Select Files"
            )}
          </Button>
        </motion.div>

        {/* Gradient overlay on drag */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5"
            />
          )}
        </AnimatePresence>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Files ({files.length})
              </p>
              {files.some((f) => f.status === "completed") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                  className="text-xs"
                >
                  Clear completed
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {files.map((fileItem, index) => (
                <motion.div
                  key={`${fileItem.file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(fileItem.file)}</span>

                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {fileItem.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(fileItem.file.size)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {fileItem.status === "uploading" && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {fileItem.status === "completed" && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {fileItem.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {fileItem.status === "uploading" && (
                      <Progress value={fileItem.progress} className="mt-2 h-1" />
                    )}

                    {fileItem.error && (
                      <p className="mt-1 text-xs text-destructive">
                        {fileItem.error}
                      </p>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
