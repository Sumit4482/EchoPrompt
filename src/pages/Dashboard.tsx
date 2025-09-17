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
      
      {/* Mobile Panel Toggle */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
        <div className="flex rounded-lg bg-card border border-border p-1">
          <Button
            variant={activePanel === "builder" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActivePanel("builder")}
            className="flex-1"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Builder
          </Button>
          <Button
            variant={activePanel === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActivePanel("preview")}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="pt-16 h-screen flex">
        {/* Left Panel - Prompt Builder */}
        <div className={`
          w-full md:w-1/2 border-r border-border/50 bg-gradient-surface
          ${activePanel === "preview" ? "hidden md:block" : "block"}
        `}>
          <PromptBuilder onPromptChange={handlePromptChange} />
        </div>

        {/* Right Panel - Live Preview */}
        <div className={`
          w-full md:w-1/2 bg-background
          ${activePanel === "builder" ? "hidden md:block" : "block"}
        `}>
          <PromptPreview prompt={currentPrompt} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;