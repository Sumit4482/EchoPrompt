import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Database,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Edit,
  Trash2,
  Star,
  Download,
  Eye,
  Calendar,
  Plus,
  ArrowLeft,
  Users,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, Template } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const MyTemplates = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Mock data - replace with real API call
  const mockTemplates: Template[] = [
    {
      _id: "1",
      name: "Code Review Template",
      description: "Comprehensive template for reviewing code changes and providing constructive feedback",
      promptData: {
        role: "Senior Software Engineer",
        task: "Review the following code for best practices and potential issues",
        context: "This is for a production application",
        tone: "Professional",
        outputFormat: "Markdown",
        constraints: "Focus on security and performance",
        audience: "Development team",
        industry: "Technology",
        complexity: "Advanced"
      },
      category: "Technical Writing",
      tags: ["code", "review", "development", "feedback"],
      isPublic: true,
      usageCount: 42,
      rating: { average: 4.8, count: 15 },
      createdAt: new Date("2024-01-10T14:30:00Z")
    },
    {
      _id: "2",
      name: "Marketing Email Campaign",
      description: "Template for creating engaging email marketing campaigns",
      promptData: {
        role: "Marketing Specialist",
        task: "Create a compelling email marketing campaign",
        context: "Product launch for SaaS platform",
        tone: "Friendly",
        outputFormat: "Email",
        audience: "Small business owners",
        industry: "Marketing",
        complexity: "Intermediate"
      },
      category: "Marketing",
      tags: ["email", "marketing", "campaign", "saas"],
      isPublic: false,
      usageCount: 28,
      rating: { average: 4.5, count: 8 },
      createdAt: new Date("2024-01-08T09:15:00Z")
    },
    {
      _id: "3",
      name: "API Documentation Guide",
      description: "Template for writing comprehensive API documentation",
      promptData: {
        role: "Technical Writer",
        task: "Write comprehensive API documentation",
        context: "REST API for authentication system",
        tone: "Technical",
        outputFormat: "Markdown",
        constraints: "Include code examples and error handling",
        audience: "Developers",
        industry: "Technology",
        complexity: "Advanced"
      },
      category: "Documentation",
      tags: ["api", "documentation", "technical", "rest"],
      isPublic: true,
      usageCount: 35,
      rating: { average: 4.9, count: 12 },
      createdAt: new Date("2024-01-05T16:45:00Z")
    },
    {
      _id: "4",
      name: "UI/UX Design Brief",
      description: "Template for creating detailed UI/UX design briefs",
      promptData: {
        role: "UX Designer",
        task: "Create a comprehensive design brief for a mobile app",
        context: "E-commerce mobile application",
        tone: "Creative",
        outputFormat: "Structured Document",
        audience: "Design team and stakeholders",
        industry: "E-commerce",
        complexity: "Intermediate"
      },
      category: "Design",
      tags: ["ux", "ui", "design", "mobile", "ecommerce"],
      isPublic: false,
      usageCount: 19,
      rating: { average: 4.3, count: 6 },
      createdAt: new Date("2024-01-03T11:20:00Z")
    }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterAndSortTemplates();
  }, [templates, searchQuery, sortBy, filterBy]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading templates from API...');
      const response = await apiService.getTemplates();
      
      if (response.success && response.data) {
        console.log('✅ Templates loaded:', response.data.length);
        setTemplates(response.data);
      } else {
        console.warn('⚠️ API failed, using fallback data');
        // Fallback to mock data if API fails
        setTemplates(mockTemplates);
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      // Fallback to mock data on error
      setTemplates(mockTemplates);
      
      toast({
        title: "⚠️ Using Local Data",
        description: "Connected to demo mode. Templates loaded from local storage.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortTemplates = () => {
    let filtered = [...templates];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags?.some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply category filter
    if (filterBy !== "all") {
      switch (filterBy) {
        case "public":
          filtered = filtered.filter(template => template.isPublic);
          break;
        case "private":
          filtered = filtered.filter(template => !template.isPublic);
          break;
        case "popular":
          filtered = filtered.filter(template => template.usageCount > 20);
          break;
        case "recent":
          filtered = filtered.filter(template => {
            const daysDiff = (Date.now() - new Date(template.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
          });
          break;
      }
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "popular":
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating.average - a.rating.average);
        break;
      case "alphabetical":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredTemplates(filtered);
  };

  const handleCopyTemplate = async (template: Template) => {
    try {
      const templateText = `Template: ${template.name}\n\nRole: ${template.promptData.role}\nTask: ${template.promptData.task}\nContext: ${template.promptData.context}\nTone: ${template.promptData.tone}\nOutput Format: ${template.promptData.outputFormat}`;
      await navigator.clipboard.writeText(templateText);
      toast({
        title: "📋 Copied!",
        description: "Template copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      console.log('🗑️ Deleting template:', templateId);
      const response = await apiService.deleteTemplate(templateId);
      
      if (response.success) {
        // Remove from local state
        setTemplates(prev => prev.filter(t => t._id !== templateId));
        toast({
          title: "🗑️ Deleted",
          description: "Template deleted successfully",
        });
      } else {
        throw new Error(response.error || 'Delete failed');
      }
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportTemplate = async (template: Template) => {
    try {
      const exportData = {
        name: template.name,
        description: template.description,
        promptData: template.promptData,
        category: template.category,
        tags: template.tags,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "📁 Exported",
        description: "Template exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export template",
        variant: "destructive",
      });
    }
  };

  const handleViewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsViewDialogOpen(true);
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      console.log('🚀 Using template:', template.name);
      
      // Record usage
      await apiService.useTemplate?.(template._id);
      
      // Store template data in localStorage for the prompt builder
      localStorage.setItem('selectedTemplate', JSON.stringify(template));
      
      // Navigate to home page (prompt builder)
      navigate('/');
      
      toast({
        title: "📝 Template Loaded",
        description: `"${template.name}" loaded into prompt builder`,
      });
    } catch (error) {
      console.error('❌ Error using template:', error);
      toast({
        title: "Error",
        description: "Failed to load template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your templates...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link to="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold font-display">My Templates</h1>
                <p className="text-muted-foreground">Manage and organize your prompt templates</p>
              </div>
            </div>
            
            <Button onClick={() => navigate('/')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="recent">Recent (7 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Database className="w-8 h-8 text-primary" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{templates.length}</p>
                  <p className="text-sm text-muted-foreground">Total Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{templates.filter(t => t.isPublic).length}</p>
                  <p className="text-sm text-muted-foreground">Public</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Lock className="w-8 h-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{templates.filter(t => !t.isPublic).length}</p>
                  <p className="text-sm text-muted-foreground">Private</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{templates.reduce((sum, t) => sum + t.usageCount, 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try adjusting your search terms" : "Create your first template to get started"}
                </p>
                <Button onClick={() => navigate('/')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center">
                        <span className="mr-2">{template.name}</span>
                        {template.isPublic ? (
                          <Users className="w-4 h-4 text-green-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-orange-500" />
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {template.category}
                      </Badge>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewTemplate(template)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyTemplate(template)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportTemplate(template)}>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTemplate(template._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Role and Task Preview */}
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Role:</span> {template.promptData.role}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        <span className="font-medium">Task:</span> {template.promptData.task}
                      </div>
                    </div>

                    {/* Tags */}
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {template.usageCount}
                        </span>
                        <span className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {template.rating.average.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(template.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Template Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {selectedTemplate?.name}
                {selectedTemplate?.isPublic ? (
                  <Users className="w-4 h-4 ml-2 text-green-500" />
                ) : (
                  <Lock className="w-4 h-4 ml-2 text-orange-500" />
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate?.description}
              </DialogDescription>
            </DialogHeader>
            
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Template Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Category:</span> {selectedTemplate.category}</div>
                      <div><span className="font-medium">Uses:</span> {selectedTemplate.usageCount}</div>
                      <div><span className="font-medium">Rating:</span> {selectedTemplate.rating.average}/5 ({selectedTemplate.rating.count} reviews)</div>
                      <div><span className="font-medium">Created:</span> {formatDate(selectedTemplate.createdAt)}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.tags?.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Prompt Configuration</h4>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                    <div><span className="font-medium">Role:</span> {selectedTemplate.promptData.role}</div>
                    <div><span className="font-medium">Task:</span> {selectedTemplate.promptData.task}</div>
                    {selectedTemplate.promptData.context && (
                      <div><span className="font-medium">Context:</span> {selectedTemplate.promptData.context}</div>
                    )}
                    {selectedTemplate.promptData.tone && (
                      <div><span className="font-medium">Tone:</span> {selectedTemplate.promptData.tone}</div>
                    )}
                    {selectedTemplate.promptData.outputFormat && (
                      <div><span className="font-medium">Output Format:</span> {selectedTemplate.promptData.outputFormat}</div>
                    )}
                    {selectedTemplate.promptData.constraints && (
                      <div><span className="font-medium">Constraints:</span> {selectedTemplate.promptData.constraints}</div>
                    )}
                    {selectedTemplate.promptData.audience && (
                      <div><span className="font-medium">Audience:</span> {selectedTemplate.promptData.audience}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleCopyTemplate(selectedTemplate)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" onClick={() => handleExportTemplate(selectedTemplate)}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={() => handleUseTemplate(selectedTemplate)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyTemplates;
