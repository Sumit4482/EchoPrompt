import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sparkles, Save, Settings, Undo2, Copy, MoreHorizontal } from "lucide-react";
import BuilderField from "./BuilderField";
import BuilderProgress from "./BuilderProgress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { buildPromptText, hasPreviewablePrompt } from "@/lib/buildPromptText";
import { useToast } from "@/hooks/use-toast";
import { apiService, PromptData } from "@/services/api";
import TemplateDialog from "./TemplateDialog";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { useAI } from "@/contexts/AIContext";
import { useContextualFieldSuggestions } from "@/hooks/useContextualFieldSuggestions";
import { findTaskBundleMatch } from "@/lib/contextualSuggestions";
import { fillEmptyFromBundle, applyTaskFieldBundle } from "@/constants/taskFieldBundles";
import { trackPromptDataSuggestions } from "@/lib/suggestionFeedback";
import { trackProductEvent } from "@/lib/productAnalytics";
import { BuilderSuggestionField } from "@/constants/builderSuggestions";
import {
  PROMPT_DEFAULTS_UPDATED,
  readPromptDefaults,
  type PromptDefaults,
} from "@/lib/promptDefaults";
import { hasGeminiApiKey } from "@/lib/geminiKey";
import {
  savePromptDraft,
  loadPromptDraft,
  clearPromptDraft,
  getEditingPromptId,
  setEditingPromptId,
  clearEditingPromptId,
} from "@/lib/promptDraft";
import GeminiApiDialog from "./GeminiApiDialog";

const EMPTY_PROMPT_DATA: PromptData = {
  role: "",
  task: "",
  context: "",
  tone: "",
  outputFormat: "",
  constraints: "",
  responseLength: "",
  audience: "",
  industry: "",
  mood: "",
  language: "",
  complexity: "",
  customVariables: "",
};

export type BuilderLoadPayload = {
  id: number;
  promptData: PromptData;
  content?: string;
};

interface PromptBuilderProps {
  currentPrompt: string;
  onPromptChange: (prompt: string) => void;
  builderLoad?: BuilderLoadPayload | null;
  onPromptSaved?: () => void;
  onBuilderReset?: () => void;
  onBuilderUndo?: (payload: { previewContent: string; builderLoad: BuilderLoadPayload | null }) => void;
  onGenerated?: () => void;
  onOpenGeminiKey?: () => void;
}

type BuilderUndoSnapshot = {
  promptData: PromptData;
  previewContent: string;
  preserveAiPreview: boolean;
  lastAiEnhanced: boolean;
  saveAsPublic: boolean;
  isAdvancedOpen: boolean;
  editingPromptId: string | null;
  builderLoad: BuilderLoadPayload | null;
};

const SUBSTANTIVE_FIELDS: (keyof PromptData)[] = [
  "role",
  "task",
  "context",
  "constraints",
  "responseLength",
  "audience",
  "industry",
  "mood",
  "language",
  "complexity",
  "customVariables",
];

function hasSubstantiveFields(data: PromptData): boolean {
  if (data.task?.trim()) return true;
  return SUBSTANTIVE_FIELDS.some((key) => (data[key] ?? "").trim().length > 0);
}

/** Ignore tone/outputFormat — those are often just settings defaults after reset. */
function hasBuilderContent(data: PromptData, preview: string): boolean {
  if (preview.trim()) return true;
  return SUBSTANTIVE_FIELDS.some((key) => (data[key] ?? "").trim().length > 0);
}

