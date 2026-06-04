import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Settings, Zap, Database, FileText, Menu, X, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SettingsDialog from "./SettingsDialog";
import ProfileMenu from "./ProfileMenu";
import AIStatusIndicator from "./AIStatusIndicator";
import LoadingBar from "./LoadingBar";
import { useAI } from "@/contexts/AIContext";

const Header = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isGenerating, lastGenerationStatus } = useAI();
  const { user } = useAuth();

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  const mobileNavPortal =
    mobileMenuOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div className="md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <button
          type="button"
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px]"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        />
        <nav className="fixed top-0 right-0 bottom-0 z-[201] flex w-[min(100vw,20rem)] flex-col border-l border-border bg-background shadow-2xl">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 px-4">
            <h2 className="text-base font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-auto min-h-12 py-3 text-left"
              onClick={() => {
                navigate("/my-templates");
                setMobileMenuOpen(false);
              }}
            >
              <Database className="w-5 h-5 mr-3 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">My Blueprints</p>
                <p className="text-xs text-muted-foreground">Field recipes</p>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto min-h-12 py-3 text-left"
              onClick={() => {
                navigate("/my-prompts");
                setMobileMenuOpen(false);
              }}
            >
              <FileText className="w-5 h-5 mr-3 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">My Prompts</p>
                <p className="text-xs text-muted-foreground">Saved prompts</p>
              </div>
            </Button>
            {user?.isAdmin && (
              <Button
                variant="ghost"
                className="w-full justify-start h-auto min-h-12 py-3 text-left"
                onClick={() => {
                  navigate("/analytics");
                  setMobileMenuOpen(false);
                }}
              >
                <BarChart3 className="w-5 h-5 mr-3 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium">Analytics</p>
                  <p className="text-xs text-muted-foreground">Platform stats</p>
                </div>
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start h-auto min-h-12 py-3 text-left"
              onClick={() => {
                setSettingsOpen(true);
                setMobileMenuOpen(false);
              }}
            >
              <Settings className="w-5 h-5 mr-3 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">Settings</p>
                <p className="text-xs text-muted-foreground">Tone & format defaults</p>
              </div>
            </Button>
          </div>
        </nav>
      </div>,
      document.body,
    );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-border/30 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <div className="flex items-center space-x-6">
          <button
            type="button"
            className="flex items-center space-x-3"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EchoPrompt
              </h1>
              <p className="text-xs text-muted-foreground -mt-1 font-medium">AI Prompt Generator</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant="ghost"
              className="h-9 px-3 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              onClick={() => navigate('/my-templates')}
            >
              <Database className="w-4 h-4 mr-2" />
              My Blueprints
            </Button>

            <Button
              variant="ghost"
              className="h-9 px-3 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              onClick={() => navigate('/my-prompts')}
            >
              <FileText className="w-4 h-4 mr-2" />
              My Prompts
            </Button>

            {user?.isAdmin && (
              <Button
                variant="ghost"
                className="h-9 px-3 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                onClick={() => navigate('/analytics')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            )}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          <AIStatusIndicator
            className="hidden sm:flex"
            isGenerating={isGenerating}
            lastGenerationStatus={lastGenerationStatus}
          />

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex hover-glow transition-all duration-200 hover:bg-primary/10"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>

          <ProfileMenu onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </div>

      <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <LoadingBar isVisible={isGenerating} />
      {mobileNavPortal}
    </header>
  );
};

export default Header;
