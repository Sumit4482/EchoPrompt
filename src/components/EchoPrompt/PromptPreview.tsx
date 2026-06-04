import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PromptPreviewProps {
  prompt: string;
  onPromptChange?: (newPrompt: string) => void;
}

const PromptPreview = ({ prompt, onPromptChange }: PromptPreviewProps) => {
  const [activeTab, setActiveTab] = useState("plain");
  const { toast } = useToast();

  const handlePromptEdit = (newValue: string) => {
    if (!onPromptChange) return;
    let actualPrompt = newValue;

    if (activeTab === "markdown") {
      actualPrompt = newValue
        .replace(/^# AI Prompt\n\n/, "")
        .replace(/\n\n---\n\*Generated with EchoPrompt\*$/, "");
    } else if (activeTab === "json") {
      try {
        const parsed = JSON.parse(newValue);
        actualPrompt = parsed.prompt || newValue;
      } catch {
        actualPrompt = newValue;
      }
    } else if (activeTab === "table") {
      actualPrompt = newValue
        .split("\n")
        .map((line) => line.replace(/^\d+\.\s/, ""))
        .join("\n");
    }

    onPromptChange(actualPrompt);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    toast({ title: "Copied", description: "Ready to paste into your AI tool." });
  };

  const formatPromptAsMarkdown = (text: string) =>
    `# AI Prompt\n\n${text}\n\n---\n*Generated with EchoPrompt*`;

  const formatPromptAsJSON = (text: string) =>
    JSON.stringify({ prompt: text, created_at: new Date().toISOString(), generator: "EchoPrompt" }, null, 2);

  const formatPromptAsTable = (text: string) =>
    text
      .split("\n")
      .filter((line) => line.trim())
      .map((line, index) => `${index + 1}. ${line}`)
      .join("\n");

  const getFormattedContent = () => {
    switch (activeTab) {
      case "markdown":
        return formatPromptAsMarkdown(prompt);
      case "json":
        return formatPromptAsJSON(prompt);
      case "table":
        return formatPromptAsTable(prompt);
      default:
        return prompt;
    }
  };

  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 py-3 border-b border-border/15 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground/90">Your prompt</h2>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {prompt.trim() ? `${wordCount} words · edits sync live` : "Updates as you compose"}
          </p>
        </div>
        {prompt.trim() ? (
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="h-8 w-[100px] text-xs rounded-lg border-border/20 bg-muted/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plain">Plain</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="table">List</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="flex-1 overflow-hidden p-3 md:p-4 min-h-0">
        {prompt.trim() ? (
          <Textarea
            value={getFormattedContent()}
            onChange={(e) => handlePromptEdit(e.target.value)}
            className={cn(
              "w-full h-full resize-none rounded-2xl border-border/15",
              "bg-muted/15 text-sm leading-relaxed font-mono",
              "focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:border-primary/25",
            )}
          />
        ) : (
          <div className="flex items-center justify-center h-full rounded-2xl border border-dashed border-border/20 bg-muted/5">
            <div className="text-center max-w-[220px] space-y-3 px-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary/60" />
              </div>
              <p className="text-sm text-muted-foreground/80 leading-relaxed">
                Your structured prompt will appear here as you fill in the builder.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-border/15">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          disabled={!prompt.trim()}
          className="w-full h-9 rounded-xl text-xs"
        >
          <Copy className="w-3.5 h-3.5 mr-1.5 opacity-70" />
          Copy
        </Button>
      </div>
    </div>
  );
};

export default PromptPreview;
