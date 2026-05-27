import { useEffect } from "react";

interface KeyboardShortcutsProps {
  onGeneratePrompt?: () => void;
  onSavePrompt?: () => void;
  onSaveTemplate?: () => void;
  onLoadTemplate?: () => void;
  onToggleAdvanced?: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

const KeyboardShortcuts = ({
  onGeneratePrompt,
  onSavePrompt,
  onSaveTemplate,
  onLoadTemplate,
  onToggleAdvanced,
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      const key = event.key.toLowerCase();
      const inEditable = isEditableTarget(event.target);
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Ctrl/Cmd + Enter — generate (works while typing in fields)
      if (key === "enter" && !shift && !alt) {
        event.preventDefault();
        onGeneratePrompt?.();
        return;
      }

      // Ctrl/Cmd + S — save prompt
      if (key === "s" && !shift && !alt) {
        event.preventDefault();
        onSavePrompt?.();
        return;
      }

      // Ctrl/Cmd + Alt + S — save template (avoids browser Ctrl+T / Ctrl+Shift+S)
      if (key === "s" && alt && !shift) {
        event.preventDefault();
        onSaveTemplate?.();
        return;
      }

      // Ctrl/Cmd + Alt + L — load template (avoids browser Ctrl+L / Ctrl+Shift+O)
      if (key === "l" && alt && !shift) {
        event.preventDefault();
        onLoadTemplate?.();
        return;
      }

      // Ctrl/Cmd + A — toggle advanced only when not in a field (preserve select-all)
      if (key === "a" && !shift && !alt) {
        if (inEditable) return;
        event.preventDefault();
        onToggleAdvanced?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onGeneratePrompt, onSavePrompt, onSaveTemplate, onLoadTemplate, onToggleAdvanced]);

  return null;
};

export default KeyboardShortcuts;
