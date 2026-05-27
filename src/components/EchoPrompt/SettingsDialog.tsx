import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  applyPromptDefaults,
  DEFAULT_PROMPT_DEFAULTS,
  type PromptDefaults,
} from "@/lib/promptDefaults";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const STORAGE_KEY = "echoPromptSettings";

const TONE_OPTIONS = ["Professional", "Casual", "Friendly", "Technical", "Creative"] as const;
const FORMAT_OPTIONS = ["Markdown", "Plain Text", "JSON", "Code", "Email"] as const;

const SHORTCUTS = [
  { label: "Generate prompt", keys: "⌘/Ctrl + Enter" },
  { label: "Save prompt", keys: "⌘/Ctrl + S" },
  { label: "Save template", keys: "⌘/Ctrl + Alt + S" },
  { label: "Load template", keys: "⌘/Ctrl + Alt + L" },
  { label: "Toggle advanced", keys: "⌘/Ctrl + A" },
] as const;

function getPrefsUrl(): string {
  const token = localStorage.getItem("authToken");
  return token
    ? `${API_BASE_URL}/user/preferences`
    : `${API_BASE_URL}/user/preferences/anonymous`;
}

function getPrefsHeaders(): Record<string, string> {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function parseStoredSettings(raw: string | null): PromptDefaults | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PromptDefaults>;
    if (parsed.defaultTone && parsed.defaultOutputFormat) {
      return {
        defaultTone: parsed.defaultTone,
        defaultOutputFormat: parsed.defaultOutputFormat,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PromptDefaults>(DEFAULT_PROMPT_DEFAULTS);
  const [isLoading, setIsLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    const local = parseStoredSettings(localStorage.getItem(STORAGE_KEY));
    if (local) setSettings(local);

    try {
      const response = await fetch(getPrefsUrl(), { headers: getPrefsHeaders() });
      if (!response.ok) return;
      const data = await response.json();
      const prefs = data.data?.preferences as Partial<PromptDefaults> | undefined;
      if (prefs?.defaultTone && prefs?.defaultOutputFormat) {
        setSettings({
          defaultTone: prefs.defaultTone,
          defaultOutputFormat: prefs.defaultOutputFormat,
        });
      }
    } catch {
      /* use local */
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadSettings();
  }, [isOpen, loadSettings]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      applyPromptDefaults(settings);

      try {
        await fetch(getPrefsUrl(), {
          method: "POST",
          headers: getPrefsHeaders(),
          body: JSON.stringify({ preferences: settings }),
        });
      } catch {
        /* saved locally */
      }

      toast({
        title: "Settings saved",
        description: "Tone and output format updated in the builder.",
      });
      onClose();
    } catch {
      toast({
        title: "Could not save",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_PROMPT_DEFAULTS);
    toast({ title: "Reset", description: "Defaults restored. Save to apply." });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Defaults for tone and output format when you start a new prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="default-tone">Default tone</Label>
            <Select
              value={settings.defaultTone}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, defaultTone: value }))
              }
            >
              <SelectTrigger id="default-tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((tone) => (
                  <SelectItem key={tone} value={tone}>
                    {tone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-format">Default output format</Label>
            <Select
              value={settings.defaultOutputFormat}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, defaultOutputFormat: value }))
              }
            >
              <SelectTrigger id="default-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Keyboard shortcuts</p>
            <ul className="space-y-1.5">
              {SHORTCUTS.map(({ label, keys }) => (
                <li key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <kbd className="rounded border border-border/60 bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                    {keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="sm:mr-auto"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
