import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/EchoPrompt/Header";
import PromptBuilder from "@/components/EchoPrompt/PromptBuilder";
import PromptPreview from "@/components/EchoPrompt/PromptPreview";
import BeginnerTemplates from "@/components/EchoPrompt/BeginnerTemplates";
import CommunityHub from "@/components/EchoPrompt/CommunityHub";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Edit3, Users, Zap } from "lucide-react";

const DASHBOARD_TABS = ["templates", "builder", "community"] as const;
type DashboardTab = (typeof DASHBOARD_TABS)[number];

const isDashboardTab = (value: string | null): value is DashboardTab =>
  value !== null && (DASHBOARD_TABS as readonly string[]).includes(value);

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [activePanel, setActivePanel] = useState<"builder" | "preview">("builder");
  const tabParam = searchParams.get("tab");
  const activeTab: DashboardTab = isDashboardTab(tabParam) ? tabParam : "templates";

  const setActiveTab = (tab: string) => {
    if (!isDashboardTab(tab)) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "templates") {
          next.delete("tab");
        } else {
          next.set("tab", tab);
        }
        return next;
      },
      { replace: true },
    );
  };
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [communityRefreshTrigger, setCommunityRefreshTrigger] = useState(0);

  const handlePromptChange = (prompt: string) => {
    setCurrentPrompt(prompt);
    // Clear selected template when user starts editing
    if (selectedTemplate) {
      setSelectedTemplate(null);
    }
  };

  const handleTemplateSelect = (template: { promptData?: unknown }) => {
    setSelectedTemplate(template);
    setActiveTab("builder");
  };

  const handlePromptUse = (prompt: { promptData?: unknown }) => {
    setSelectedTemplate({ promptData: prompt.promptData });
    setActiveTab("builder");
  };

  const handlePromptSaved = () => {
    // Trigger refresh of community hub when a prompt is saved
    setCommunityRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Header />

      {/* Content below fixed header */}
      <div className="flex flex-col flex-1 overflow-hidden pt-16">
        {/* Page subheader */}
        <div className="shrink-0 px-6 py-3 border-b border-border/30 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Prompt Builder</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create prompts from templates or build your own.
            </p>
          </div>
        </div>

        {/* Tabs + scrollable content */}
        <div className="flex flex-col flex-1 overflow-hidden px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden min-h-0">
            <TabsList className="shrink-0 w-full bg-transparent border-b border-border/30 rounded-none h-auto p-0 grid grid-cols-3 gap-0 mt-1">
              <TabsTrigger
                value="templates"
                className="flex items-center justify-center gap-1.5 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none h-10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Templates
              </TabsTrigger>
              <TabsTrigger
                value="builder"
                className="flex items-center justify-center gap-1.5 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none h-10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Builder
              </TabsTrigger>
              <TabsTrigger
                value="community"
                className="flex items-center justify-center gap-1.5 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none h-10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Community
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="templates"
              className="flex-1 overflow-y-auto min-h-0 mt-0 pt-4 pb-6 data-[state=inactive]:hidden"
            >
              <BeginnerTemplates onTemplateSelect={handleTemplateSelect} />
            </TabsContent>

            <TabsContent
              value="builder"
              className="flex-1 overflow-hidden min-h-0 mt-0 pt-4 pb-4 data-[state=inactive]:hidden"
            >
              <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div
                  className={`flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card animate-fade-in ${
                    activePanel === "preview" ? "hidden lg:flex" : "flex"
                  }`}
                >
                  <PromptBuilder
                    currentPrompt={currentPrompt}
                    onPromptChange={handlePromptChange}
                    templateData={selectedTemplate?.promptData}
                    onPromptSaved={handlePromptSaved}
                    onReset={() => setSelectedTemplate(null)}
                  />
                </div>
                <div
                  className={`flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card animate-fade-in stagger-1 ${
                    activePanel === "builder" ? "hidden lg:flex" : "flex"
                  }`}
                >
                  <PromptPreview prompt={currentPrompt} onPromptChange={handlePromptChange} />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="community"
              className="flex-1 overflow-y-auto min-h-0 mt-0 pt-4 pb-6 data-[state=inactive]:hidden"
            >
              <CommunityHub onPromptUse={handlePromptUse} refreshTrigger={communityRefreshTrigger} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile Panel Toggle */}
      {activeTab === "builder" && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <div className="flex rounded-lg bg-card/95 backdrop-blur-sm border border-border/50 p-1 shadow-xl">
            <Button
              variant={activePanel === "builder" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActivePanel("builder")}
              className="flex-1 rounded-md h-8 text-xs"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Builder
            </Button>
            <Button
              variant={activePanel === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActivePanel("preview")}
              className="flex-1 rounded-md h-8 text-xs"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;