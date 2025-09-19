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
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDialogMode, setTemplateDialogMode] = useState<'save' | 'load'>('save');
  const [aiAutoPopulate, setAiAutoPopulate] = useState(true);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(new Set());

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
    // Clear auto-populate indicator when user manually edits a field
    setAutoPopulatedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
  }, []);

  // Generate prompt text whenever promptData changes
  useEffect(() => {
    generatePromptText(promptData);
  }, [promptData]);

  // Auto-populate fields based on task when AI Auto Complete is enabled
  const autoPopulateFields = useCallback(async (task: string) => {
    console.log('🔮 autoPopulateFields called with:', { task, aiAutoPopulate, taskLength: task.length });
    if (!aiAutoPopulate || !task || task.length < 10) {
      console.log('🔮 Skipping auto-populate due to conditions');
      return;
    }
    
    setIsAutoPopulating(true);
    try {
      console.log('🔮 Calling auto-populate API for task:', task);
      // Call the new auto-populate API endpoint
      const response = await apiService.getAutoPopulate(task);
      console.log('🔮 Auto-populate API response:', response);
      
      if (response.success && response.data?.suggestions) {
        const suggestions = response.data.suggestions;
        console.log('🔮 Auto-populate suggestions received:', suggestions);
        
        // Use functional state update to get current values
        setPromptData(prev => {
          console.log('🔮 Current form state:', prev);
          const updates: Partial<PromptData> = {};
          
          // Only update empty fields to avoid overwriting user input
          if (suggestions.role && !prev.role.trim()) {
            console.log('🔮 Adding role:', suggestions.role);
            updates.role = suggestions.role;
          } else {
            console.log('🔮 Skipping role - already has value:', prev.role);
          }
          
          if (suggestions.tone && !prev.tone.trim()) {
            console.log('🔮 Adding tone:', suggestions.tone);
            updates.tone = suggestions.tone;
          } else {
            console.log('🔮 Skipping tone - already has value:', prev.tone);
          }
          
          if (suggestions.outputFormat && !prev.outputFormat.trim()) {
            console.log('🔮 Adding outputFormat:', suggestions.outputFormat);
            updates.outputFormat = suggestions.outputFormat;
          } else {
            console.log('🔮 Skipping outputFormat - already has value:', prev.outputFormat);
          }
          
          if (suggestions.context && !prev.context.trim()) {
            console.log('🔮 Adding context:', suggestions.context);
            updates.context = suggestions.context;
          } else {
            console.log('🔮 Skipping context - already has value:', prev.context);
          }
          
          if (suggestions.audience && !prev.audience.trim()) {
            console.log('🔮 Adding audience:', suggestions.audience);
            updates.audience = suggestions.audience;
          } else {
            console.log('🔮 Skipping audience - already has value:', prev.audience);
          }
          
          if (suggestions.industry && !prev.industry.trim()) {
            console.log('🔮 Adding industry:', suggestions.industry);
            updates.industry = suggestions.industry;
          } else {
            console.log('🔮 Skipping industry - already has value:', prev.industry);
          }
          
          console.log('🔮 Final updates to apply:', updates);
          
          // Apply updates if any fields were suggested
          if (Object.keys(updates).length > 0) {
            setAutoPopulatedFields(new Set(Object.keys(updates)));
            toast({
              title: "🤖 AI Auto Complete",
              description: `Populated ${Object.keys(updates).length} field(s) based on your task`,
              duration: 3000,
            });
            console.log('🔮 Returning updated state:', { ...prev, ...updates });
            return { ...prev, ...updates };
          } else {
            console.log('🔮 No updates to apply - all fields already filled or no suggestions');
          }
          
          return prev;
        });
      }
    } catch (error) {
      console.error('🔮 Auto-populate error:', error);
      console.error('🔮 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      // Show error for debugging
      toast({
        title: "❌ Auto-populate Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsAutoPopulating(false);
    }
  }, [aiAutoPopulate, toast]);

  // Trigger auto-populate when task changes
  useEffect(() => {
    console.log('🔮 Auto-populate effect triggered:', { 
      aiAutoPopulate, 
      taskLength: promptData.task.length, 
      task: promptData.task 
    });
    
    if (aiAutoPopulate && promptData.task && promptData.task.length >= 10) {
      console.log('🔮 Setting auto-populate timeout...');
      const timeoutId = setTimeout(() => {
        console.log('🔮 Executing auto-populate for task:', promptData.task);
        autoPopulateFields(promptData.task);
      }, 2000); // Wait 2 seconds after user stops typing
      
      return () => {
        console.log('🔮 Clearing auto-populate timeout');
        clearTimeout(timeoutId);
      };
    }
  }, [promptData.task, autoPopulateFields, aiAutoPopulate]);

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

  const generatePromptText = async (data: PromptData) => {
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

    setIsGenerating(true);
    try {
      const response = await apiService.generatePrompt(promptData, true);
      if (response.success && response.data) {
        onPromptChange(response.data.prompt.content);
        const aiMessage = response.message?.includes('🤖 with Gemini AI') ? 'with Gemini AI' : 'with AI enhancement';
        toast({
          title: "🤖 AI Success!",
          description: `Generated optimized prompt ${aiMessage} (${response.data.metadata.wordCount} words)`,
        });
      } else {
        throw new Error(response.error || "Failed to generate prompt with AI");
      }
    } catch (error) {
      console.error("Error generating prompt with AI:", error);
      toast({
        title: "AI Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate with AI. Try local generation instead.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLocal = async () => {
    if (!promptData.task) {
      toast({
        title: "Error",
        description: "Please enter a task description before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiService.generatePromptLocal(promptData, true);
      if (response.success && response.data) {
        onPromptChange(response.data.prompt.content);
        toast({
          title: "📝 Local Success!",
          description: `Generated prompt using local templates (${response.data.metadata.wordCount} words)`,
        });
      } else {
        throw new Error(response.error || "Failed to generate local prompt");
      }
    } catch (error) {
      console.error("Error generating local prompt:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate local prompt.",
        variant: "destructive",
      });
      // Fallback to client-side generation
      generatePromptText(promptData);
      toast({
        title: "📝 Fallback Success!",
        description: "Generated prompt using client-side templates",
      });
    } finally {
      setIsGenerating(false);
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
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="ai-auto-populate" className="text-sm font-medium cursor-pointer flex items-center">
                    <Wand2 className="w-4 h-4 mr-1 text-primary" />
                    AI Auto Complete
                  </Label>
                  <Switch
                    id="ai-auto-populate"
                    checked={aiAutoPopulate}
                    onCheckedChange={setAiAutoPopulate}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                  {isAutoPopulating && (
                  <div className="flex items-center text-primary">
                    <Sparkles className="w-4 h-4 mr-1 animate-pulse" />
                    <span className="text-xs font-medium">Populating...</span>
                  </div>
                )}
                {/* Debug button - remove later */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔮 Manual auto-populate test');
                    if (promptData.task) {
                      autoPopulateFields(promptData.task);
                    }
                  }}
                  className="h-6 text-xs"
                >
                  Test Auto-Fill
                </Button>
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
                    setAutoPopulatedFields(new Set());
                  }}
                  className="h-6 text-xs"
                >
                  Clear Fields
                </Button>
              </div>
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
                fieldName="task"
              />
            </div>

            {/* Role */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                Role 
                <Badge variant="outline" className="ml-2 text-xs border-primary/30 text-primary/80">
                  Who is the AI?
                </Badge>
                {autoPopulatedFields.has('role') && (
                  <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700 border-green-300">
                    <Wand2 className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                )}
              </Label>
              <SmartInput
                value={promptData.role}
                onChange={handleRoleChange}
                placeholder="e.g., Software Engineer, Marketing Expert..."
                suggestions={roleOptions}
                fieldName="role"
              />
            </div>

            {/* Context */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                Context 
                <Badge variant="outline" className="ml-2 text-xs border-primary/30 text-primary/80">
                  Background info
                </Badge>
                {autoPopulatedFields.has('context') && (
                  <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700 border-green-300">
                    <Wand2 className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                )}
              </Label>
              <SmartInput
                value={promptData.context}
                onChange={handleContextChange}
                placeholder="Provide any background information or constraints..."
                multiline
                fieldName="context"
              />
            </div>

            {/* Tone */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                Tone/Style 
                <Badge variant="outline" className="ml-2 text-xs border-primary/30 text-primary/80">
                  How should it sound?
                </Badge>
                {autoPopulatedFields.has('tone') && (
                  <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700 border-green-300">
                    <Wand2 className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                )}
              </Label>
              <SmartInput
                value={promptData.tone}
                onChange={handleToneChange}
                placeholder="Select or type a tone..."
                suggestions={toneOptions}
                fieldName="tone"
              />
            </div>

            {/* Output Format */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                Output Format 
                <Badge variant="outline" className="ml-2 text-xs border-primary/30 text-primary/80">
                  Response structure
                </Badge>
                {autoPopulatedFields.has('outputFormat') && (
                  <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700 border-green-300">
                    <Wand2 className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                )}
              </Label>
              <SmartInput
                value={promptData.outputFormat}
                onChange={handleOutputFormatChange}
                placeholder="Select or type a format..."
                suggestions={outputFormatOptions}
                fieldName="outputFormat"
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
            <p className="text-sm text-muted-foreground">Choose your preferred generation method for optimal results</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Generation Button */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
              <Button 
                className="relative w-full h-20 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-white font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:hover:scale-100 flex flex-col py-4 border-0"
                disabled={!promptData.task || isGenerating}
                onClick={handleGenerateWithAI}
              >
                <div className="flex items-center mb-2">
                  <Bot className="w-7 h-7 mr-3" />
                  {isGenerating ? "Generating..." : "AI Generation"}
                </div>
                <span className="text-sm text-blue-100 font-medium">Powered by Gemini AI</span>
                <div className="absolute bottom-2 right-3 text-xs text-blue-200/70">
                  🚀 Enhanced
                </div>
              </Button>
            </div>

            {/* Local Generation Button */}
            <div className="group relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
              <Button 
                variant="outline"
                className="relative w-full h-20 border-2 border-primary/40 hover:border-primary/60 hover:bg-primary/10 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:hover:scale-100 flex flex-col py-4 bg-gradient-to-br from-background to-background/80"
                disabled={!promptData.task || isGenerating}
                onClick={handleGenerateLocal}
              >
                <div className="flex items-center mb-2">
                  <FileText className="w-7 h-7 mr-3" />
                  {isGenerating ? "Generating..." : "Local Templates"}
                </div>
                <span className="text-sm text-muted-foreground font-medium">Fast & Reliable</span>
                <div className="absolute bottom-2 right-3 text-xs text-muted-foreground/70">
                  ⚡ Instant
                </div>
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              💡 <strong>AI Generation:</strong> Advanced, context-aware prompts with optimization
              <br />
              📝 <strong>Local Templates:</strong> Quick generation using predefined patterns
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