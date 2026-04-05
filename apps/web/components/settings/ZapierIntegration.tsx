"use client";

import { useState } from "react";
import { toast } from "sonner"; // Change this if you use a different toast library

export default function ZapierIntegration({ workspaceId }: { workspaceId: string }) {
  // --- API Key State ---
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- Webhook State ---
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // --- API Key Functions ---
  const generateNewKey = async () => {
    if (confirm("Generating a new key will instantly break any existing Zapier connections. Are you sure?")) {
      setIsGenerating(true);
      try {
        const res = await fetch(`${apiUrl}/api/workspaces/${workspaceId}/api-key`, {
          method: "POST",
          credentials: "include", 
        });

        if (!res.ok) throw new Error("Failed to generate API Key");
        
        const data = await res.json();
        setApiKey(data.apiKey);
        toast.success("New API Key generated successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to generate API key. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success("API Key copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- Webhook Functions ---
  const saveWebhookUrl = async () => {
    setIsSavingUrl(true);
    try {
      const res = await fetch(`${apiUrl}/api/workspaces/${workspaceId}/webhook`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save URL");
      toast.success("Webhook Trigger activated!");
      setWebhookUrl(""); // clear the input after success
    } catch (error) {
      toast.error("Failed to save Webhook URL");
    } finally {
      setIsSavingUrl(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-[#09090b] mt-8">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Zapier Integration</h3>
          <p className="text-sm text-gray-500 mt-1">
            Connect TaskFlow to 6,000+ external apps via Zapier.
          </p>
        </div>
        <div className="h-10 w-10 bg-orange-600 text-white flex items-center justify-center rounded-md font-bold">
          Z
        </div>
      </div>

      {/* 1. API KEY SECTION */}
      {!apiKey ? (
        <button
          onClick={generateNewKey}
          disabled={isGenerating}
          className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white px-4 py-2 rounded-md font-medium text-sm transition-all disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate API Key"}
        </button>
      ) : (
        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-md">
          <p className="text-sm font-medium text-orange-800 dark:text-orange-400 mb-2">
            ⚠️ Copy this key now. For security reasons, you won't be able to see it again!
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
              {apiKey}
            </code>
            <button
              onClick={copyToClipboard}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm font-medium transition-all"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* 2. 🟢 OUTBOUND TRIGGERS SECTION (This is what was missing!) */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Outbound Webhooks</h4>
        <p className="text-sm text-gray-500 mb-4">
          Want Zapier to catch events when they happen in TaskFlow? Create a "Catch Hook" in Zapier and paste the URL here.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent text-sm text-white"
          />
          <button
            onClick={saveWebhookUrl}
            disabled={isSavingUrl || !webhookUrl}
            className="bg-gray-900 dark:bg-white dark:text-black hover:bg-gray-800 px-4 py-2 rounded-md font-medium text-sm transition-all disabled:opacity-50"
          >
            {isSavingUrl ? "Saving..." : "Save URL"}
          </button>
        </div>
      </div>

    </div>
  );
}