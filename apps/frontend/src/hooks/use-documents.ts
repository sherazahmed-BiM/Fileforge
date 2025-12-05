"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocuments,
  getDocument,
  getDocumentChunks,
  deleteDocument,
  convertFile,
  convertFileSync,
  getConversionStatus,
} from "@/lib/api";
import type { ConvertRequest, ConvertResponse, Document } from "@/types";

// Query keys - Single source of truth for cache keys
export const queryKeys = {
  documents: ["documents"] as const,
  document: (id: number) => ["document", id] as const,
  chunks: (id: number) => ["chunks", id] as const,
  status: (id: number) => ["status", id] as const,
};

export function useDocuments(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.documents, page, pageSize],
    queryFn: () => getDocuments(page, pageSize),
  });
}

export function useDocument(id: number) {
  return useQuery({
    queryKey: queryKeys.document(id),
    queryFn: () => getDocument(id),
    enabled: !!id,
  });
}

export function useDocumentChunks(id: number) {
  return useQuery({
    queryKey: queryKeys.chunks(id),
    queryFn: () => getDocumentChunks(id),
    enabled: !!id,
  });
}

export function useConversionStatus(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.status(id),
    queryFn: () => getConversionStatus(id),
    enabled: enabled && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll every 2 seconds while processing
      if (status === "pending" || status === "processing") {
        return 2000;
      }
      return false;
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation<
    ConvertResponse | Document,
    Error,
    { file: File; options?: ConvertRequest; sync?: boolean }
  >({
    mutationFn: ({ file, options, sync = false }) =>
      sync ? convertFileSync(file, options) : convertFile(file, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
    },
  });
}
