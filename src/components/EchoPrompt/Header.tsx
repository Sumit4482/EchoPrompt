import { Button } from "@/components/ui/button";
import { User, Settings, Zap } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-border/50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-primary">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display bg-gradient-primary bg-clip-text text-transparent">
              EchoPrompt
            </h1>
            <p className="text-xs text-muted-foreground -mt-1">AI Prompt Generator</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="hover-glow">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hover-glow">
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;