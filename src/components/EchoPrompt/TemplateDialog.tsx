import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, FolderOpen, Trash2, Star, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, Template, PromptData } from "@/services/api";

interface TemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
  currentPromptData?: PromptData;
  onLoadTemplate?: (promptData: PromptData) => void;
}

const TemplateDialog = ({ isOpen, onClose, mode, currentPromptData, onLoadTemplate }: TemplateDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Save mode state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('General');
  const [isPublic, setIsPublic] = useState(false);

  // Load mode state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && mode === 'load') {
      loadTemplates();
    }
  }, [isOpen, mode]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    if (!currentPromptData?.task) {
      toast({
        title: "Error", 
        description: "Cannot save template: No task specified",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.createTemplate({
        name: templateName,
        description: templateDescription,
        promptData: currentPromptData,
        category: templateCategory,
        tags: [],
        isPublic
      });

      if (response.success) {
        toast({
          title: "Success!",
          description: `Template "${templateName}" saved successfully`,
        });
        onClose();
        setTemplateName('');
        setTemplateDescription('');
        setTemplateCategory('General');
        setIsPublic(false);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTemplate = () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a template to load",
        variant: "destructive",
      });
      return;
    }

    if (onLoadTemplate) {
      onLoadTemplate(selectedTemplate.promptData);
      toast({
        title: "Success!",
        description: `Template "${selectedTemplate.name}" loaded successfully`,
      });
      onClose();
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['General', 'Technical Writing', 'Marketing', 'Content Creation', 'Analysis', 'Design', 'Development'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {mode === 'save' ? (
              <>
                <Save className="w-5 h-5 mr-2 text-primary" />
                Save Template
              </>
            ) : (
              <>
                <FolderOpen className="w-5 h-5 mr-2 text-primary" />
                Load Template
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'save' 
              ? "Save your current prompt configuration as a reusable template"
              : "Choose a template to load into your prompt builder"
            }
          </DialogDescription>
        </DialogHeader>

        {mode === 'save' ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Code Review Template"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Brief description of what this template does..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="template-category">Category</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="is-public">Make this template public (visible to other users)</Label>
              </div>
            </div>

            {currentPromptData && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Preview</Label>
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg space-y-2">
                    {currentPromptData.role && (
                      <div><strong>Role:</strong> {currentPromptData.role}</div>
                    )}
                    {currentPromptData.task && (
                      <div><strong>Task:</strong> {currentPromptData.task}</div>
                    )}
                    {currentPromptData.context && (
                      <div><strong>Context:</strong> {currentPromptData.context}</div>
                    )}
                    {currentPromptData.tone && (
                      <div><strong>Tone:</strong> {currentPromptData.tone}</div>
                    )}
                    {currentPromptData.outputFormat && (
                      <div><strong>Output Format:</strong> {currentPromptData.outputFormat}</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Search Templates</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, description, or category..."
                className="mt-1"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading templates...</div>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No templates found
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <div
                      key={template._id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?._id === template._id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{template.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            {template.isPublic && (
                              <Badge variant="secondary" className="text-xs">
                                Public
                              </Badge>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              Used {template.usageCount} times
                            </span>
                            <span className="flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              {template.rating.average.toFixed(1)} ({template.rating.count})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {mode === 'save' ? (
            <Button onClick={handleSaveTemplate} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Template"}
            </Button>
          ) : (
            <Button onClick={handleLoadTemplate} disabled={!selectedTemplate || isLoading}>
              Load Template
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog;
