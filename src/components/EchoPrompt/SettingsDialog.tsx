import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Palette, Zap, Database, Globe, Shield, Save, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  aiProvider: 'gemini' | 'openai' | 'claude';
  autoSave: boolean;
  enableNotifications: boolean;
  defaultOutputFormat: string;
  defaultTone: string;
  promptOptimization: boolean;
  maxTokens: number;
  temperature: number;
  enableAnalytics: boolean;
  privateMode: boolean;
}

const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    language: 'English',
    aiProvider: 'gemini',
    autoSave: true,
    enableNotifications: true,
    defaultOutputFormat: 'Markdown',
    defaultTone: 'Professional',
    promptOptimization: true,
    maxTokens: 2048,
    temperature: 0.7,
    enableAnalytics: true,
    privateMode: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage and backend on component mount
  useEffect(() => {
    const loadSettings = async () => {
      // Load from localStorage first (immediate)
      const savedSettings = localStorage.getItem('echoPromptSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed, theme: 'dark' })); // Force dark theme
          applyTheme('dark');
        } catch (error) {
          console.error('Error loading local settings:', error);
        }
      }

      // Try to load from backend (if available)
      try {
        const response = await fetch('http://localhost:3001/api/user/preferences/anonymous');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.preferences) {
            setSettings(prev => ({ ...prev, ...data.data.preferences, theme: 'dark' })); // Force dark theme
            applyTheme('dark');
            console.log('✅ Settings loaded from backend');
          }
        }
      } catch (backendError) {
        console.warn('Backend load failed, using local settings:', backendError);
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage (immediate local storage)
      localStorage.setItem('echoPromptSettings', JSON.stringify(settings));
      
      // Apply theme immediately (force dark)
      applyTheme('dark');
      
      // Save to backend (if available)
      try {
        const response = await fetch('http://localhost:3001/api/user/preferences/anonymous', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preferences: settings }),
        });
        
        if (response.ok) {
          console.log('✅ Settings saved to backend');
        }
      } catch (backendError) {
        console.warn('Backend save failed, continuing with local storage:', backendError);
      }
      
      // Apply other settings immediately
      applySettings(settings);
      
      toast({
        title: "✅ Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyTheme = (theme: string) => {
    const root = window.document.documentElement;
    // Force dark mode only
    root.classList.add('dark');
  };

  const applySettings = (newSettings: UserSettings) => {
    // Apply language
    if (newSettings.language !== 'English') {
      console.log(`🌍 Language set to: ${newSettings.language}`);
      // In a real app, you'd initialize i18n here
    }

    // Apply notification preferences
    if (!newSettings.enableNotifications) {
      console.log('🔕 Notifications disabled');
    }

    // Set default values for new prompts
    const defaultsToSet = {
      defaultTone: newSettings.defaultTone,
      defaultOutputFormat: newSettings.defaultOutputFormat,
      promptOptimization: newSettings.promptOptimization,
      aiProvider: newSettings.aiProvider,
      maxTokens: newSettings.maxTokens,
      temperature: newSettings.temperature,
    };

    // Store these for use in prompt generation
    localStorage.setItem('echoPromptDefaults', JSON.stringify(defaultsToSet));

    // Analytics setting
    if (!newSettings.enableAnalytics) {
      console.log('📊 Analytics disabled');
    }

    // Private mode
    if (newSettings.privateMode) {
      console.log('🔒 Private mode enabled - prompts will not be saved to cloud');
    }

    console.log('⚙️ Settings applied successfully:', newSettings);
  };

  const resetToDefaults = () => {
    const defaultSettings: UserSettings = {
      theme: 'dark',
      language: 'English',
      aiProvider: 'gemini',
      autoSave: true,
      enableNotifications: true,
      defaultOutputFormat: 'Markdown',
      defaultTone: 'Professional',
      promptOptimization: true,
      maxTokens: 2048,
      temperature: 0.7,
      enableAnalytics: true,
      privateMode: false,
    };
    
    setSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
    });
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Settings className="w-6 h-6 mr-2 text-primary" />
            Settings & Preferences
          </DialogTitle>
          <DialogDescription>
            Customize EchoPrompt to match your workflow and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Palette className="w-5 h-5 mr-2" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex items-center p-3 bg-muted/30 rounded-lg border">
                  <Moon className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Optimized for productivity and eye comfort</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => updateSetting('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Español</SelectItem>
                    <SelectItem value="French">Français</SelectItem>
                    <SelectItem value="German">Deutsch</SelectItem>
                    <SelectItem value="Chinese">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="w-5 h-5 mr-2" />
                AI Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>AI Provider</Label>
                <Select
                  value={settings.aiProvider}
                  onValueChange={(value) => updateSetting('aiProvider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">
                      <div className="flex items-center">
                        Google Gemini <Badge className="ml-2 text-xs">Active</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="openai" disabled>
                      OpenAI GPT <Badge variant="secondary" className="ml-2 text-xs">Coming Soon</Badge>
                    </SelectItem>
                    <SelectItem value="claude" disabled>
                      Anthropic Claude <Badge variant="secondary" className="ml-2 text-xs">Coming Soon</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Tokens: {settings.maxTokens}</Label>
                <Slider
                  value={[settings.maxTokens]}
                  onValueChange={(value) => updateSetting('maxTokens', value[0])}
                  max={4096}
                  min={256}
                  step={256}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Temperature: {settings.temperature}</Label>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={(value) => updateSetting('temperature', value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Default Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Database className="w-5 h-5 mr-2" />
                Default Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Output Format</Label>
                <Select
                  value={settings.defaultOutputFormat}
                  onValueChange={(value) => updateSetting('defaultOutputFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Markdown">Markdown</SelectItem>
                    <SelectItem value="Plain Text">Plain Text</SelectItem>
                    <SelectItem value="JSON">JSON</SelectItem>
                    <SelectItem value="Code">Code</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Tone</Label>
                <Select
                  value={settings.defaultTone}
                  onValueChange={(value) => updateSetting('defaultTone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Shield className="w-5 h-5 mr-2" />
                Privacy & Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save prompts</Label>
                  <p className="text-xs text-muted-foreground">Automatically save prompts to local storage</p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable notifications</Label>
                  <p className="text-xs text-muted-foreground">Show success and error notifications</p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Prompt optimization</Label>
                  <p className="text-xs text-muted-foreground">Enable advanced AI prompt optimization</p>
                </div>
                <Switch
                  checked={settings.promptOptimization}
                  onCheckedChange={(checked) => updateSetting('promptOptimization', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics</Label>
                  <p className="text-xs text-muted-foreground">Track usage for improvement insights</p>
                </div>
                <Switch
                  checked={settings.enableAnalytics}
                  onCheckedChange={(checked) => updateSetting('enableAnalytics', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Private mode</Label>
                  <p className="text-xs text-muted-foreground">Don't save prompts to cloud database</p>
                </div>
                <Switch
                  checked={settings.privateMode}
                  onCheckedChange={(checked) => updateSetting('privateMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={isLoading}
          >
            Reset to Defaults
          </Button>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
