import { useState } from "react";
import Header from "@/components/EchoPrompt/Header";
import PromptBuilder from "@/components/EchoPrompt/PromptBuilder";
import PromptPreview from "@/components/EchoPrompt/PromptPreview";
import { Button } from "@/components/ui/button";
import { Eye, Edit3 } from "lucide-react";

const Dashboard = () => {
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [activePanel, setActivePanel] = useState<"builder" | "preview">("builder");

  const handlePromptChange = (prompt: string) => {
    setCurrentPrompt(prompt);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-16 pb-4 bg-gradient-to-br from-background via-background/95 to-background/90">
        <div className="container mx-auto px-6">
          <div className="text-center py-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Create Perfect Prompts
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Generate optimized AI prompts using our intelligent builder with templates and AI assistance.
            </p>
          </div>
        </div>
      </div>
      
      {/* Mobile Panel Toggle */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
        <div className="flex rounded-xl bg-card/95 backdrop-blur-sm border border-border/50 p-1 shadow-2xl">
          <Button
            variant={activePanel === "builder" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActivePanel("builder")}
            className="flex-1 rounded-lg"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Builder
          </Button>
          <Button
            variant={activePanel === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActivePanel("preview")}
            className="flex-1 rounded-lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="min-h-screen flex">
        {/* Left Panel - Prompt Builder */}
        <div className={`
          w-full md:w-1/2 border-r border-border/30 bg-gradient-to-br from-background/50 to-background
          ${activePanel === "preview" ? "hidden md:block" : "block"}
        `}>
          <PromptBuilder onPromptChange={handlePromptChange} />
        </div>

        {/* Right Panel - Live Preview */}
        <div className={`
          w-full md:w-1/2 bg-gradient-to-bl from-background/50 to-background
          ${activePanel === "builder" ? "hidden md:block" : "block"}
        `}>
          <PromptPreview prompt={currentPrompt} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;