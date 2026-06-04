import { useState, useCallback } from "react";
import GeminiApiDialog from "@/components/EchoPrompt/GeminiApiDialog";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/EchoPrompt/Header";
import DashboardNav from "@/components/EchoPrompt/DashboardNav";
import PromptBuilder from "@/components/EchoPrompt/PromptBuilder";
import PromptPreview from "@/components/EchoPrompt/PromptPreview";
import BeginnerTemplates from "@/components/EchoPrompt/BeginnerTemplates";
import CommunityHub from "@/components/EchoPrompt/CommunityHub";
import { Button } from "@/components/ui/button";
import { Eye, Edit3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import GuestBanner from "@/components/EchoPrompt/GuestBanner";
import AiUsageHint from "@/components/EchoPrompt/AiUsageHint";
import type { PromptData } from "@/services/api";
import type { BuilderLoadPayload } from "@/components/EchoPrompt/PromptBuilder";
import { trackProductEvent } from "@/lib/productAnalytics";
import {
  resolveDashboardSection,
  type DashboardSection,
} from "@/lib/dashboardRoutes";

const Dashboard = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [activePanel, setActivePanel] = useState<"builder" | "preview">("builder");
  const activeTab = resolveDashboardSection(searchParams.get("tab"));

  const setActiveTab = (tab: DashboardSection) => {
    if (tab === "builder") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  const [builderLoad, setBuilderLoad] = useState<BuilderLoadPayload | null>(null);
  const [communityRefreshTrigger, setCommunityRefreshTrigger] = useState(0);
  const [geminiDialogOpen, setGeminiDialogOpen] = useState(false);

  const handlePromptChange = useCallback((prompt: string) => {
    setCurrentPrompt(prompt);
  }, []);

  const handleBuilderReset = useCallback(() => {
    setBuilderLoad(null);
    setCurrentPrompt("");
  }, []);

  const handleBuilderUndo = useCallback(
    (payload: { previewContent: string; builderLoad: BuilderLoadPayload | null }) => {
      setCurrentPrompt(payload.previewContent);
      setBuilderLoad(payload.builderLoad);
    },
    [],
  );

  const loadIntoBuilder = (promptData: PromptData, content?: string) => {
    setBuilderLoad({
      id: Date.now(),
      promptData,
      content: content?.trim() || undefined,
    });
    setActiveTab("builder");
    setActivePanel(content?.trim() ? "preview" : "builder");
  };

  const handleTemplateSelect = (template: { promptData: PromptData; _id?: string }) => {
    loadIntoBuilder(template.promptData);
    trackProductEvent("template_used", {
      source: "blueprints_tab",
      templateId: template._id,
    });
  };

  const handlePromptUse = (prompt: { promptData?: PromptData; content?: string }) => {
    if (!prompt.promptData) return;
    loadIntoBuilder(prompt.promptData, prompt.content);
  };

  const handlePromptSaved = () => {
    setCommunityRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Header />

      <div className="flex flex-1 min-h-0 overflow-hidden pt-16">
        <DashboardNav active={activeTab} />

        <main className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
          {activeTab === "templates" && (
            <>
              {!authLoading && !isAuthenticated && (
                <div className="shrink-0 px-4 pt-3">
                  <GuestBanner />
                </div>
              )}
              <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-5 py-4">
                <BeginnerTemplates onTemplateSelect={handleTemplateSelect} />
              </div>
            </>
          )}

          {activeTab === "builder" && (
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden builder-workspace">
              {!authLoading && !isAuthenticated && (
                <div className="shrink-0 px-3 pt-2 md:px-4">
                  <GuestBanner compact />
                </div>
              )}
              <div className="shrink-0 px-4 py-1.5 border-b border-border/10">
                <AiUsageHint onConfigureKey={() => setGeminiDialogOpen(true)} />
              </div>

              <div className="flex-1 min-h-0 flex flex-col p-2 md:p-3 pb-[4.5rem] md:pb-3">
                <div className="flex-1 min-h-[280px] grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                  <div
                    className={`flex flex-col min-h-0 overflow-hidden rounded-2xl border border-border/15 bg-card/40 backdrop-blur-sm shadow-sm ${
                      activePanel === "preview" ? "hidden md:flex" : "flex"
                    }`}
                  >
                    <PromptBuilder
                      currentPrompt={currentPrompt}
                      onPromptChange={handlePromptChange}
                      builderLoad={builderLoad}
                      onPromptSaved={handlePromptSaved}
                      onBuilderReset={handleBuilderReset}
                      onBuilderUndo={handleBuilderUndo}
                      onGenerated={() => setActivePanel("preview")}
                      onOpenGeminiKey={() => setGeminiDialogOpen(true)}
                    />
                  </div>
                  <div
                    className={`flex flex-col min-h-0 overflow-hidden rounded-2xl border border-border/15 bg-card/40 backdrop-blur-sm shadow-sm ${
                      activePanel === "builder" ? "hidden md:flex" : "flex"
                    }`}
                  >
                    <PromptPreview prompt={currentPrompt} onPromptChange={handlePromptChange} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "community" && (
            <>
              {!authLoading && !isAuthenticated && (
                <div className="shrink-0 px-4 pt-3">
                  <GuestBanner />
                </div>
              )}
              <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-5 py-4">
                <CommunityHub
                  onPromptUse={handlePromptUse}
                  refreshTrigger={communityRefreshTrigger}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {activeTab === "builder" && (
        <div className="md:hidden fixed bottom-3 left-[4.75rem] right-3 z-40">
          <div className="flex rounded-2xl bg-card/90 backdrop-blur-md border border-border/20 p-1 shadow-lg">
            <Button
              variant={activePanel === "builder" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActivePanel("builder")}
              className="flex-1 rounded-xl h-8 text-xs"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Compose
            </Button>
            <Button
              variant={activePanel === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActivePanel("preview")}
              className="flex-1 rounded-xl h-8 text-xs"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Preview
            </Button>
          </div>
        </div>
      )}

      <GeminiApiDialog isOpen={geminiDialogOpen} onClose={() => setGeminiDialogOpen(false)} />
    </div>
  );
};

export default Dashboard;
