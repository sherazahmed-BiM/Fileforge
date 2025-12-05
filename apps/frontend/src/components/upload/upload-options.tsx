"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ConvertRequest, ChunkStrategy } from "@/types";

interface UploadOptionsProps {
  options: ConvertRequest;
  onChange: (options: ConvertRequest) => void;
}

const CHUNK_STRATEGIES: { value: ChunkStrategy; label: string; description: string }[] = [
  {
    value: "semantic",
    label: "Semantic",
    description: "Split by document structure (titles, sections)",
  },
  {
    value: "fixed",
    label: "Fixed Size",
    description: "Split by character count with overlap",
  },
  {
    value: "none",
    label: "None",
    description: "No chunking, return raw elements",
  },
];

export function UploadOptions({ options, onChange }: UploadOptionsProps) {
  const [expanded, setExpanded] = useState(false);

  const updateOption = <K extends keyof ConvertRequest>(
    key: K,
    value: ConvertRequest[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Conversion Options</CardTitle>
            <CardDescription>
              Configure chunking strategy and processing settings
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Chunking Strategy */}
          <div className="space-y-3">
            <Label>Chunking Strategy</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {CHUNK_STRATEGIES.map((strategy) => (
                <button
                  key={strategy.value}
                  type="button"
                  onClick={() => updateOption("chunk_strategy", strategy.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    options.chunk_strategy === strategy.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium">{strategy.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {strategy.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Chunk Size & Overlap - Only show for fixed strategy */}
          {options.chunk_strategy === "fixed" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chunk_size">Chunk Size (characters)</Label>
                <Input
                  id="chunk_size"
                  type="number"
                  min={100}
                  max={10000}
                  value={options.chunk_size || 1000}
                  onChange={(e) =>
                    updateOption("chunk_size", parseInt(e.target.value) || 1000)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chunk_overlap">Chunk Overlap (characters)</Label>
                <Input
                  id="chunk_overlap"
                  type="number"
                  min={0}
                  max={500}
                  value={options.chunk_overlap || 100}
                  onChange={(e) =>
                    updateOption("chunk_overlap", parseInt(e.target.value) || 100)
                  }
                />
              </div>
            </div>
          )}

          {/* Processing Options */}
          <div className="space-y-3">
            <Label>Processing Options</Label>
            <div className="flex flex-wrap gap-2">
              <ToggleOption
                label="Extract Tables"
                checked={options.extract_tables !== false}
                onChange={(checked) => updateOption("extract_tables", checked)}
              />
              <ToggleOption
                label="OCR Enabled"
                checked={options.ocr_enabled !== false}
                onChange={(checked) => updateOption("ocr_enabled", checked)}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function ToggleOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:border-primary/50"
      }`}
    >
      {label}
    </button>
  );
}
