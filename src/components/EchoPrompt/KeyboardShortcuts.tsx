import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface KeyboardShortcutsProps {
  onGeneratePrompt?: () => void;
  onSavePrompt?: () => void;
  onSaveTemplate?: () => void;
  onLoadTemplate?: () => void;
  onToggleAdvanced?: () => void;
  onFocusTask?: () => void;
}

const KeyboardShortcuts = ({
  onGeneratePrompt,
  onSavePrompt,
  onSaveTemplate,
  onLoadTemplate,
  onToggleAdvanced,
  onFocusTask
}: KeyboardShortcutsProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      // Check for Ctrl/Cmd + key combinations
      const isModifierPressed = event.ctrlKey || event.metaKey;

      if (isModifierPressed) {
        switch (event.key.toLowerCase()) {
          case 'enter':
            event.preventDefault();
            if (onGeneratePrompt) {
              onGeneratePrompt();
              toast({
                title: "🚀 Generating Prompt",
                description: "Using keyboard shortcut (Ctrl/Cmd + Enter)",
                duration: 2000,
              });
            }
            break;
          case 's':
            event.preventDefault();
            if (onSavePrompt) {
              onSavePrompt();
              toast({
                title: "💾 Saving Prompt",
                description: "Using keyboard shortcut (Ctrl/Cmd + S)",
                duration: 2000,
              });
            }
            break;
          case 't':
            event.preventDefault();
            if (onSaveTemplate) {
              onSaveTemplate();
              toast({
                title: "📝 Saving Template",
                description: "Using keyboard shortcut (Ctrl/Cmd + T)",
                duration: 2000,
              });
            }
            break;
          case 'l':
            event.preventDefault();
            if (onLoadTemplate) {
              onLoadTemplate();
              toast({
                title: "📂 Loading Template",
                description: "Using keyboard shortcut (Ctrl/Cmd + L)",
                duration: 2000,
              });
            }
            break;
          case 'a':
            event.preventDefault();
            if (onToggleAdvanced) {
              onToggleAdvanced();
              toast({
                title: "⚙️ Toggling Advanced Options",
                description: "Using keyboard shortcut (Ctrl/Cmd + A)",
                duration: 2000,
              });
            }
            break;
        }
      }

      // Check for single key shortcuts
      switch (event.key.toLowerCase()) {
        case 'f':
          if (onFocusTask && !isModifierPressed) {
            event.preventDefault();
            onFocusTask();
            toast({
              title: "🎯 Focusing Task Field",
              description: "Using keyboard shortcut (F)",
              duration: 2000,
            });
          }
          break;
        case 'escape':
          // Close any open dialogs or menus
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.blur) {
            activeElement.blur();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onGeneratePrompt, onSavePrompt, onSaveTemplate, onLoadTemplate, onToggleAdvanced, onFocusTask, toast]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcuts;
