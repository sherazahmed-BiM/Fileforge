"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Save } from "lucide-react";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChunkStrategy } from "@/types";

interface Settings {
  defaultChunkStrategy: ChunkStrategy;
  defaultChunkSize: number;
  defaultChunkOverlap: number;
  extractTables: boolean;
  ocrEnabled: boolean;
  apiUrl: string;
}

const CHUNK_STRATEGIES: { value: ChunkStrategy; label: string }[] = [
  { value: "semantic", label: "Semantic" },
  { value: "fixed", label: "Fixed Size" },
  { value: "none", label: "None" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    defaultChunkStrategy: "semantic",
    defaultChunkSize: 1000,
    defaultChunkOverlap: 100,
    extractTables: true,
    ocrEnabled: true,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:19000",
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app, you'd persist these settings
    localStorage.setItem("fileforge-settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col">
      <Header
        title="Settings"
        description="Configure default conversion options"
        actions={
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {saved ? "Saved!" : "Save Settings"}
          </Button>
        }
      />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Chunking Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Chunking Defaults</CardTitle>
                <CardDescription>
                  Default settings for document chunking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Chunk Strategy</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {CHUNK_STRATEGIES.map((strategy) => (
                      <button
                        key={strategy.value}
                        type="button"
                        onClick={() =>
                          updateSetting("defaultChunkStrategy", strategy.value)
                        }
                        className={`rounded-lg border p-3 text-center transition-colors ${
                          settings.defaultChunkStrategy === strategy.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {strategy.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chunkSize">Default Chunk Size</Label>
                    <Input
                      id="chunkSize"
                      type="number"
                      min={100}
                      max={10000}
                      value={settings.defaultChunkSize}
                      onChange={(e) =>
                        updateSetting("defaultChunkSize", parseInt(e.target.value) || 1000)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chunkOverlap">Default Chunk Overlap</Label>
                    <Input
                      id="chunkOverlap"
                      type="number"
                      min={0}
                      max={500}
                      value={settings.defaultChunkOverlap}
                      onChange={(e) =>
                        updateSetting("defaultChunkOverlap", parseInt(e.target.value) || 100)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Processing Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Processing Options</CardTitle>
                <CardDescription>
                  Default processing settings for uploads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Extract Tables</p>
                    <p className="text-sm text-muted-foreground">
                      Extract tables with HTML structure
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={settings.extractTables}
                    onChange={(checked) => updateSetting("extractTables", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">OCR Enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Extract text from images and scanned documents
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={settings.ocrEnabled}
                    onChange={(checked) => updateSetting("ocrEnabled", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* API Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Configure the FileForge API connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    type="url"
                    value={settings.apiUrl}
                    onChange={(e) => updateSetting("apiUrl", e.target.value)}
                    placeholder="http://localhost:19000"
                  />
                  <p className="text-xs text-muted-foreground">
                    The base URL of the FileForge API server
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
