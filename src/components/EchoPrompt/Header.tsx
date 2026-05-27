import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Zap, Database, FileText, Menu, X } from "lucide-react";
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
              My Templates
            </Button>

            <Button
              variant="ghost"
              className="h-9 px-3 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              onClick={() => navigate('/my-prompts')}
            >
              <FileText className="w-4 h-4 mr-2" />
              My Prompts
            </Button>
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
            className="hover-glow transition-all duration-200 hover:bg-primary/10"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>

          <ProfileMenu onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </div>

      <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <LoadingBar isVisible={isGenerating} />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 p-6 space-y-4">
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-left"
                onClick={() => { navigate('/my-templates'); setMobileMenuOpen(false); }}
              >
                <Database className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">My Templates</p>
                  <p className="text-xs text-muted-foreground">Manage your templates</p>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-left"
                onClick={() => { navigate('/my-prompts'); setMobileMenuOpen(false); }}
              >
                <FileText className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">My Prompts</p>
                  <p className="text-xs text-muted-foreground">View your generated prompts</p>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-left"
                onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false); }}
              >
                <Settings className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">Settings</p>
                  <p className="text-xs text-muted-foreground">Tone & output defaults</p>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
