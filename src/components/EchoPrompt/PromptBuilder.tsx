import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Sparkles, Save, FolderOpen, Zap, Settings } from "lucide-react";
import SmartInput from "./SmartInput";

interface PromptData {
  role: string;
  task: string;
  context: string;
  tone: string;
  outputFormat: string;
  // Advanced fields
  constraints: string;
  responseLength: string;
  audience: string;
  industry: string;
  mood: string;
  language: string;
  complexity: string;
  customVariables: string;
}

interface PromptBuilderProps {
  onPromptChange: (prompt: string) => void;
}

const PromptBuilder = ({ onPromptChange }: PromptBuilderProps) => {
  const [promptData, setPromptData] = useState<PromptData>({
    role: "",
    task: "",
    context: "",
    tone: "",
    outputFormat: "",
    // Advanced fields
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

  const toneOptions = [
    "Professional", "Casual", "Friendly", "Formal", "Creative", 
    "Technical", "Conversational", "Authoritative", "Enthusiastic"
  ];

  const outputFormatOptions = [
    "Markdown", "Plain Text", "JSON", "Bullet Points", "Table", 
    "Code", "Essay", "Email", "Report"
  ];

  // Suggestion data
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
    "Confident", "Cautious", "Optimistic", "Analytical", "Creative"
  ];

  const languageOptions = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese", 
    "Chinese", "Japanese", "Korean", "Russian", "Arabic"
  ];

  const complexityOptions = [
    "Basic/Simple", "Intermediate", "Advanced", "Expert level", "Technical", "Non-technical"
  ];

  const taskSuggestions = [
    "Write a comprehensive guide on...",
    "Debug the following code...",
    "Create a marketing strategy for...",
    "Explain the concept of...",
    "Generate code for...",
    "Review and improve...",
    "Analyze the following data...",
    "Create a lesson plan about..."
  ];

  const constraintSuggestions = [
    "Use simple language only",
    "Include specific examples",
    "Avoid technical jargon",
    "Keep under 500 words",
    "Include actionable steps",
    "Use bullet points for clarity"
  ];

  const updatePromptData = (field: keyof PromptData, value: string) => {
    const newData = { ...promptData, [field]: value };
    setPromptData(newData);
    generatePromptText(newData);
  };

  const generatePromptText = (data: PromptData) => {
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Fields */}
        <Card className="glass-card border-border/30 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display flex items-center">
              <Zap className="w-5 h-5 mr-2 text-primary" />
              Essential Fields
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                onChange={(value) => updatePromptData("role", value)}
                placeholder="e.g., Software Engineer, Marketing Expert..."
                suggestions={roleOptions}
              />
            </div>

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
                onChange={(value) => updatePromptData("task", value)}
                placeholder="Describe the specific task you want the AI to perform..."
                suggestions={taskSuggestions}
                multiline
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
                onChange={(value) => updatePromptData("context", value)}
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
                onChange={(value) => updatePromptData("tone", value)}
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
                onChange={(value) => updatePromptData("outputFormat", value)}
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
                  onChange={(value) => updatePromptData("constraints", value)}
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
                  onChange={(value) => updatePromptData("responseLength", value)}
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
                  onChange={(value) => updatePromptData("audience", value)}
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
                  onChange={(value) => updatePromptData("industry", value)}
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
                  onChange={(value) => updatePromptData("mood", value)}
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
                  onChange={(value) => updatePromptData("language", value)}
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
                  onChange={(value) => updatePromptData("complexity", value)}
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
                  onChange={(value) => updatePromptData("customVariables", value)}
                  placeholder="e.g., company_name: Acme Corp, version: 2.0..."
                  multiline
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template Management */}
        <Card className="glass-card border-border/30 bg-gradient-to-br from-accent/20 to-accent/10 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display flex items-center">
              <FolderOpen className="w-5 h-5 mr-2 text-accent-foreground" />
              Template Library
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 transition-all duration-300 hover:border-primary/60 hover:bg-primary/5 hover:scale-[1.02]"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 transition-all duration-300 hover:border-secondary/60 hover:bg-secondary/5 hover:scale-[1.02]"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Load Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="p-6 border-t border-border/30 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm">
        <Button 
          className="w-full h-14 bg-gradient-primary hover:opacity-90 transition-all duration-300 text-primary-foreground font-semibold text-lg shadow-elegant hover:shadow-glow hover:scale-[1.02] disabled:hover:scale-100"
          disabled={!promptData.task}
        >
          <Sparkles className="w-6 h-6 mr-3" />
          Generate Optimized Prompt
        </Button>
      </div>
    </div>
  );
};

export default PromptBuilder;