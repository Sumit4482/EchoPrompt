import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Sparkles, Save, FolderOpen } from "lucide-react";

interface PromptData {
  role: string;
  task: string;
  context: string;
  tone: string;
  outputFormat: string;
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
    outputFormat: ""
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

  const roleOptions = [
    "Software Engineer", "Technical Writer", "Data Scientist", 
    "Product Manager", "Teacher/Educator", "Cybersecurity Expert", 
    "Marketing Specialist", "Content Creator"
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
    
    onPromptChange(prompt);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Fields */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Basic Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Role <Badge variant="secondary" className="ml-2">Who is the AI?</Badge>
              </Label>
              <Select value={promptData.role} onValueChange={(value) => updatePromptData("role", value)}>
                <SelectTrigger className="bg-input border-border transition-smooth hover:border-primary/50">
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent className="glass border-border/50">
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Task */}
            <div className="space-y-2">
              <Label htmlFor="task" className="text-sm font-medium">
                Task <Badge variant="secondary" className="ml-2">What should it do?</Badge>
              </Label>
              <Textarea
                id="task"
                placeholder="Describe the specific task you want the AI to perform..."
                value={promptData.task}
                onChange={(e) => updatePromptData("task", e.target.value)}
                className="bg-input border-border transition-smooth hover:border-primary/50 focus:border-primary min-h-[80px]"
              />
            </div>

            {/* Context */}
            <div className="space-y-2">
              <Label htmlFor="context" className="text-sm font-medium">
                Context <Badge variant="secondary" className="ml-2">Background info</Badge>
              </Label>
              <Textarea
                id="context"
                placeholder="Provide any background information or constraints..."
                value={promptData.context}
                onChange={(e) => updatePromptData("context", e.target.value)}
                className="bg-input border-border transition-smooth hover:border-primary/50 focus:border-primary min-h-[80px]"
              />
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label htmlFor="tone" className="text-sm font-medium">
                Tone/Style <Badge variant="secondary" className="ml-2">How should it sound?</Badge>
              </Label>
              <Select value={promptData.tone} onValueChange={(value) => updatePromptData("tone", value)}>
                <SelectTrigger className="bg-input border-border transition-smooth hover:border-primary/50">
                  <SelectValue placeholder="Select tone..." />
                </SelectTrigger>
                <SelectContent className="glass border-border/50">
                  {toneOptions.map((tone) => (
                    <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Output Format */}
            <div className="space-y-2">
              <Label htmlFor="output" className="text-sm font-medium">
                Output Format <Badge variant="secondary" className="ml-2">Response structure</Badge>
              </Label>
              <Select value={promptData.outputFormat} onValueChange={(value) => updatePromptData("outputFormat", value)}>
                <SelectTrigger className="bg-input border-border transition-smooth hover:border-primary/50">
                  <SelectValue placeholder="Select format..." />
                </SelectTrigger>
                <SelectContent className="glass border-border/50">
                  {outputFormatOptions.map((format) => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Fields Toggle */}
        <Button
          variant="ghost"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full justify-between text-muted-foreground hover:text-foreground transition-smooth"
        >
          <span>Advanced Fields</span>
          {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {/* Advanced Fields */}
        {isAdvancedOpen && (
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">Advanced Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Coming soon: Constraints, Response Length, Audience Targeting, and more...
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template Management */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1 transition-smooth hover:border-primary/50">
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
              <Button variant="outline" size="sm" className="flex-1 transition-smooth hover:border-primary/50">
                <FolderOpen className="w-4 h-4 mr-2" />
                Load Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="p-6 border-t border-border/50">
        <Button 
          className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-smooth text-primary-foreground font-medium"
          disabled={!promptData.task}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Optimized Prompt
        </Button>
      </div>
    </div>
  );
};

export default PromptBuilder;