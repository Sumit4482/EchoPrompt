import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, Eye, EyeOff, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeminiApiDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const GeminiApiDialog = ({ isOpen, onClose }: GeminiApiDialogProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load existing API key from localStorage
      const existingKey = localStorage.getItem('gemini_api_key');
      if (existingKey) {
        setApiKey(existingKey);
        setHasExistingKey(true);
      } else {
        setApiKey("");
        setHasExistingKey(false);
      }
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "❌ Invalid API Key",
        description: "Please enter a valid Gemini API key",
        variant: "destructive",
      });
      return;
    }

    // Basic validation for Gemini API key format
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      toast({
        title: "❌ Invalid Format",
        description: "Gemini API keys should start with 'AIza' and be at least 30 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('gemini_api_key', apiKey.trim());
      
      toast({
        title: "✅ API Key Saved!",
        description: "Your Gemini API key has been saved successfully. AI generation will now use your key.",
        duration: 5000,
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "❌ Save Failed",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey("");
    setHasExistingKey(false);
    
    toast({
      title: "🗑️ API Key Removed",
      description: "Your Gemini API key has been removed. The system will use the default fallback.",
      duration: 4000,
    });
  };

  const handleGetApiKey = () => {
    window.open('https://makersuite.google.com/app/apikey', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2 text-primary" />
            Gemini API Key Configuration
          </DialogTitle>
          <DialogDescription>
            Set your personal Gemini API key to enable AI-powered prompt generation with your own quota.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {hasExistingKey ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    API Key Configured
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <Badge variant="outline" className="border-orange-200 text-orange-800 dark:border-orange-800 dark:text-orange-200">
                    Using Default Fallback
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="api-key">Gemini API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>

          {/* Get API Key Button */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Don't have a Gemini API key?</p>
                <p className="text-xs text-muted-foreground">
                  Get your free API key from Google AI Studio. The free tier includes generous usage limits.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGetApiKey}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Get Free API Key
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div>
              {hasExistingKey && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                >
                  Remove Key
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : hasExistingKey ? "Update Key" : "Save Key"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeminiApiDialog;