const PromptBuilder = ({
  currentPrompt,
  onPromptChange,
  builderLoad,
  onPromptSaved,
  onBuilderReset,
  onBuilderUndo,
  onGenerated,
  onOpenGeminiKey,
}: PromptBuilderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { startGeneration, completeGeneration } = useAI();
  const [promptData, setPromptData] = useState<PromptData>({ ...EMPTY_PROMPT_DATA });
  const { suggestions: fieldSuggestions } = useContextualFieldSuggestions(promptData);
  const builderContext = [promptData.task, promptData.role, promptData.context]
    .filter(Boolean)
    .join(" ");
  const taskAutoFillRef = useRef("");

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDialogMode, setTemplateDialogMode] = useState<"save" | "load">("save");
  const [saveAsPublic, setSaveAsPublic] = useState(false);
  const [lastAiEnhanced, setLastAiEnhanced] = useState(false);
  const [geminiDialogOpen, setGeminiDialogOpen] = useState(false);
  const editingPromptId = getEditingPromptId();
  const [undoSnapshot, setUndoSnapshot] = useState<BuilderUndoSnapshot | null>(null);
  /** When true, field edits won't overwrite AI-generated preview text */
  const preserveAiPreviewRef = useRef(false);

  const syncPreviewFromFields = useCallback(
    (data: PromptData) => {
      preserveAiPreviewRef.current = false;
      onPromptChange(hasPreviewablePrompt(data) ? buildPromptText(data) : "");
    },
    [onPromptChange],
  );

  // Restore local draft when nothing else is loading into the builder
  useEffect(() => {
    const templateRaw = localStorage.getItem("selectedTemplate");
    const promptRaw = localStorage.getItem("selectedPrompt");
    if (templateRaw || promptRaw) return;

    const draft = loadPromptDraft();
    if (draft?.promptData) {
      setPromptData({ ...EMPTY_PROMPT_DATA, ...draft.promptData });
      if (draft.content?.trim()) {
        preserveAiPreviewRef.current = true;
        onPromptChange(draft.content);
      }
      setLastAiEnhanced(draft.lastAiEnhanced);
    }
  }, [onPromptChange]);

  // Check for template or prompt data in localStorage on mount (set by MyTemplates / MyPrompts)
  useEffect(() => {
    const templateRaw = localStorage.getItem('selectedTemplate');
    const promptRaw = localStorage.getItem('selectedPrompt');

    if (templateRaw) {
      try {
        const template = JSON.parse(templateRaw);
        const data = template.promptData ?? template;
        const merged = { ...EMPTY_PROMPT_DATA, ...data };
        setPromptData(merged);
        syncPreviewFromFields(merged);
        localStorage.removeItem('selectedTemplate');
      } catch {
        localStorage.removeItem('selectedTemplate');
      }
    } else if (promptRaw) {
      // "Use Prompt" from Library — pre-fill builder with the prompt's data
      try {
        const prompt = JSON.parse(promptRaw);
        const data: PromptData = { ...EMPTY_PROMPT_DATA, ...(prompt.promptData ?? {}) };
        setPromptData(data);
        if (prompt.content?.trim()) {
          preserveAiPreviewRef.current = true;
          onPromptChange(prompt.content);
        } else {
          syncPreviewFromFields(data);
        }
        localStorage.removeItem('selectedPrompt');
      } catch {
        localStorage.removeItem('selectedPrompt');
      }
    }
  }, [location.pathname, location.search, onPromptChange, syncPreviewFromFields]);

  // Apply new defaults when user saves Settings (explicit choice only)
  useEffect(() => {
    const onDefaultsUpdated = (event: Event) => {
      const defaults = (event as CustomEvent<PromptDefaults>).detail ?? readPromptDefaults();
      setPromptData((prev) => ({
        ...prev,
        tone: prev.tone?.trim() ? prev.tone : defaults.defaultTone,
        outputFormat: prev.outputFormat?.trim()
          ? prev.outputFormat
          : defaults.defaultOutputFormat,
      }));
    };

    window.addEventListener(PROMPT_DEFAULTS_UPDATED, onDefaultsUpdated);
    return () => window.removeEventListener(PROMPT_DEFAULTS_UPDATED, onDefaultsUpdated);
  }, []);

  // Load from Templates or Community tab (always overrides current preview)
  useEffect(() => {
    if (!builderLoad) return;

    const safe: PromptData = {
      role: builderLoad.promptData.role || "",
      task: builderLoad.promptData.task || "",
      context: builderLoad.promptData.context || "",
      tone: builderLoad.promptData.tone || "",
      outputFormat: builderLoad.promptData.outputFormat || "",
      constraints: builderLoad.promptData.constraints || "",
      responseLength: builderLoad.promptData.responseLength || "",
      audience: builderLoad.promptData.audience || "",
      industry: builderLoad.promptData.industry || "",
      mood: builderLoad.promptData.mood || "",
      language: builderLoad.promptData.language || "",
      complexity: builderLoad.promptData.complexity || "",
      customVariables: builderLoad.promptData.customVariables || "",
    };

    setPromptData(safe);
    clearEditingPromptId();

    if (builderLoad.content) {
      preserveAiPreviewRef.current = true;
      setLastAiEnhanced(false);
      onPromptChange(builderLoad.content);
    } else {
      syncPreviewFromFields(safe);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-apply when user picks template/community
  }, [builderLoad?.id]);

  // New template/community load supersedes undo
  useEffect(() => {
    if (builderLoad?.id) setUndoSnapshot(null);
  }, [builderLoad?.id]);

  const updatePromptData = useCallback((field: keyof PromptData, value: string) => {
    preserveAiPreviewRef.current = false;
    setPromptData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Rebuild preview from fields when builder inputs change (not after AI generate)
  useEffect(() => {
    if (preserveAiPreviewRef.current) return;
    onPromptChange(hasPreviewablePrompt(promptData) ? buildPromptText(promptData) : "");
  }, [promptData, onPromptChange]);

  // Create stable onChange handlers for each field
  const handleRoleChange = useCallback((value: string) => updatePromptData("role", value), [updatePromptData]);
  const handleTaskChange = useCallback((value: string) => {
    preserveAiPreviewRef.current = false;
    taskAutoFillRef.current = "";
    setPromptData((prev) => applyTaskFieldBundle(prev, value));
  }, []);

  // While typing a task, softly fill empty fields when topic is recognizable
  useEffect(() => {
    const task = promptData.task?.trim() ?? "";
    if (task.length < 6 || promptData.role?.trim()) return;

    const timer = window.setTimeout(() => {
      if (taskAutoFillRef.current === task) return;
      const bundle = findTaskBundleMatch(task);
      if (!bundle) return;
      taskAutoFillRef.current = task;
      setPromptData((prev) => fillEmptyFromBundle(prev, bundle));
    }, 500);

    return () => window.clearTimeout(timer);
  }, [promptData.task, promptData.role]);
  const handleContextChange = useCallback((value: string) => updatePromptData("context", value), [updatePromptData]);
  const handleToneChange = useCallback((value: string) => updatePromptData("tone", value), [updatePromptData]);
  const handleOutputFormatChange = useCallback((value: string) => updatePromptData("outputFormat", value), [updatePromptData]);
  const handleConstraintsChange = useCallback((value: string) => updatePromptData("constraints", value), [updatePromptData]);
  const handleResponseLengthChange = useCallback((value: string) => updatePromptData("responseLength", value), [updatePromptData]);
  const handleAudienceChange = useCallback((value: string) => updatePromptData("audience", value), [updatePromptData]);
  const handleIndustryChange = useCallback((value: string) => updatePromptData("industry", value), [updatePromptData]);
  const handleMoodChange = useCallback((value: string) => updatePromptData("mood", value), [updatePromptData]);
  const handleLanguageChange = useCallback((value: string) => updatePromptData("language", value), [updatePromptData]);
  const handleComplexityChange = useCallback((value: string) => updatePromptData("complexity", value), [updatePromptData]);
  const handleCustomVariablesChange = useCallback((value: string) => updatePromptData("customVariables", value), [updatePromptData]);

  const handleCopyPrompt = useCallback(() => {
    const text = currentPrompt.trim() || buildPromptText(promptData);
    if (!text.trim()) {
      toast({
        title: "Nothing to copy",
        description: "Write a task or pick a blueprint first.",
        variant: "destructive",
      });
      return;
    }
    navigator.clipboard.writeText(text);
    trackProductEvent("prompt_copied", { source: "builder" });
    toast({ title: "Copied", description: "Structured prompt ready for ChatGPT / Claude." });
  }, [currentPrompt, promptData, toast]);

  const handleGenerateWithAI = async () => {
    if (!promptData.task) {
      toast({
        title: "Error",
        description: "Please enter a task description before generating.",
        variant: "destructive",
      });
      return;
    }

    startGeneration();
    setIsGenerating(true);
    
    try {
      const response = await apiService.generatePrompt(promptData, true);
      if (response.success && response.data) {
        preserveAiPreviewRef.current = true;
        onPromptChange(response.data.prompt.content);
        const isAISuccess = response.data.prompt.metadata?.aiEnhanced || false;
        setLastAiEnhanced(isAISuccess);
        
        completeGeneration(isAISuccess);
        
        savePromptDraft({
          promptData,
          content: response.data.prompt.content,
          lastAiEnhanced: isAISuccess,
          savedAt: new Date().toISOString(),
        });

        const hosted = response.data.metadata?.hostedAi as
          | { remaining?: number; limit?: number }
          | undefined;
        const quotaHint =
          hosted && typeof hosted.remaining === "number"
            ? ` ${hosted.remaining} free AI runs left today (resets midnight UTC).`
            : hasGeminiApiKey()
              ? " Using your API key."
              : "";

        toast({
          title: isAISuccess ? "Enhanced" : "Enhance unavailable",
          description: isAISuccess
            ? `Optional AI polish applied (${response.data.metadata.wordCount} words).${quotaHint}`
            : `Using your structured prompt — hosted AI may be unavailable or over limit.`,
          variant: isAISuccess ? "default" : "destructive",
        });
        onGenerated?.();
      } else {
        throw new Error(response.error || "Failed to generate prompt with AI");
      }
    } catch (error) {
      console.error("Error generating prompt with AI:", error);
      completeGeneration(false);
      const msg = error instanceof Error ? error.message : "Failed to generate with AI.";
      toast({
        title: "AI Generation Failed",
        description: msg.includes("limit") ? `${msg} Or add your own Gemini key (profile menu).` : msg,
        variant: "destructive",
      });
      if (msg.includes("limit") || msg.includes("API key")) {
        setGeminiDialogOpen(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in to save",
        description: "Copying is free — sign in to save prompts and share to community.",
      });
      navigate("/login");
      return;
    }

    if (!promptData.task) {
      toast({
        title: "⚠️ Task Required",
        description: "Please add a task before saving",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const contentToSave =
        currentPrompt.trim() || buildPromptText(promptData);

      const tags = [promptData.role, promptData.industry, promptData.outputFormat].filter(Boolean);
      const response = editingPromptId
        ? await apiService.updatePrompt(editingPromptId, {
            content: contentToSave,
            promptData,
            isPublic: saveAsPublic,
            tags,
          })
        : await apiService.savePrompt({
            content: contentToSave,
            promptData,
            isPublic: saveAsPublic,
            tags,
            metadata: { aiEnhanced: lastAiEnhanced, optimized: true },
          });

      if (response.success) {
        trackPromptDataSuggestions(promptData);
        clearPromptDraft();
        if (!editingPromptId) clearEditingPromptId();
        toast({
          title: editingPromptId ? "Prompt updated" : "Prompt Saved",
          description: saveAsPublic
            ? "Saved to My Prompts and shared to community."
            : "Saved to My Prompts (private).",
        });
        if (onPromptSaved) onPromptSaved();
      } else {
        throw new Error(response.error || 'Save failed');
      }
    } catch (error) {
      console.error('❌ Save failed:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Please sign in to save prompts.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in to save",
        description: "Field recipes are saved to My Blueprints after login.",
      });
      navigate("/login");
      return;
    }
    if (!promptData.task) {
      toast({
        title: "Error",
        description: "Please enter a task before saving a field recipe",
        variant: "destructive",
      });
      return;
    }
    setTemplateDialogMode("save");
    setTemplateDialogOpen(true);
  };

  const handleOpenLoadTemplate = () => {
    setTemplateDialogMode("load");
    setTemplateDialogOpen(true);
  };

  const handleTemplateLoaded = (loadedPromptData: PromptData) => {
    // Ensure all values are strings to prevent undefined errors
    const safeTemplateData = {
      role: loadedPromptData.role || "",
      task: loadedPromptData.task || "",
      context: loadedPromptData.context || "",
      tone: loadedPromptData.tone || "",
      outputFormat: loadedPromptData.outputFormat || "",
      constraints: loadedPromptData.constraints || "",
      responseLength: loadedPromptData.responseLength || "",
      audience: loadedPromptData.audience || "",
      industry: loadedPromptData.industry || "",
      mood: loadedPromptData.mood || "",
      language: loadedPromptData.language || "",
      complexity: loadedPromptData.complexity || "",
      customVariables: loadedPromptData.customVariables || ""
    };
    setPromptData(safeTemplateData);
    syncPreviewFromFields(safeTemplateData);
    trackProductEvent("template_used", { source: "builder_load" });
  };

  const handleReset = () => {
    const canUndo = hasBuilderContent(promptData, currentPrompt);
    if (canUndo) {
      setUndoSnapshot({
        promptData: { ...promptData },
        previewContent: currentPrompt,
        preserveAiPreview: preserveAiPreviewRef.current,
        lastAiEnhanced,
        saveAsPublic,
        isAdvancedOpen,
        editingPromptId: getEditingPromptId(),
        builderLoad: builderLoad ?? null,
      });
    }

    setLastAiEnhanced(false);
    setSaveAsPublic(false);
    setIsAdvancedOpen(false);
    clearPromptDraft();
    clearEditingPromptId();
    localStorage.removeItem("selectedTemplate");
    localStorage.removeItem("selectedPrompt");

    taskAutoFillRef.current = "";
    setPromptData({ ...EMPTY_PROMPT_DATA });
    preserveAiPreviewRef.current = true;
    onPromptChange("");
    onBuilderReset?.();

    toast({
      title: "Builder reset",
      description: canUndo ? "Cleared. Use Undo to restore." : "Fields and preview cleared.",
    });
  };

  const handleUndo = () => {
    if (!undoSnapshot) return;

    const snap = undoSnapshot;
    setPromptData(snap.promptData);
    setLastAiEnhanced(snap.lastAiEnhanced);
    setSaveAsPublic(snap.saveAsPublic);
    setIsAdvancedOpen(snap.isAdvancedOpen);
    preserveAiPreviewRef.current = snap.preserveAiPreview;

    if (snap.editingPromptId) {
      setEditingPromptId(snap.editingPromptId);
    } else {
      clearEditingPromptId();
    }

    onPromptChange(snap.previewContent);
    onBuilderUndo?.({
      previewContent: snap.previewContent,
      builderLoad: snap.builderLoad,
    });
    setUndoSnapshot(null);

    toast({ title: "Restored", description: "Previous builder state recovered." });
  };

  useEffect(() => {
    if (
      promptData.task?.trim() &&
      (promptData.role?.trim() || promptData.tone?.trim() || promptData.context?.trim())
    ) {
      setDetailsOpen(true);
    }
  }, [promptData.task, promptData.role, promptData.tone, promptData.context]);

  return (
    <div className="flex flex-col h-full">
      <KeyboardShortcuts
        onGeneratePrompt={handleGenerateWithAI}
        onSavePrompt={handleSavePrompt}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={handleOpenLoadTemplate}
        onToggleAdvanced={() => setIsAdvancedOpen(!isAdvancedOpen)}
      />

      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border/15 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-foreground/90">Compose</h2>
          <div className="flex items-center gap-0.5">
            {undoSnapshot && (
              <Button variant="ghost" size="sm" onClick={handleUndo} className="h-7 text-xs text-muted-foreground">
                <Undo2 className="w-3 h-3 mr-1" />
                Undo
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs text-muted-foreground">
              Reset
            </Button>
          </div>
        </div>
        <BuilderProgress promptData={promptData} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
        <section className="space-y-3">
          <BuilderField
            label="What should the AI do?"
            hint="Type like a search — suggestions update each word. Tab to finish the top match."
            value={promptData.task}
            onChange={handleTaskChange}
            placeholder="Start typing, e.g. create social media…"
            suggestions={fieldSuggestions.task}
            contextText={builderContext}
            suggestionField="task"
            maxSuggestions={20}
            googleStyle
            multiline
          />
        </section>

        <section className="rounded-2xl border border-border/15 bg-muted/10">
          <button
            type="button"
            onClick={() => setDetailsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-foreground/85">Prompt details</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Role, tone, context, format</p>
            </div>
            {detailsOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </button>

          {detailsOpen && (
            <div className="px-4 pb-4 pt-1 space-y-5 border-t border-border/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <BuilderField
                  label="Role"
                  value={promptData.role}
                  onChange={handleRoleChange}
                  placeholder="Who is the AI?"
                  suggestions={fieldSuggestions.role}
                  contextText={builderContext}
                  suggestionField="role"
                />
                <BuilderField
                  label="Tone"
                  value={promptData.tone}
                  onChange={handleToneChange}
                  placeholder="How should it sound?"
                  suggestions={fieldSuggestions.tone}
                  contextText={builderContext}
                  suggestionField="tone"
                />
              </div>
              <BuilderField
                label="Context"
                hint="Same search-style suggestions — Tab to autocomplete."
                value={promptData.context}
                onChange={handleContextChange}
                placeholder="Start typing context, e.g. multi-platform campaign…"
                suggestions={fieldSuggestions.context}
                contextText={builderContext}
                suggestionField="context"
                maxSuggestions={20}
                googleStyle
                multiline
              />
              <BuilderField
                label="Output format"
                value={promptData.outputFormat}
                onChange={handleOutputFormatChange}
                placeholder="e.g. Markdown, Social posts"
                suggestions={fieldSuggestions.outputFormat}
                contextText={builderContext}
                suggestionField="outputFormat"
              />
            </div>
          )}
        </section>

        <section>
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full flex items-center justify-between py-2 text-xs text-muted-foreground/80 hover:text-muted-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Fine-tune (audience, industry, constraints…)
            </span>
            {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isAdvancedOpen && (
            <div className="mt-3 rounded-2xl border border-border/15 bg-muted/10 px-4 py-4 space-y-5">
              {([
                { label: "Constraints", field: "constraints" as BuilderSuggestionField, value: promptData.constraints, onChange: handleConstraintsChange, placeholder: "Limits or requirements", suggestions: fieldSuggestions.constraints, multiline: true },
                { label: "Response length", field: "responseLength" as BuilderSuggestionField, value: promptData.responseLength, onChange: handleResponseLengthChange, placeholder: "Brief, medium, comprehensive", suggestions: fieldSuggestions.responseLength },
                { label: "Audience", field: "audience" as BuilderSuggestionField, value: promptData.audience, onChange: handleAudienceChange, placeholder: "Who will read this?", suggestions: fieldSuggestions.audience },
                { label: "Industry", field: "industry" as BuilderSuggestionField, value: promptData.industry, onChange: handleIndustryChange, placeholder: "Domain or market", suggestions: fieldSuggestions.industry },
                { label: "Mood", field: "mood" as BuilderSuggestionField, value: promptData.mood, onChange: handleMoodChange, placeholder: "Emotional tone", suggestions: fieldSuggestions.mood },
                { label: "Language", field: "language" as BuilderSuggestionField, value: promptData.language, onChange: handleLanguageChange, placeholder: "Output language", suggestions: fieldSuggestions.language },
                { label: "Complexity", field: "complexity" as BuilderSuggestionField, value: promptData.complexity, onChange: handleComplexityChange, placeholder: "Skill level", suggestions: fieldSuggestions.complexity },
                { label: "Custom variables", field: undefined, value: promptData.customVariables, onChange: handleCustomVariablesChange, placeholder: "key: value pairs", multiline: true },
              ]).map(({ label, field, value, onChange, placeholder, suggestions, multiline }) => (
                <BuilderField
                  key={label}
                  label={label}
                  value={value}
                  onChange={onChange}
                  placeholder={placeholder}
                  suggestions={suggestions}
                  contextText={builderContext}
                  suggestionField={field}
                  multiline={multiline}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-border/15 bg-card/30 space-y-2">
        <Button
          size="sm"
          className="h-10 w-full text-sm font-medium rounded-xl shadow-sm"
          disabled={!hasPreviewablePrompt(promptData) && !currentPrompt.trim()}
          onClick={handleCopyPrompt}
        >
          <Copy className="w-4 h-4 mr-2 opacity-80" />
          Copy prompt
        </Button>

        <div
          className={`flex items-center justify-between gap-3 rounded-xl border border-border/15 bg-muted/10 px-3 py-2 ${
            !isAuthenticated ? "opacity-60" : ""
          }`}
        >
          <Label
            htmlFor="share-to-community"
            className={`text-xs font-normal text-muted-foreground ${
              isAuthenticated ? "cursor-pointer" : "cursor-not-allowed"
            }`}
          >
            Share to community
            {!isAuthenticated && (
              <span className="block text-[10px] mt-0.5">Sign in to publish</span>
            )}
          </Label>
          <Switch
            id="share-to-community"
            checked={saveAsPublic}
            disabled={!isAuthenticated}
            onCheckedChange={setSaveAsPublic}
            aria-label="Share to community when saving"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-9 flex-1 rounded-xl text-xs"
            disabled={!promptData.task || isSaving}
            onClick={handleSavePrompt}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary mr-1.5" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5 opacity-70" />
            )}
            {editingPromptId ? "Update" : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 flex-1 rounded-xl text-xs text-muted-foreground"
            disabled={!promptData.task || isGenerating}
            onClick={handleGenerateWithAI}
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary mr-1.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5 opacity-70" />
            )}
            Enhance (optional)
          </Button>
          <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl px-0 shrink-0">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={handleSaveTemplate}>
                Save field recipe
              </DropdownMenuItem>
              {onOpenGeminiKey && (
                <DropdownMenuItem onClick={onOpenGeminiKey}>
                  Gemini API key
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Template Dialog */}
      <TemplateDialog
        isOpen={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        mode={templateDialogMode}
        currentPromptData={promptData}
        onLoadTemplate={handleTemplateLoaded}
      />
      <GeminiApiDialog isOpen={geminiDialogOpen} onClose={() => setGeminiDialogOpen(false)} />
    </div>
  );
};

export default PromptBuilder;