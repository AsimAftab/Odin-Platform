"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Copy, Plus, Check } from "lucide-react";

export default function SettingsPage() {
  const [label, setLabel] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function generateToken() {
    if (!label.trim()) return;
    setLoading(true);
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const data = await res.json();
    setNewToken(data.token);
    setLabel("");
    setLoading(false);
  }

  async function copyToken() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-amber-400">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage API tokens for CLI access</p>
      </div>

      {/* Generate token */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="w-4 h-4" /> Generate API Token
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            The easiest way to connect is{" "}
            <code className="bg-muted px-1 rounded">odin login</code> — it opens your browser to
            approve this machine, no copy/paste. Generate a token below only for CI or headless
            setups. Tokens are shown once.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Token label (e.g. my-laptop)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateToken()}
              className="text-sm"
            />
            <Button onClick={generateToken} disabled={loading || !label.trim()} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Generate
            </Button>
          </div>

          {newToken && (
            <div className="bg-muted rounded-md p-3 flex items-center justify-between gap-3">
              <code className="text-xs font-mono break-all text-amber-400">{newToken}</code>
              <Button variant="ghost" size="icon" onClick={copyToken} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CLI setup instructions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">CLI Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="mb-2 font-medium text-foreground">Recommended — browser login</p>
            <pre className="bg-muted rounded-md p-3 text-xs font-mono text-foreground overflow-x-auto">
{`odin login --url https://your-platform.vercel.app
# approve this machine in the browser`}
            </pre>
          </div>
          <div>
            <p className="mb-2 font-medium text-foreground">CI / headless — API token</p>
            <pre className="bg-muted rounded-md p-3 text-xs font-mono text-foreground overflow-x-auto">
{`odin config platform --url https://your-platform.vercel.app --token odin_xxxx...`}
            </pre>
          </div>
          <p>
            Once connected, Odin offers to upload your existing snapshots and enable auto-upload,
            so every <code className="bg-muted px-1 rounded text-foreground">odin snapshot</code>{" "}
            pushes to this platform in the background.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
