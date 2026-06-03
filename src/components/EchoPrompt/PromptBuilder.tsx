import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Sparkles, Save, Zap, Settings, Undo2, Copy } from "lucide-react";
import { buildPromptText, hasPreviewablePrompt } from "@/lib/buildPromptText";
import { useToast } from "@/hooks/use-toast";
import { apiService, PromptData } from "@/services/api";
import SmartInput from "./SmartInput";
import TemplateDialog from "./TemplateDialog";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { useAI } from "@/contexts/AIContext";
import { useContextualFieldSuggestions } from "@/hooks/useContextualFieldSuggestions";
import { findTaskBundleMatch } from "@/lib/contextualSuggestions";
import { fillEmptyFromBundle, applyTaskFieldBundle } from "@/constants/taskFieldBundles";
import { trackPromptDataSuggestions } from "@/lib/suggestionFeedback";
import { BuilderSuggestionField } from "@/constants/builderSuggestions";
import {
  PROMPT_DEFAULTS_UPDATED,
  readPromptDefaults,
  withPromptDefaults,
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

  useEffect(() => {
    setPromptData((prev) =>
      prev.task || prev.tone || prev.outputFormat ? prev : withPromptDefaults(prev),
    );
  }, []);

  // Apply new defaults immediately when settings are saved
  useEffect(() => {
    const onDefaultsUpdated = (event: Event) => {
      const defaults = (event as CustomEvent<PromptDefaults>).detail ?? readPromptDefaults();
      setPromptData((prev) => ({
        ...prev,
        tone: defaults.defaultTone,
        outputFormat: defaults.defaultOutputFormat,
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
    setPromptData((prev) =>
      withPromptDefaults(applyTaskFieldBundle(prev, value)),
    );
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
      setPromptData((prev) => withPromptDefaults(fillEmptyFromBundle(prev, bundle)));
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
            ? ` ${hosted.remaining} free AI runs left today.`
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
        description: "Generate is free as a guest; saving requires an account.",
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
            ? "Saved and shared to Community."
            : "Saved to My Prompts.",
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
    if (!promptData.task) {
      toast({
        title: "Error",
        description: "Please enter a task before saving as template",
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
    const fresh = withPromptDefaults({ ...EMPTY_PROMPT_DATA });
    setPromptData(fresh);
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

  return (
    <div className="flex flex-col h-full">
      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onGeneratePrompt={handleGenerateWithAI}
        onSavePrompt={handleSavePrompt}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={handleOpenLoadTemplate}
        onToggleAdvanced={() => setIsAdvancedOpen(!isAdvancedOpen)}
      />
      
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Basic Fields */}
        <Card className="border-border/40">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Build your prompt
              </CardTitle>
              <div className="flex items-center gap-1">
                {undoSnapshot && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUndo}
                    className="h-6 text-xs text-primary"
                  >
                    <Undo2 className="w-3 h-3 mr-1" />
                    Undo
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-6 text-xs text-muted-foreground"
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "task", label: "Task" },
                  { key: "role", label: "Role" },
                  { key: "context", label: "Context" },
                  { key: "tone", label: "Tone" },
                  { key: "outputFormat", label: "Format" },
                ] as const
              ).map(({ key, label }) => (
                <Badge
                  key={key}
                  variant={(promptData[key] as string)?.trim() ? "default" : "outline"}
                  className="text-[10px] px-2 py-0 font-normal"
                >
                  {label}
                </Badge>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground uppercase tracking-wide">
                Task <span className="text-primary font-normal normal-case">(start here)</span>
              </Label>
              <SmartInput
                value={promptData.task}
                onChange={handleTaskChange}
                placeholder="Type e.g. social media, blog, code review…"
                suggestions={fieldSuggestions.task}
                contextText={builderContext}
                suggestionField="task"
                maxSuggestions={14}
                multiline
              />
              <p className="text-[11px] text-muted-foreground">
                Suggestions filter as you type. Related fields auto-fill when we recognize the topic.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</Label>
                <SmartInput
                  value={promptData.role}
                  onChange={handleRoleChange}
                  placeholder="Who should the AI act as?"
                  suggestions={fieldSuggestions.role}
                  contextText={builderContext}
                  suggestionField="role"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tone</Label>
                <SmartInput
                  value={promptData.tone}
                  onChange={handleToneChange}
                  placeholder="How should it sound?"
                  suggestions={fieldSuggestions.tone}
                  contextText={builderContext}
                  suggestionField="tone"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Context</Label>
              <SmartInput
                value={promptData.context}
                onChange={handleContextChange}
                placeholder="Background or situation…"
                suggestions={fieldSuggestions.context}
                contextText={builderContext}
                suggestionField="context"
                multiline
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Output Format</Label>
              <SmartInput
                value={promptData.outputFormat}
                onChange={handleOutputFormatChange}
                placeholder="What shape should the answer take?"
                suggestions={fieldSuggestions.outputFormat}
                contextText={builderContext}
                suggestionField="outputFormat"
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Fields Toggle */}
        <Button
          variant="ghost"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full justify-between h-9 text-xs text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/60 rounded-lg px-3"
        >
          <span className="flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            Advanced Options
          </span>
          {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>

        {/* Advanced Fields */}
        {isAdvancedOpen && (
          <Card className="border-border/40 animate-slide-up">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                Advanced Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {([
                { label: "Constraints", field: "constraints" as BuilderSuggestionField, value: promptData.constraints, onChange: handleConstraintsChange, placeholder: "e.g., TypeScript strict, Include unit tests...", suggestions: fieldSuggestions.constraints, multiline: true },
                { label: "Response Length", field: "responseLength" as BuilderSuggestionField, value: promptData.responseLength, onChange: handleResponseLengthChange, placeholder: "Select or specify length...", suggestions: fieldSuggestions.responseLength },
                { label: "Target Audience", field: "audience" as BuilderSuggestionField, value: promptData.audience, onChange: handleAudienceChange, placeholder: "e.g., Senior engineers, QA team...", suggestions: fieldSuggestions.audience },
                { label: "Industry", field: "industry" as BuilderSuggestionField, value: promptData.industry, onChange: handleIndustryChange, placeholder: "e.g., B2B SaaS, FinTech...", suggestions: fieldSuggestions.industry },
                { label: "Mood", field: "mood" as BuilderSuggestionField, value: promptData.mood, onChange: handleMoodChange, placeholder: "e.g., Analytical, Urgent (incident)...", suggestions: fieldSuggestions.mood },
                { label: "Language", field: "language" as BuilderSuggestionField, value: promptData.language, onChange: handleLanguageChange, placeholder: "e.g., TypeScript, Python...", suggestions: fieldSuggestions.language },
                { label: "Complexity", field: "complexity" as BuilderSuggestionField, value: promptData.complexity, onChange: handleComplexityChange, placeholder: "e.g., Senior engineer, Architecture level...", suggestions: fieldSuggestions.complexity },
                { label: "Custom Variables", field: undefined, value: promptData.customVariables, onChange: handleCustomVariablesChange, placeholder: "e.g., company_name: Acme Corp...", multiline: true },
              ]).map(({ label, field, value, onChange, placeholder, suggestions, multiline }) => (
                <div key={label} className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
                  <SmartInput
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    suggestions={suggestions}
                    contextText={builderContext}
                    suggestionField={field}
                    multiline={multiline}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 px-4 py-3 border-t border-border/20 space-y-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={saveAsPublic}
            onChange={(e) => setSaveAsPublic(e.target.checked)}
          />
          Share to Community when saving
        </label>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleSaveTemplate}
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Save Template
        </Button>
        <Button
          size="sm"
          className="h-9 w-full text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          disabled={!hasPreviewablePrompt(promptData) && !currentPrompt.trim()}
          onClick={handleCopyPrompt}
        >
          <Copy className="w-3.5 h-3.5 mr-1.5" />
          Copy prompt for ChatGPT / Claude
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs flex-1"
            disabled={!promptData.task || isSaving}
            onClick={handleSavePrompt}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary mr-1.5" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {editingPromptId ? "Update" : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs flex-1 border-dashed"
            disabled={!promptData.task || isGenerating}
            onClick={handleGenerateWithAI}
            title="Optional — rewrites preview with Gemini"
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary mr-1.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            Enhance with AI
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground">
          Structured preview is enough for most tools · AI enhance is optional
        </p>
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