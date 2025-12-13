"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Book,
  Code,
  Copy,
  Check,
  ChevronRight,
  Key,
  Zap,
  Shield,
  Clock,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function APIDocsPage() {
  return (
    <div className="flex flex-col">
      <Header
        title="API Documentation"
        description="Complete guide to using the FileForge Public API"
        actions={
          <Link href="/api-keys">
            <Button>
              <Key className="mr-2 h-4 w-4" />
              Manage API Keys
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Quick Start */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Quick Start</CardTitle>
                </div>
                <CardDescription>
                  Get started with the FileForge API in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Create API Key</p>
                      <p className="text-sm text-muted-foreground">
                        Go to{" "}
                        <Link href="/api-keys" className="text-primary underline">
                          API Keys
                        </Link>{" "}
                        and create a new key
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Add Header</p>
                      <p className="text-sm text-muted-foreground">
                        Include <code className="text-xs">X-API-Key</code> in requests
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Convert Files</p>
                      <p className="text-sm text-muted-foreground">
                        Upload files to get LLM-ready output
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Authentication */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <CardTitle>Authentication</CardTitle>
                </div>
                <CardDescription>
                  How to authenticate your API requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  All API requests must include your API key in the{" "}
                  <code className="rounded bg-muted px-1">X-API-Key</code> header.
                  API keys start with <code className="rounded bg-muted px-1">ff_live_</code>.
                </p>
                <CodeBlock
                  title="Example Request Header"
                  code={`X-API-Key: ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
                  language="http"
                />
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium">Keep your API key secure</p>
                      <p>
                        Never expose your API key in client-side code or public repositories.
                        Use environment variables to store keys securely.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Base URL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Base URL</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  code={`https://your-domain.com/api/v1/public`}
                  language="text"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  For local development: <code className="rounded bg-muted px-1">http://localhost:19000/api/v1/public</code>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Endpoints */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-500" />
                  <CardTitle>API Endpoints</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Convert Endpoint */}
                <EndpointSection
                  method="POST"
                  path="/convert"
                  description="Convert a file to LLM-ready format (synchronous)"
                  requestBody={`# Form Data
file: <binary>           # Required - The file to convert
chunk_strategy: semantic # Optional - semantic, fixed, or none
chunk_size: 1000         # Optional - Characters per chunk (100-10000)
chunk_overlap: 100       # Optional - Overlap between chunks (0-500)`}
                  responseExample={`{
  "success": true,
  "document": {
    "filename": "report.pdf",
    "file_type": "pdf",
    "file_size_bytes": 102400,
    "page_count": 10
  },
  "content": {
    "pages": [
      {
        "page_number": 1,
        "text": "Introduction to Machine Learning...",
        "word_count": 250
      }
    ],
    "chunks": [
      {
        "index": 0,
        "text": "Introduction to Machine Learning...",
        "token_count": 150,
        "source_page": 1
      }
    ]
  },
  "statistics": {
    "total_pages": 10,
    "total_words": 5000,
    "total_chunks": 25,
    "total_tokens": 4500,
    "processing_time_ms": 1234
  }
}`}
                />

                {/* Usage Endpoint */}
                <EndpointSection
                  method="GET"
                  path="/usage"
                  description="Get current usage statistics for your API key"
                  responseExample={`{
  "success": true,
  "api_key_name": "Production",
  "rate_limit_rpm": 60,
  "rate_limit_rpd": 1000,
  "requests_this_minute": 5,
  "requests_today": 142,
  "total_requests": 1523,
  "last_used_at": "2025-01-15T10:30:00Z"
}`}
                />

                {/* Formats Endpoint */}
                <EndpointSection
                  method="GET"
                  path="/formats"
                  description="List all supported file formats"
                  responseExample={`{
  "success": true,
  "formats": [
    {
      "extension": ".pdf",
      "mime_type": "application/pdf",
      "category": "Documents",
      "description": "PDF documents"
    },
    {
      "extension": ".docx",
      "mime_type": "application/vnd.openxmlformats...",
      "category": "Documents",
      "description": "Microsoft Word documents"
    }
  ],
  "total": 50
}`}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Code Examples */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  <CardTitle>Code Examples</CardTitle>
                </div>
                <CardDescription>
                  Ready-to-use examples in popular languages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="python" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="go">Go</TabsTrigger>
                  </TabsList>
                  <TabsContent value="python" className="mt-4">
                    <CodeBlock
                      title="Python (requests)"
                      language="python"
                      code={`import requests

API_KEY = "ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
API_URL = "http://localhost:19000/api/v1/public/convert"

# Upload and convert a file
with open("document.pdf", "rb") as f:
    response = requests.post(
        API_URL,
        headers={"X-API-Key": API_KEY},
        files={"file": ("document.pdf", f, "application/pdf")},
        data={
            "chunk_strategy": "semantic",
            "chunk_size": 1000,
            "chunk_overlap": 100
        }
    )

if response.status_code == 200:
    result = response.json()
    print(f"Extracted {result['statistics']['total_chunks']} chunks")
    print(f"Total tokens: {result['statistics']['total_tokens']}")

    # Access chunks
    for chunk in result['content']['chunks']:
        print(f"Chunk {chunk['index']}: {chunk['text'][:100]}...")
else:
    print(f"Error: {response.json()}")`}
                    />
                  </TabsContent>
                  <TabsContent value="javascript" className="mt-4">
                    <CodeBlock
                      title="JavaScript (Node.js)"
                      language="javascript"
                      code={`const fs = require('fs');
const FormData = require('form-data');

const API_KEY = 'ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const API_URL = 'http://localhost:19000/api/v1/public/convert';

async function convertFile(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('chunk_strategy', 'semantic');
  form.append('chunk_size', '1000');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
    },
    body: form
  });

  if (!response.ok) {
    throw new Error(\`API error: \${response.status}\`);
  }

  const result = await response.json();
  console.log(\`Extracted \${result.statistics.total_chunks} chunks\`);
  return result;
}

// Usage
convertFile('document.pdf')
  .then(result => console.log(result))
  .catch(err => console.error(err));`}
                    />
                  </TabsContent>
                  <TabsContent value="curl" className="mt-4">
                    <CodeBlock
                      title="cURL"
                      language="bash"
                      code={`# Convert a file
curl -X POST "http://localhost:19000/api/v1/public/convert" \\
  -H "X-API-Key: ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -F "file=@document.pdf" \\
  -F "chunk_strategy=semantic" \\
  -F "chunk_size=1000"

# Check usage
curl "http://localhost:19000/api/v1/public/usage" \\
  -H "X-API-Key: ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# List supported formats
curl "http://localhost:19000/api/v1/public/formats" \\
  -H "X-API-Key: ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"`}
                    />
                  </TabsContent>
                  <TabsContent value="go" className="mt-4">
                    <CodeBlock
                      title="Go"
                      language="go"
                      code={`package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
    "os"
    "path/filepath"
)

const (
    apiKey = "ff_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    apiURL = "http://localhost:19000/api/v1/public/convert"
)

func convertFile(filePath string) (map[string]interface{}, error) {
    file, err := os.Open(filePath)
    if err != nil {
        return nil, err
    }
    defer file.Close()

    body := &bytes.Buffer{}
    writer := multipart.NewWriter(body)

    part, _ := writer.CreateFormFile("file", filepath.Base(filePath))
    io.Copy(part, file)
    writer.WriteField("chunk_strategy", "semantic")
    writer.Close()

    req, _ := http.NewRequest("POST", apiURL, body)
    req.Header.Set("X-API-Key", apiKey)
    req.Header.Set("Content-Type", writer.FormDataContentType())

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}

func main() {
    result, err := convertFile("document.pdf")
    if err != nil {
        panic(err)
    }
    fmt.Printf("Result: %+v\\n", result)
}`}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Rate Limits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <CardTitle>Rate Limits</CardTitle>
                </div>
                <CardDescription>
                  Understanding API rate limiting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-3xl font-bold">60</p>
                    <p className="text-sm text-muted-foreground">
                      Requests per minute (RPM)
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-3xl font-bold">1,000</p>
                    <p className="text-sm text-muted-foreground">
                      Requests per day (RPD)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Rate Limit Headers</p>
                  <p className="text-sm text-muted-foreground">
                    Every response includes headers to help you track your usage:
                  </p>
                  <CodeBlock
                    code={`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699999999
X-RateLimit-Limit-Day: 1000
X-RateLimit-Remaining-Day: 858`}
                    language="http"
                  />
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Rate Limit Exceeded Response</p>
                  <CodeBlock
                    code={`{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retry_after": 60
  }
}`}
                    language="json"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Error Codes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <CardTitle>Error Codes</CardTitle>
                </div>
                <CardDescription>
                  Common errors and how to handle them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 text-left font-medium">Status</th>
                        <th className="py-3 text-left font-medium">Code</th>
                        <th className="py-3 text-left font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-3">
                          <Badge variant="destructive">400</Badge>
                        </td>
                        <td className="py-3 font-mono text-xs">INVALID_FILE</td>
                        <td className="py-3 text-muted-foreground">
                          Missing or invalid file in request
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">
                          <Badge variant="destructive">400</Badge>
                        </td>
                        <td className="py-3 font-mono text-xs">UNSUPPORTED_FORMAT</td>
                        <td className="py-3 text-muted-foreground">
                          File format not supported
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">
                          <Badge variant="destructive">400</Badge>
                        </td>
                        <td className="py-3 font-mono text-xs">FILE_TOO_LARGE</td>
                        <td className="py-3 text-muted-foreground">
                          File exceeds maximum size (100MB)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">
                          <Badge variant="destructive">401</Badge>
                        </td>
                        <td className="py-3 font-mono text-xs">UNAUTHORIZED</td>
                        <td className="py-3 text-muted-foreground">
                          Missing or invalid API key
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">
                          <Badge variant="destructive">401</Badge>
                        </td>
                        <td className="py-3 font-mono text-xs">KEY_REVOKED</td>
                        <td className="py-3 text-muted-foreground">
                          API key has been revoked
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">
                          <Badge variant="destructive">401</Badge>
                        </td>
                        <td className="py-3 font-mono text-xs">KEY_EXPIRED</td>
                        <td className="py-3 text-muted-foreground">
                          API key has expired
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">
                          <Badge variant="secondary">429</Badge>
                        </td>
                        <td className="py-3 font-mono text-xs">RATE_LIMIT_EXCEEDED</td>
                        <td className="py-3 text-muted-foreground">
                          Too many requests, wait and retry
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">
                          <Badge variant="destructive">500</Badge>
                        </td>
                        <td className="py-3 font-mono text-xs">PROCESSING_ERROR</td>
                        <td className="py-3 text-muted-foreground">
                          Server error during file processing
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Supported Formats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Supported File Formats</CardTitle>
                <CardDescription>50+ formats supported</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormatCategory
                    title="Documents"
                    formats={["PDF", "DOCX", "DOC", "RTF", "ODT", "TXT"]}
                  />
                  <FormatCategory
                    title="Spreadsheets"
                    formats={["XLSX", "XLS", "CSV", "TSV", "ODS"]}
                  />
                  <FormatCategory
                    title="Presentations"
                    formats={["PPTX", "PPT", "ODP"]}
                  />
                  <FormatCategory
                    title="Markup"
                    formats={["HTML", "Markdown", "RST", "AsciiDoc"]}
                  />
                  <FormatCategory
                    title="Images (OCR)"
                    formats={["PNG", "JPG", "TIFF", "BMP", "WebP"]}
                  />
                  <FormatCategory
                    title="Other"
                    formats={["EPUB", "EML", "MSG", "JSON", "XML"]}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Best Practices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-indigo-500" />
                  <CardTitle>Best Practices</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Use environment variables</p>
                      <p className="text-sm text-muted-foreground">
                        Never hardcode API keys. Use environment variables or secret managers.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Handle rate limits gracefully</p>
                      <p className="text-sm text-muted-foreground">
                        Implement exponential backoff when you receive 429 responses.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Choose the right chunk strategy</p>
                      <p className="text-sm text-muted-foreground">
                        Use "semantic" for documents with clear structure, "fixed" for uniform chunks.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Rotate keys periodically</p>
                      <p className="text-sm text-muted-foreground">
                        Create new API keys and deprecate old ones for better security.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Monitor your usage</p>
                      <p className="text-sm text-muted-foreground">
                        Use the /usage endpoint to track consumption and avoid hitting limits.
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Code Block Component with Copy
function CodeBlock({
  title,
  code,
  language,
}: {
  title?: string;
  code: string;
  language: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border bg-muted/50">
      {title && (
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-medium">{title}</span>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
      <div className="relative">
        {!title && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
        <pre className="overflow-x-auto p-4 text-sm">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

// Endpoint Section Component
function EndpointSection({
  method,
  path,
  description,
  requestBody,
  responseExample,
}: {
  method: string;
  path: string;
  description: string;
  requestBody?: string;
  responseExample: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Badge
          variant={method === "GET" ? "secondary" : "default"}
          className={
            method === "POST"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              : ""
          }
        >
          {method}
        </Badge>
        <code className="font-mono text-sm">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {requestBody && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Request</p>
          <CodeBlock code={requestBody} language="text" />
        </div>
      )}
      <div className="space-y-2">
        <p className="text-sm font-medium">Response</p>
        <CodeBlock code={responseExample} language="json" />
      </div>
    </div>
  );
}

// Format Category Component
function FormatCategory({
  title,
  formats,
}: {
  title: string;
  formats: string[];
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="mb-2 font-medium">{title}</p>
      <div className="flex flex-wrap gap-1">
        {formats.map((format) => (
          <Badge key={format} variant="secondary" className="text-xs">
            {format}
          </Badge>
        ))}
      </div>
    </div>
  );
}
