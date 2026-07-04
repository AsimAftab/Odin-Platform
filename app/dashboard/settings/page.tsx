"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Copy, Plus, Check, Trash2, Clock } from "lucide-react";

interface TokenRow {
  _id: string;
  label: string;
  keyId?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export default function SettingsPage() {
  const [label, setLabel] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [retention, setRetention] = useState<number>(0);
  const [retentionSaved, setRetentionSaved] = useState(false);

  async function loadTokens() {
    const res = await fetch("/api/tokens");
    if (res.ok) {
      const data = await res.json();
      setTokens(data.tokens ?? []);
    }
  }

  async function loadSettings() {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setRetention(data.retentionPerMachine ?? 0);
    }
  }

  useEffect(() => {
    // Fetch-on-mount: setState only runs after the awaited responses resolve,
    // so this isn't the synchronous cascade the rule guards against.
    /* eslint-disable react-hooks/set-state-in-effect */
    loadTokens();
    loadSettings();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

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
    loadTokens();
  }

  async function revokeToken(id: string) {
    if (!window.confirm("Revoke this token? Any CLI using it will stop working."))
      return;
    await fetch("/api/tokens", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadTokens();
  }

  async function copyToken() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveRetention() {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retentionPerMachine: retention }),
    });
    if (res.ok) {
      setRetentionSaved(true);
      setTimeout(() => setRetentionSaved(false), 2000);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-amber-400">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage API tokens and snapshot retention</p>
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

      {/* Existing tokens */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="w-4 h-4" /> Active Tokens ({tokens.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No tokens yet. Most users don&apos;t need one — prefer{" "}
              <code className="bg-muted px-1 rounded">odin login</code>.
            </p>
          ) : (
            <div className="space-y-1">
              {tokens.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between py-2 border-b border-border/40 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(t.createdAt).toLocaleDateString()}
                      {t.lastUsedAt
                        ? ` · last used ${new Date(t.lastUsedAt).toLocaleDateString()}`
                        : " · never used"}
                      {!t.keyId && " · legacy"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => revokeToken(t._id)}
                    className="shrink-0 text-muted-foreground hover:text-red-400"
                    aria-label="Revoke token"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snapshot retention */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" /> Snapshot Retention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Keep at most this many snapshots per machine. Older ones are pruned
            automatically on the next upload. Set to <strong>0</strong> to keep
            everything.
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={1000}
              value={retention}
              onChange={(e) => setRetention(Number(e.target.value))}
              className="text-sm w-32"
            />
            <Button onClick={saveRetention} size="sm" variant="outline">
              {retentionSaved ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-green-400" /> Saved
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
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
