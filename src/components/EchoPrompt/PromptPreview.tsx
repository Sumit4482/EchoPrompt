import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileText, Code, Table, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptPreviewProps {
  prompt: string;
}

const PromptPreview = ({ prompt }: PromptPreviewProps) => {
  const [activeTab, setActiveTab] = useState("plain");
  const { toast } = useToast();

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
      <div className="p-6 border-b border-border/50 bg-gradient-surface">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold font-display">Live Preview</h2>
            <p className="text-sm text-muted-foreground">Real-time prompt generation</p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Eye className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>

        {/* Format Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
            <TabsTrigger value="plain" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Plain
            </TabsTrigger>
            <TabsTrigger value="markdown" className="text-xs">
              <Code className="w-3 h-3 mr-1" />
              Markdown
            </TabsTrigger>
            <TabsTrigger value="json" className="text-xs">
              <Code className="w-3 h-3 mr-1" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="table" className="text-xs">
              <Table className="w-3 h-3 mr-1" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        <Card className="h-full m-6 mt-0 glass border-border/50">
          <CardContent className="p-0 h-full">
            <div className="h-full overflow-y-auto p-6">
              {prompt ? (
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground">
                  {getFormattedContent()}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gradient-primary/10 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-muted-foreground">
                      Start filling out the fields to see your prompt here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <div className="p-6 border-t border-border/50 bg-gradient-surface">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!prompt}
            className="flex-1 transition-smooth hover:border-primary/50"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("txt")}
            disabled={!prompt}
            className="flex-1 transition-smooth hover:border-primary/50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export TXT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
            disabled={!prompt}
            className="flex-1 transition-smooth hover:border-primary/50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromptPreview;