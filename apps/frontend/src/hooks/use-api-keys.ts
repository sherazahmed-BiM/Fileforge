"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAPIKeys,
  getAPIKey,
  createAPIKey,
  updateAPIKey,
  deleteAPIKey,
  revokeAPIKey,
} from "@/lib/api-keys";
import type {
  CreateAPIKeyRequest,
  CreateAPIKeyResponse,
  UpdateAPIKeyRequest,
  APIKey,
} from "@/types";

// Query keys - Single source of truth for cache keys
export const apiKeyQueryKeys = {
  all: ["api-keys"] as const,
  detail: (id: number) => ["api-keys", id] as const,
};

// List all API keys
export function useAPIKeys() {
  return useQuery({
    queryKey: apiKeyQueryKeys.all,
    queryFn: getAPIKeys,
  });
}

// Get a single API key
export function useAPIKey(id: number) {
  return useQuery({
    queryKey: apiKeyQueryKeys.detail(id),
    queryFn: () => getAPIKey(id),
    enabled: !!id,
  });
}

// Create a new API key
export function useCreateAPIKey() {
  const queryClient = useQueryClient();

  return useMutation<CreateAPIKeyResponse, Error, CreateAPIKeyRequest>({
    mutationFn: createAPIKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.all });
    },
  });
}

// Update an API key
export function useUpdateAPIKey() {
  const queryClient = useQueryClient();

  return useMutation<
    APIKey,
    Error,
    { id: number; request: UpdateAPIKeyRequest }
  >({
    mutationFn: ({ id, request }) => updateAPIKey(id, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: apiKeyQueryKeys.detail(variables.id),
      });
    },
  });
}

// Delete an API key
export function useDeleteAPIKey() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: deleteAPIKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.all });
    },
  });
}

// Revoke an API key
export function useRevokeAPIKey() {
  const queryClient = useQueryClient();

  return useMutation<APIKey, Error, number>({
    mutationFn: revokeAPIKey,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.detail(id) });
    },
  });
}
