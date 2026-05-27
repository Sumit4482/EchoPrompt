import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Eye, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptPreviewProps {
  prompt: string;
  onPromptChange?: (newPrompt: string) => void;
}

const PromptPreview = ({ prompt, onPromptChange }: PromptPreviewProps) => {
  const [activeTab, setActiveTab] = useState("plain");
  const { toast } = useToast();

  const handlePromptEdit = (newValue: string) => {
    if (onPromptChange) {
      // If editing formatted content, try to extract the original prompt
      let actualPrompt = newValue;
      
      if (activeTab === "markdown") {
        // Remove markdown formatting to get back to plain text
        actualPrompt = newValue
          .replace(/^# AI Prompt\n\n/, '')
          .replace(/\n\n---\n\*Generated with EchoPrompt\*$/, '');
      } else if (activeTab === "json") {
        // Try to parse JSON and extract the prompt field
        try {
          const parsed = JSON.parse(newValue);
          actualPrompt = parsed.prompt || newValue;
        } catch {
          // If JSON is invalid, keep the raw text
          actualPrompt = newValue;
        }
      } else if (activeTab === "table") {
        // Remove numbering from table format
        actualPrompt = newValue
          .split('\n')
          .map(line => line.replace(/^\d+\.\s/, ''))
          .join('\n');
      }
      
      onPromptChange(actualPrompt);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard",
    });
  };

  const handleExport = (format: string) => {
    const blob = new Blob([prompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `echoprompt.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported!",
      description: `Prompt exported as ${format.toUpperCase()}`,
    });
  };

  const formatPromptAsMarkdown = (text: string) => {
    if (!text) return "";
    return `# AI Prompt

${text}

---
*Generated with EchoPrompt*`;
  };

  const formatPromptAsJSON = (text: string) => {
    if (!text) return "{}";
    return JSON.stringify({
      prompt: text,
      created_at: new Date().toISOString(),
      generator: "EchoPrompt"
    }, null, 2);
  };

  const formatPromptAsTable = (text: string) => {
    if (!text) return "";
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
  };

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Preview</span>
          {prompt && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              Editable
            </Badge>
          )}
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-7 bg-secondary/60">
            <TabsTrigger value="plain" className="text-xs h-6 px-2">Plain</TabsTrigger>
            <TabsTrigger value="markdown" className="text-xs h-6 px-2">MD</TabsTrigger>
            <TabsTrigger value="json" className="text-xs h-6 px-2">JSON</TabsTrigger>
            <TabsTrigger value="table" className="text-xs h-6 px-2">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden p-4">
        {prompt ? (
          <Textarea
            value={getFormattedContent()}
            onChange={(e) => handlePromptEdit(e.target.value)}
            className="w-full h-full resize-none border border-border/40 bg-muted/20 text-sm font-mono leading-relaxed rounded-lg focus-visible:ring-1"
            placeholder={`Your ${activeTab} formatted prompt will appear here. You can edit it directly...`}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-center rounded-lg border border-dashed border-border/40">
            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Fill in the builder fields to see your prompt here
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Export Actions */}
      <div className="shrink-0 px-4 py-3 border-t border-border/30">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!prompt}
            className="flex-1 h-8 text-xs"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("txt")}
            disabled={!prompt}
            className="flex-1 h-8 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            TXT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
            disabled={!prompt}
            className="flex-1 h-8 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            JSON
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromptPreview;