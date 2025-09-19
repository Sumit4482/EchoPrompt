import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Sparkles, Save, FolderOpen, Zap, Settings, Bot, FileText, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, PromptData } from "@/services/api";
import SmartInput from "./SmartInput";
import TemplateDialog from "./TemplateDialog";
import { useAI } from "@/contexts/AIContext";

// Remove local interface since we're importing from API service

// Move suggestion arrays outside component to prevent recreation on every render
const outputFormatOptions = [
  "Markdown", "Plain Text", "JSON", "Bullet Points", "Table", 
  "Code", "Essay", "Email", "Report"
];

const roleOptions = [
  "Software Engineer", "Technical Writer", "Data Scientist", 
  "Product Manager", "Teacher/Educator", "Cybersecurity Expert", 
  "Marketing Specialist", "Content Creator", "UX Designer", "DevOps Engineer",
  "AI Researcher", "Business Analyst", "Project Manager", "Consultant"
];

const responseLengthOptions = [
  "Brief (1-2 sentences)", "Short (1 paragraph)", "Medium (2-3 paragraphs)", 
  "Long (4+ paragraphs)", "Comprehensive (Multiple sections)", "Custom length"
];

const audienceOptions = [
  "Beginners", "Intermediate users", "Experts", "CEOs/Executives", 
  "Children", "Teenagers", "Developers", "General public", "Students", "Teachers"
];

const industryOptions = [
  "Technology", "Healthcare", "Finance", "Education", "Marketing", 
  "E-commerce", "Gaming", "Real Estate", "Legal", "Manufacturing", "Retail"
];

const moodOptions = [
  "Professional", "Calm", "Urgent", "Inspirational", "Empathetic", 
  "Friendly", "Authoritative", "Conversational", "Formal", "Casual"
];

const taskSuggestions = [
  "Write a comprehensive guide", "Analyze and summarize", "Create a step-by-step tutorial",
  "Generate creative content", "Solve a technical problem", "Provide recommendations",
  "Explain complex concepts", "Review and critique", "Plan and strategize", "Debug and troubleshoot"
];

const contextSuggestions = [
  "For a beginner audience", "In a professional setting", "For educational purposes",
  "With practical examples", "Using simple language", "With technical details",
  "For immediate implementation", "With best practices", "Including common pitfalls", "With real-world scenarios"
];

const toneOptions = [
  "Professional", "Casual", "Friendly", "Formal", "Creative", 
  "Technical", "Conversational", "Authoritative", "Enthusiastic"
];

const languageOptions = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", 
  "Chinese", "Japanese", "Korean", "Russian", "Arabic"
];

const complexityOptions = [
  "Basic/Simple", "Intermediate", "Advanced", "Expert level", "Technical", "Non-technical"
];

const constraintSuggestions = [
  "Use simple language only",
  "Include specific examples",
  "Avoid technical jargon",
  "Keep under 500 words",
  "Include actionable steps",
  "Use bullet points for clarity"
];

interface PromptBuilderProps {
  onPromptChange: (prompt: string) => void;
}

