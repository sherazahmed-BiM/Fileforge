"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Key,
  Copy,
  Check,
  Trash2,
  MoreVertical,
  AlertCircle,
  Eye,
  EyeOff,
  Book,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAPIKeys,
  useCreateAPIKey,
  useDeleteAPIKey,
  useUpdateAPIKey,
} from "@/hooks/use-api-keys";
import type { APIKey, CreateAPIKeyRequest } from "@/types";

export default function APIKeysPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{
    key: string;
    name: string;
  } | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<APIKey | null>(null);
  const [createForm, setCreateForm] = useState<CreateAPIKeyRequest>({
    name: "",
    rate_limit_rpm: 60,
    rate_limit_rpd: 1000,
    expires_in_days: undefined,
  });

  const { data, isLoading, error } = useAPIKeys();
  const createMutation = useCreateAPIKey();
  const deleteMutation = useDeleteAPIKey();
  const updateMutation = useUpdateAPIKey();

  const handleCreate = async () => {
    try {
      const result = await createMutation.mutateAsync(createForm);
      setNewKeyData({ key: result.key, name: result.name });
      setIsCreateDialogOpen(false);
      setIsKeyDialogOpen(true);
      setCreateForm({
        name: "",
        rate_limit_rpm: 60,
        rate_limit_rpd: 1000,
        expires_in_days: undefined,
      });
    } catch (err) {
      console.error("Failed to create API key:", err);
    }
  };

  const handleDelete = async () => {
    if (!keyToDelete) return;
    try {
      await deleteMutation.mutateAsync(keyToDelete.id);
      setIsDeleteDialogOpen(false);
      setKeyToDelete(null);
    } catch (err) {
      console.error("Failed to delete API key:", err);
    }
  };

  const handleToggleActive = async (apiKey: APIKey) => {
    try {
      await updateMutation.mutateAsync({
        id: apiKey.id,
        request: { is_active: !apiKey.is_active },
      });
    } catch (err) {
      console.error("Failed to toggle API key:", err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col">
      <Header
        title="API Keys"
        description="Manage your API keys for external integrations"
        actions={
          <div className="flex gap-2">
            <Link href="/api-keys/docs">
              <Button variant="outline">
                <Book className="mr-2 h-4 w-4" />
                View Docs
              </Button>
            </Link>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <CardContent className="flex items-start gap-4 pt-6">
                <Key className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="space-y-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Public API Access
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Use API keys to access FileForge from external applications.
                    Include the key in the <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">X-API-Key</code> header.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* API Keys Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Your API Keys</CardTitle>
                <CardDescription>
                  {data?.total || 0} API key{data?.total !== 1 ? "s" : ""} created
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>Failed to load API keys</span>
                  </div>
                ) : data?.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Key className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mb-2 font-medium">No API keys yet</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Create your first API key to start using the FileForge API
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create API Key
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.items.map((apiKey) => (
                        <TableRow key={apiKey.id}>
                          <TableCell className="font-medium">
                            {apiKey.name}
                          </TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-2 py-1 text-sm">
                              {apiKey.key_prefix}...
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={apiKey.is_active ? "default" : "secondary"}
                              className={
                                apiKey.is_active
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : ""
                              }
                            >
                              {apiKey.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {apiKey.total_requests.toLocaleString()} requests
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(apiKey.last_used_at)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(apiKey.created_at)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleToggleActive(apiKey)}
                                >
                                  {apiKey.is_active ? (
                                    <>
                                      <EyeOff className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setKeyToDelete(apiKey);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Rate Limits Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Rate Limits</CardTitle>
                <CardDescription>
                  Default limits for API keys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-2xl font-bold">60</p>
                    <p className="text-sm text-muted-foreground">
                      Requests per minute
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-2xl font-bold">1,000</p>
                    <p className="text-sm text-muted-foreground">
                      Requests per day
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for external integrations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Production, Development"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rpm">Requests per minute</Label>
                <Input
                  id="rpm"
                  type="number"
                  min={1}
                  max={1000}
                  value={createForm.rate_limit_rpm}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      rate_limit_rpm: parseInt(e.target.value) || 60,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpd">Requests per day</Label>
                <Input
                  id="rpd"
                  type="number"
                  min={1}
                  max={100000}
                  value={createForm.rate_limit_rpd}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      rate_limit_rpd: parseInt(e.target.value) || 1000,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">Expires in (days)</Label>
              <Input
                id="expires"
                type="number"
                min={1}
                max={365}
                placeholder="Leave empty for no expiration"
                value={createForm.expires_in_days || ""}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    expires_in_days: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show New Key Dialog */}
      <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium">Important</p>
                  <p>
                    This is the only time your full API key will be displayed.
                    Store it securely.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <CopyableKey apiKey={newKeyData?.key || ""} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsKeyDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{keyToDelete?.name}"? This action
              cannot be undone. Any applications using this key will immediately
              lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Copyable key component
function CopyableKey({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 rounded-lg border bg-muted p-3 text-sm font-mono break-all">
        {visible ? apiKey : "•".repeat(Math.min(apiKey.length, 40))}
      </code>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setVisible(!visible)}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
      <Button variant="outline" size="icon" onClick={handleCopy}>
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
