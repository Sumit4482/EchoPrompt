import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Sparkles, Save, Zap, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, PromptData } from "@/services/api";
import SmartInput from "./SmartInput";
import TemplateDialog from "./TemplateDialog";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { useAI } from "@/contexts/AIContext";
import { useFieldSuggestions } from "@/hooks/useFieldSuggestions";
import { trackPromptDataSuggestions } from "@/lib/suggestionFeedback";
import { BuilderSuggestionField } from "@/constants/builderSuggestions";
import {
  PROMPT_DEFAULTS_UPDATED,
  readPromptDefaults,
  withPromptDefaults,
  type PromptDefaults,
} from "@/lib/promptDefaults";

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

function buildPromptText(data: PromptData): string {
  let prompt = "";
  if (data.role) prompt += `You are a ${data.role}. `;
  if (data.task) prompt += `${data.task}`;
  if (data.context) prompt += `\n\nContext: ${data.context}`;
  if (data.tone) prompt += `\n\nTone: ${data.tone}`;
  if (data.outputFormat) prompt += `\n\nOutput Format: ${data.outputFormat}`;
  if (data.constraints) prompt += `\n\nConstraints: ${data.constraints}`;
  if (data.responseLength) prompt += `\n\nResponse Length: ${data.responseLength}`;
  if (data.audience) prompt += `\n\nTarget Audience: ${data.audience}`;
  if (data.industry) prompt += `\n\nIndustry Context: ${data.industry}`;
  if (data.mood) prompt += `\n\nMood/Emotion: ${data.mood}`;
  if (data.language) prompt += `\n\nLanguage: ${data.language}`;
  if (data.complexity) prompt += `\n\nComplexity Level: ${data.complexity}`;
  if (data.customVariables) prompt += `\n\nCustom Variables: ${data.customVariables}`;
  return prompt;
}

interface PromptBuilderProps {
  currentPrompt: string;
  onPromptChange: (prompt: string) => void;
  templateData?: PromptData;
  onPromptSaved?: () => void;
  onReset?: () => void;
}

const PromptBuilder = ({
  currentPrompt,
  onPromptChange,
  templateData,
  onPromptSaved,
  onReset,
}: PromptBuilderProps) => {
  const location = useLocation();
  const { toast } = useToast();
  const { startGeneration, completeGeneration } = useAI();
  const { suggestions: fieldSuggestions } = useFieldSuggestions();
  const [promptData, setPromptData] = useState<PromptData>({ ...EMPTY_PROMPT_DATA });
  
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDialogMode, setTemplateDialogMode] = useState<"save" | "load">("save");
  /** When true, field edits won't overwrite AI-generated preview text */
  const preserveAiPreviewRef = useRef(false);

  const syncPreviewFromFields = useCallback(
    (data: PromptData) => {
      preserveAiPreviewRef.current = false;
      onPromptChange(buildPromptText(data));
    },
    [onPromptChange],
  );

  // Check for template or prompt data in localStorage on mount (set by Library / MyTemplates)
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

  // Load template data when provided as prop
  useEffect(() => {
    if (templateData) {
      console.log('📝 Loading template data from prop:', templateData);
      // Ensure all values are strings to prevent undefined errors
      const safeTemplateData = {
        role: templateData.role || "",
        task: templateData.task || "",
        context: templateData.context || "",
        tone: templateData.tone || "",
        outputFormat: templateData.outputFormat || "",
        constraints: templateData.constraints || "",
        responseLength: templateData.responseLength || "",
        audience: templateData.audience || "",
        industry: templateData.industry || "",
        mood: templateData.mood || "",
        language: templateData.language || "",
        complexity: templateData.complexity || "",
        customVariables: templateData.customVariables || ""
      };
      setPromptData(safeTemplateData);
      syncPreviewFromFields(safeTemplateData);
    }
  }, [templateData, syncPreviewFromFields]);

  const updatePromptData = useCallback((field: keyof PromptData, value: string) => {
    preserveAiPreviewRef.current = false;
    setPromptData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Rebuild preview from fields when builder inputs change (not after AI generate)
  useEffect(() => {
    if (preserveAiPreviewRef.current) return;
    onPromptChange(buildPromptText(promptData));
  }, [promptData, onPromptChange]);



  // Create stable onChange handlers for each field
  const handleRoleChange = useCallback((value: string) => updatePromptData("role", value), [updatePromptData]);
  const handleTaskChange = useCallback((value: string) => updatePromptData("task", value), [updatePromptData]);
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
        
        completeGeneration(isAISuccess);
        
        toast({
          title: isAISuccess ? "Prompt ready" : "Fallback mode",
          description: isAISuccess
            ? `Focused prompt generated (${response.data.metadata.wordCount} words).`
            : `Used local template — check your Gemini API key.`,
          variant: isAISuccess ? "default" : "destructive",
        });
      } else {
        throw new Error(response.error || "Failed to generate prompt with AI");
      }
    } catch (error) {
      console.error("Error generating prompt with AI:", error);
      completeGeneration(false);
      toast({
        title: "AI Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate with AI. Try local generation instead.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePrompt = async () => {
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

      const response = await apiService.savePrompt({
        content: contentToSave,
        promptData: promptData,
        isPublic: false,
        tags: [promptData.role, promptData.industry, promptData.outputFormat].filter(Boolean)
      });
      
      if (response.success) {
        trackPromptDataSuggestions(promptData);
        toast({
          title: "Prompt Saved",
          description: "Saved to My Prompts.",
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
    preserveAiPreviewRef.current = false;
    setPromptData({ ...EMPTY_PROMPT_DATA });
    setIsAdvancedOpen(false);
    onPromptChange("");
    onReset?.();
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
                Essential Fields
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-6 text-xs text-muted-foreground"
              >
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Task</Label>
              <SmartInput
                value={promptData.task}
                onChange={handleTaskChange}
                placeholder="Describe the specific task you want the AI to perform..."
                suggestions={fieldSuggestions.task}
                suggestionField="task"
                multiline
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</Label>
              <SmartInput
                value={promptData.role}
                onChange={handleRoleChange}
                placeholder="e.g., Software Engineer, Software Architect..."
                suggestions={fieldSuggestions.role}
                suggestionField="role"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Context</Label>
              <SmartInput
                value={promptData.context}
                onChange={handleContextChange}
                placeholder="Background information or constraints..."
                suggestions={fieldSuggestions.context}
                suggestionField="context"
                multiline
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tone</Label>
              <SmartInput
                value={promptData.tone}
                onChange={handleToneChange}
                placeholder="e.g., Professional, Casual, Friendly..."
                suggestions={fieldSuggestions.tone}
                suggestionField="tone"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Output Format</Label>
              <SmartInput
                value={promptData.outputFormat}
                onChange={handleOutputFormatChange}
                placeholder="e.g., Markdown, JSON, Bullet Points..."
                suggestions={fieldSuggestions.outputFormat}
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
                  <SmartInput value={value} onChange={onChange} placeholder={placeholder} suggestions={suggestions} suggestionField={field} multiline={multiline} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 px-4 py-3 border-t border-border/20 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleSaveTemplate}
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Save Template
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
            Save to My Prompts
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            disabled={!promptData.task || isGenerating}
            onClick={handleGenerateWithAI}
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            Generate with AI
          </Button>
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
    </div>
  );
};

export default PromptBuilder;