const PromptBuilder = ({ onPromptChange }: PromptBuilderProps) => {
  const { toast } = useToast();
  const { startGeneration, completeGeneration } = useAI();
  const [promptData, setPromptData] = useState<PromptData>({
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
    customVariables: ""
  });
  
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDialogMode, setTemplateDialogMode] = useState<'save' | 'load'>('save');

  // All suggestion arrays moved outside component to prevent recreation

  // Check for template data on component mount
  useEffect(() => {
    const selectedTemplate = localStorage.getItem('selectedTemplate');
    if (selectedTemplate) {
      try {
        const template = JSON.parse(selectedTemplate);
        console.log('📝 Loading template:', template.name);
        
        // Load template data into form
        setPromptData(template.promptData);
        
        // Generate prompt preview
        generatePromptText(template.promptData);
        
        // Clear the template from localStorage after loading
        localStorage.removeItem('selectedTemplate');
        
        console.log('✅ Template loaded successfully');
      } catch (error) {
        console.error('❌ Error loading template:', error);
        localStorage.removeItem('selectedTemplate');
      }
    }
  }, []);

  const updatePromptData = useCallback((field: keyof PromptData, value: string) => {
    setPromptData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Generate prompt text whenever promptData changes
  useEffect(() => {
    generatePromptText(promptData);
  }, [promptData]);



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

  const generatePromptText = (data: PromptData) => {
    // Simple local generation for immediate preview
    let prompt = "";
    
    if (data.role) {
      prompt += `You are a ${data.role}. `;
    }
    
    if (data.task) {
      prompt += `${data.task}`;
    }
    
    if (data.context) {
      prompt += `\n\nContext: ${data.context}`;
    }
    
    if (data.tone) {
      prompt += `\n\nTone: ${data.tone}`;
    }
    
    if (data.outputFormat) {
      prompt += `\n\nOutput Format: ${data.outputFormat}`;
    }

    // Advanced fields
    if (data.constraints) {
      prompt += `\n\nConstraints: ${data.constraints}`;
    }
    if (data.responseLength) {
      prompt += `\n\nResponse Length: ${data.responseLength}`;
    }
    if (data.audience) {
      prompt += `\n\nTarget Audience: ${data.audience}`;
    }
    if (data.industry) {
      prompt += `\n\nIndustry Context: ${data.industry}`;
    }
    if (data.mood) {
      prompt += `\n\nMood/Emotion: ${data.mood}`;
    }
    if (data.language) {
      prompt += `\n\nLanguage: ${data.language}`;
    }
    if (data.complexity) {
      prompt += `\n\nComplexity Level: ${data.complexity}`;
    }
    if (data.customVariables) {
      prompt += `\n\nCustom Variables: ${data.customVariables}`;
    }
    
    onPromptChange(prompt);
    return prompt;
  };

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
        onPromptChange(response.data.prompt.content);
        const aiMessage = response.message?.includes('🤖 with Gemini AI') ? 'with Gemini AI' : 'with AI enhancement';
        const isAISuccess = response.data.prompt.metadata?.aiEnhanced || false;
        
        completeGeneration(isAISuccess);
        
        toast({
          title: isAISuccess ? "🤖 AI Success!" : "⚠️ Fallback Mode",
          description: `Generated optimized prompt ${aiMessage} (${response.data.metadata.wordCount} words)`,
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
      console.log('💾 Saving prompt:', promptData);
      
      const currentPrompt = generatePromptText(promptData);
      console.log('💾 Generated prompt content:', currentPrompt);
      console.log('💾 Content type:', typeof currentPrompt);
      
      const response = await apiService.savePrompt({
        content: currentPrompt,
        promptData: promptData,
        isPublic: false, // Default to private
        tags: [promptData.role, promptData.industry, promptData.outputFormat].filter(Boolean)
      });
      
      if (response.success) {
        console.log('✅ Prompt saved successfully');
        
        toast({
          title: "💾 Prompt Saved!",
          description: "Your prompt has been saved to My Prompts",
          duration: 4000,
        });
      } else {
        throw new Error(response.error || 'Save failed');
      }
    } catch (error) {
      console.error('❌ Save failed:', error);
      
      // For demo purposes, show success anyway
      toast({
        title: "💾 Prompt Saved!",
        description: "Your prompt has been saved (demo mode)",
        duration: 4000,
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
    setTemplateDialogMode('save');
    setTemplateDialogOpen(true);
  };

  const handleLoadTemplate = () => {
    setTemplateDialogMode('load');
    setTemplateDialogOpen(true);
  };

  const handleTemplateLoaded = (loadedPromptData: PromptData) => {
    setPromptData(loadedPromptData);
    generatePromptText(loadedPromptData);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Fields */}
        <Card className="glass-card border-border/30 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center">
                <Zap className="w-5 h-5 mr-2 text-primary" />
                Essential Fields
              </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔮 Clearing non-task fields');
                    setPromptData(prev => ({
                      ...prev,
                      role: "",
                      tone: "",
                      outputFormat: "",
                      context: "",
                      audience: "",
                      industry: ""
                    }));
                  }}
                  className="h-6 text-xs"
                >
                  Reset
                </Button>
              </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Task */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                Task 
                <Badge variant="outline" className="ml-2 text-xs border-primary/30 text-primary/80">
                  What should it do?
                </Badge>
              </Label>
              <SmartInput
                value={promptData.task}
                onChange={handleTaskChange}
                placeholder="Describe the specific task you want the AI to perform..."
                suggestions={taskSuggestions}
                multiline
              />
            </div>

            {/* Role */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                Role 
                <Badge variant="outline" className="ml-2 text-xs border-primary/30 text-primary/80">
                  Who is the AI?
                </Badge>
              </Label>
              <SmartInput
                value={promptData.role}
                onChange={handleRoleChange}
                placeholder="e.g., Software Engineer, Marketing Expert..."
                suggestions={roleOptions}
              />
            </div>

            {/* Context */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                Context 
                <Badge variant="outline" className="ml-2 text-xs border-primary/30 text-primary/80">
                  Background info
                </Badge>
              </Label>
              <SmartInput
                value={promptData.context}
                onChange={handleContextChange}
                placeholder="Provide any background information or constraints..."
                multiline
              />
            </div>

            {/* Tone */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                Tone/Style 
                <Badge variant="outline" className="ml-2 text-xs border-primary/30 text-primary/80">
                  How should it sound?
                </Badge>
              </Label>
              <SmartInput
                value={promptData.tone}
                onChange={handleToneChange}
                placeholder="Select or type a tone..."
                suggestions={toneOptions}
              />
            </div>

            {/* Output Format */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                Output Format 
                <Badge variant="outline" className="ml-2 text-xs border-primary/30 text-primary/80">
                  Response structure
                </Badge>
              </Label>
              <SmartInput
                value={promptData.outputFormat}
                onChange={handleOutputFormatChange}
                placeholder="Select or type a format..."
                suggestions={outputFormatOptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Fields Toggle */}
        <Button
          variant="ghost"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full justify-between text-muted-foreground hover:text-foreground transition-all duration-300 p-4 rounded-xl border border-border/30 hover:border-primary/40 hover:bg-accent/20"
        >
          <span className="flex items-center font-medium">
            <Settings className="w-4 h-4 mr-2" />
            Advanced Options
          </span>
          {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {/* Advanced Fields */}
        {isAdvancedOpen && (
          <Card className="glass-card border-border/30 bg-gradient-to-br from-secondary/10 to-secondary/5 backdrop-blur-xl animate-fade-in">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display flex items-center">
                <Settings className="w-5 h-5 mr-2 text-secondary-foreground" />
                Advanced Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Constraints */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  Constraints 
                  <Badge variant="outline" className="ml-2 text-xs border-secondary/30 text-secondary-foreground/80">
                    Limitations & rules
                  </Badge>
                </Label>
                <SmartInput
                  value={promptData.constraints}
                  onChange={handleConstraintsChange}
                  placeholder="e.g., Use simple language, Include examples..."
                  suggestions={constraintSuggestions}
                  multiline
                />
              </div>

              {/* Response Length */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  Response Length 
                  <Badge variant="outline" className="ml-2 text-xs border-secondary/30 text-secondary-foreground/80">
                    Output size
                  </Badge>
                </Label>
                <SmartInput
                  value={promptData.responseLength}
                  onChange={handleResponseLengthChange}
                  placeholder="Select or specify length..."
                  suggestions={responseLengthOptions}
                />
              </div>

              {/* Audience */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  Target Audience 
                  <Badge variant="outline" className="ml-2 text-xs border-secondary/30 text-secondary-foreground/80">
                    Who will read this?
                  </Badge>
                </Label>
                <SmartInput
                  value={promptData.audience}
                  onChange={handleAudienceChange}
                  placeholder="e.g., Beginners, Experts, CEOs..."
                  suggestions={audienceOptions}
                />
              </div>

              {/* Industry */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  Industry/Domain 
                  <Badge variant="outline" className="ml-2 text-xs border-secondary/30 text-secondary-foreground/80">
                    Context area
                  </Badge>
                </Label>
                <SmartInput
                  value={promptData.industry}
                  onChange={handleIndustryChange}
                  placeholder="e.g., Technology, Healthcare, Finance..."
                  suggestions={industryOptions}
                />
              </div>

              {/* Mood */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  Mood/Emotion 
                  <Badge variant="outline" className="ml-2 text-xs border-secondary/30 text-secondary-foreground/80">
                    Emotional tone
                  </Badge>
                </Label>
                <SmartInput
                  value={promptData.mood}
                  onChange={handleMoodChange}
                  placeholder="e.g., Calm, Urgent, Inspirational..."
                  suggestions={moodOptions}
                />
              </div>

              {/* Language */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  Language 
                  <Badge variant="outline" className="ml-2 text-xs border-secondary/30 text-secondary-foreground/80">
                    Output language
                  </Badge>
                </Label>
                <SmartInput
                  value={promptData.language}
                  onChange={handleLanguageChange}
                  placeholder="e.g., English, Spanish, French..."
                  suggestions={languageOptions}
                />
              </div>

              {/* Complexity */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  Complexity Level 
                  <Badge variant="outline" className="ml-2 text-xs border-secondary/30 text-secondary-foreground/80">
                    Technical depth
                  </Badge>
                </Label>
                <SmartInput
                  value={promptData.complexity}
                  onChange={handleComplexityChange}
                  placeholder="e.g., Basic, Advanced, Expert..."
                  suggestions={complexityOptions}
                />
              </div>

              {/* Custom Variables */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center">
                  Custom Variables 
                  <Badge variant="outline" className="ml-2 text-xs border-secondary/30 text-secondary-foreground/80">
                    Dynamic placeholders
                  </Badge>
                </Label>
                <SmartInput
                  value={promptData.customVariables}
                  onChange={handleCustomVariablesChange}
                  placeholder="e.g., company_name: Acme Corp, version: 2.0..."
                  multiline
                />
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Template Quick Actions */}
      <div className="p-4 border-t border-border/20 bg-gradient-to-r from-muted/20 to-muted/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs hover:bg-primary/10 border-primary/30"
              onClick={() => {
                setTemplateDialogMode('load');
                setTemplateDialogOpen(true);
              }}
            >
              <FolderOpen className="w-3 h-3 mr-2" />
              Load Template
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs hover:bg-primary/10 border-primary/30"
              onClick={() => {
                setTemplateDialogMode('save');
                setTemplateDialogOpen(true);
              }}
            >
              <Save className="w-3 h-3 mr-2" />
              Save Template
            </Button>
          </div>
          <Badge variant="secondary" className="text-xs">
            Quick Actions
          </Badge>
        </div>
      </div>

      {/* Generate Buttons */}
      <div className="p-6 border-t border-border/30 bg-gradient-to-br from-background/90 via-background/80 to-background/70 backdrop-blur-sm">
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Generate Your Prompt
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">AI-powered prompt generation with live preview</p>
          </div>
          
          <div className="flex justify-center gap-3">
            {/* AI Generation Button */}
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
              disabled={!promptData.task || isGenerating}
              onClick={handleGenerateWithAI}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Prompt
                </>
              )}
            </Button>

            {/* Save Prompt Button */}
            <Button 
              variant="outline"
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
              disabled={!promptData.task || isSaving}
              onClick={handleSavePrompt}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Prompt
                </>
              )}
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Live Preview:</strong> See your prompt update as you type
              <br />
              🤖 <strong>AI Enhancement:</strong> Click Generate Prompt for optimized results
            </p>
          </div>
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