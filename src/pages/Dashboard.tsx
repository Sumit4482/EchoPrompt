import { useState } from "react";
import Header from "@/components/EchoPrompt/Header";
import PromptBuilder from "@/components/EchoPrompt/PromptBuilder";
import PromptPreview from "@/components/EchoPrompt/PromptPreview";
import BeginnerTemplates from "@/components/EchoPrompt/BeginnerTemplates";
import CommunityHub from "@/components/EchoPrompt/CommunityHub";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Edit3, Sparkles, Users, Zap } from "lucide-react";

const Dashboard = () => {
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [activePanel, setActivePanel] = useState<"builder" | "preview">("builder");
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [communityRefreshTrigger, setCommunityRefreshTrigger] = useState(0);

  const handlePromptChange = (prompt: string) => {
    setCurrentPrompt(prompt);
    // Clear selected template when user starts editing
    if (selectedTemplate) {
      setSelectedTemplate(null);
    }
  };

  const handleTemplateSelect = (template: any) => {
    // Load template data into the prompt builder
    console.log('📝 Template selected:', template);
    setSelectedTemplate(template);
    setActiveTab("builder");
  };


  const handlePromptUse = (prompt: any) => {
    // Use community prompt
    console.log('📝 Community prompt selected:', prompt);
    setSelectedTemplate(prompt);
    setActiveTab("builder");
  };

  const handlePromptSaved = () => {
    // Trigger refresh of community hub when a prompt is saved
    setCommunityRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-16 pb-4 bg-gradient-to-br from-background via-background/95 to-background/90">
        <div className="container mx-auto px-6">
          <div className="text-center py-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Make AI Work for Everyone
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              Democratize AI with easy-to-use prompt templates, learning resources, and community sharing. 
              No technical knowledge required - just results.
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
      <div className="container mx-auto px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Builder</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <BeginnerTemplates onTemplateSelect={handleTemplateSelect} />
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <span>Advanced Prompt Builder</span>
                </h2>
                <PromptBuilder 
                  onPromptChange={handlePromptChange} 
                  templateData={selectedTemplate?.promptData}
                  onPromptSaved={handlePromptSaved}
                />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Eye className="w-6 h-6 text-primary" />
                  <span>Live Preview</span>
                </h2>
                <PromptPreview prompt={currentPrompt} onPromptChange={handlePromptChange} />
              </div>
            </div>
          </TabsContent>


          <TabsContent value="community" className="space-y-6">
            <CommunityHub onPromptUse={handlePromptUse} refreshTrigger={communityRefreshTrigger} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;