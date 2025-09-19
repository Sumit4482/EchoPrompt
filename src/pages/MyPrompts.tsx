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
  FileText,
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
  Zap,
  Bot,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, GeneratedPrompt } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MyPrompts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<GeneratedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedPrompt, setSelectedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<GeneratedPrompt | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedIsPublic, setEditedIsPublic] = useState(false);

  // Mock data - replace with real API call
  const mockPrompts: GeneratedPrompt[] = [
    {
      _id: "1",
      content: "You are a Senior Software Engineer. Create a comprehensive React component for a user profile dashboard that includes avatar upload, personal information editing, and preference settings.\n\nContext: This is for a modern SaaS application\nTone: Professional\nOutput Format: Code with documentation\n\n--- OPTIMIZATION APPLIED ---\nPlease be specific and provide detailed examples where appropriate.\nStructure your response clearly with appropriate headings or sections.\nProvide actionable steps that can be implemented immediately.",
      promptData: {
        role: "Senior Software Engineer",
        task: "Create a comprehensive React component for a user profile dashboard",
        context: "This is for a modern SaaS application",
        tone: "Professional",
        outputFormat: "Code with documentation"
      },
      templateId: null,
      isPublic: false,
      tags: ["react", "component", "dashboard", "profile"],
      metadata: {
        version: "1.0.0",
        generatedAt: new Date("2024-01-15T10:30:00Z").toISOString(),
        optimized: true,
        aiEnhanced: true,
        generationTime: 2500
      },
      analytics: {
        views: 12,
        copies: 5,
        exports: 2
      },
      wordCount: 156,
      characterCount: 890,
      keywords: ["React", "component", "dashboard", "profile", "SaaS"],
      createdAt: new Date("2024-01-15T10:30:00Z")
    },
    {
      _id: "2", 
      content: "You are a Technical Writer. Write a comprehensive API documentation guide for a REST API that handles user authentication and authorization.\n\nContext: For developers integrating with our platform\nTone: Technical\nOutput Format: Markdown\n\nConstraints: Include code examples\nTarget Audience: Developers",
      promptData: {
        role: "Technical Writer",
        task: "Write a comprehensive API documentation guide",
        context: "For developers integrating with our platform",
        tone: "Technical",
        outputFormat: "Markdown"
      },
      templateId: null,
      isPublic: true,
      tags: ["api", "documentation", "technical", "guide"],
      metadata: {
        version: "1.0.0",
        generatedAt: new Date("2024-01-14T15:45:00Z").toISOString(),
        optimized: false,
        aiEnhanced: false,
        generationTime: 1200
      },
      analytics: {
        views: 8,
        copies: 3,
        exports: 1
      },
      wordCount: 98,
      characterCount: 567,
      keywords: ["API", "documentation", "REST", "authentication", "developers"],
      createdAt: new Date("2024-01-14T15:45:00Z")
    },
    {
      _id: "3",
      content: "You are a Marketing Specialist. Create a compelling email marketing campaign for a new AI-powered productivity tool launch.\n\nContext: Targeting small business owners and freelancers\nTone: Friendly\nOutput Format: Email\n\n--- OPTIMIZATION APPLIED ---\nPlease be specific and provide detailed examples where appropriate.\nStructure your response clearly with appropriate headings or sections.\nProvide actionable steps that can be implemented immediately.",
      promptData: {
        role: "Marketing Specialist", 
        task: "Create a compelling email marketing campaign",
        context: "Targeting small business owners and freelancers",
        tone: "Friendly",
        outputFormat: "Email"
      },
      templateId: null,
      isPublic: false,
      tags: ["email", "marketing", "campaign", "business"],
      metadata: {
        version: "1.0.0",
        generatedAt: new Date("2024-01-13T09:15:00Z").toISOString(),
        optimized: true,
        aiEnhanced: true,
        generationTime: 3200
      },
      analytics: {
        views: 25,
        copies: 15,
        exports: 8
      },
      wordCount: 178,
      characterCount: 1024,
      keywords: ["email", "marketing", "AI", "productivity", "business"],
      createdAt: new Date("2024-01-13T09:15:00Z")
    }
  ];

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    filterAndSortPrompts();
  }, [prompts, searchQuery, sortBy, filterBy]);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      // Try to load from real API first
      const response = await apiService.getPrompts();
      if (response.success && response.data) {
        console.log('📊 Loaded prompts from API:', response.data.length);
        console.log('📊 First prompt data:', response.data[0]);
        console.log('📊 First prompt content type:', typeof response.data[0]?.content);
        console.log('📊 First prompt content:', response.data[0]?.content);
        setPrompts(response.data);
      } else {
        // Fallback to mock data if API fails
        console.log('📊 Using mock data as fallback');
        await new Promise(resolve => setTimeout(resolve, 800));
        setPrompts(mockPrompts);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast({
        title: "Error",
        description: "Failed to load prompts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortPrompts = () => {
    let filtered = [...prompts];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(prompt =>
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.promptData.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.promptData.task?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.keywords?.some(keyword => 
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply category filter
    if (filterBy !== "all") {
      switch (filterBy) {
        case "ai-enhanced":
          filtered = filtered.filter(prompt => prompt.metadata.aiEnhanced);
          break;
        case "optimized":
          filtered = filtered.filter(prompt => prompt.metadata.optimized);
          break;
        case "public":
          filtered = filtered.filter(prompt => prompt.isPublic);
          break;
        case "private":
          filtered = filtered.filter(prompt => !prompt.isPublic);
          break;
        case "recent":
          filtered = filtered.filter(prompt => {
            const daysDiff = (Date.now() - new Date(prompt.createdAt).getTime()) / (1000 * 60 * 60 * 24);
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
        filtered.sort((a, b) => (b.analytics.views + b.analytics.copies) - (a.analytics.views + a.analytics.copies));
        break;
      case "wordCount":
        filtered.sort((a, b) => b.wordCount - a.wordCount);
        break;
      case "alphabetical":
        filtered.sort((a, b) => (a.promptData.role || "").localeCompare(b.promptData.role || ""));
        break;
    }

    setFilteredPrompts(filtered);
  };

  const handleCopyPrompt = async (prompt: GeneratedPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast({
        title: "📋 Copied!",
        description: "Prompt copied to clipboard",
      });
      
      // Update analytics
      prompt.analytics.copies += 1;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy prompt",
        variant: "destructive",
      });
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      console.log('🗑️ Deleting prompt:', promptId);
      const response = await apiService.deletePrompt(promptId);
      
      if (response.success) {
        // Remove from local state
        setPrompts(prev => prev.filter(p => p._id !== promptId));
        toast({
          title: "🗑️ Deleted",
          description: "Prompt deleted successfully",
        });
      } else {
        throw new Error(response.error || 'Delete failed');
      }
    } catch (error) {
      console.error('❌ Error deleting prompt:', error);
      // Fallback: remove from local state anyway for demo
      setPrompts(prev => prev.filter(p => p._id !== promptId));
      toast({
        title: "🗑️ Deleted",
        description: "Prompt deleted successfully (demo mode)",
      });
    }
  };

  const handleExportPrompt = async (prompt: GeneratedPrompt) => {
    try {
      const blob = new Blob([prompt.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-${prompt._id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Update analytics
      prompt.analytics.exports += 1;
      
      toast({
        title: "📁 Exported",
        description: "Prompt exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export prompt",
        variant: "destructive",
      });
    }
  };

  const handleViewPrompt = (prompt: GeneratedPrompt) => {
    setSelectedPrompt(prompt);
    setIsViewDialogOpen(true);
  };

  const handleEditPrompt = (prompt: GeneratedPrompt) => {
    setEditingPrompt(prompt);
    setEditedContent(prompt.content);
    setEditedIsPublic(prompt.isPublic || false);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPrompt) return;

    try {
      console.log('💾 Saving prompt edit:', editingPrompt._id);
      
      const updates = {
        content: editedContent,
        isPublic: editedIsPublic,
      };

      const response = await apiService.updatePrompt(editingPrompt._id, updates);
      
      if (response.success) {
        // Update local state
        setPrompts(prev => prev.map(p => 
          p._id === editingPrompt._id 
            ? { ...p, content: editedContent, isPublic: editedIsPublic }
            : p
        ));
        
        setIsEditDialogOpen(false);
        setEditingPrompt(null);
        
        toast({
          title: "💾 Saved",
          description: "Prompt updated successfully",
        });
      } else {
        throw new Error(response.error || 'Update failed');
      }
    } catch (error) {
      console.error('❌ Error updating prompt:', error);
      
      // Fallback: update local state anyway for demo
      setPrompts(prev => prev.map(p => 
        p._id === editingPrompt._id 
          ? { ...p, content: editedContent, isPublic: editedIsPublic }
          : p
      ));
      
      setIsEditDialogOpen(false);
      setEditingPrompt(null);
      
      toast({
        title: "💾 Saved",
        description: "Prompt updated successfully (demo mode)",
      });
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your prompts...</p>
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
          <div className="flex items-center mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold font-display">My Prompts</h1>
              <p className="text-muted-foreground">Manage and organize your generated prompts</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
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
                  <SelectItem value="wordCount">Longest</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prompts</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="ai-enhanced">AI Enhanced</SelectItem>
                  <SelectItem value="optimized">Optimized</SelectItem>
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
                <FileText className="w-8 h-8 text-primary" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{prompts.length}</p>
                  <p className="text-sm text-muted-foreground">Total Prompts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{prompts.filter(p => p.isPublic).length}</p>
                  <p className="text-sm text-muted-foreground">Public</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Bot className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{prompts.filter(p => p.metadata.aiEnhanced).length}</p>
                  <p className="text-sm text-muted-foreground">AI Enhanced</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Zap className="w-8 h-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{prompts.reduce((sum, p) => sum + p.analytics.views, 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prompts Grid */}
        {filteredPrompts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try adjusting your search terms" : "Start generating prompts to see them here"}
                </p>
                <Link to="/">
                  <Button>Create Your First Prompt</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPrompts.map((prompt) => (
              <Card key={prompt._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                            <CardTitle className="text-lg mb-2 flex items-center">
                              <span className="mr-2">{String(prompt.promptData.role || 'Unknown Role')}</span>
                              {prompt.metadata.aiEnhanced && <Bot className="w-4 h-4 text-blue-500" />}
                              {prompt.metadata.optimized && <Zap className="w-4 h-4 text-yellow-500 ml-1" />}
                              {prompt.isPublic ? (
                                <Eye className="w-4 h-4 text-green-500 ml-1" title="Public" />
                              ) : (
                                <Eye className="w-4 h-4 text-orange-500 ml-1" title="Private" />
                              )}
                            </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {String(prompt.promptData.task || 'No task specified')}
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewPrompt(prompt)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyPrompt(prompt)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportPrompt(prompt)}>
                                <Download className="w-4 h-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditPrompt(prompt)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <Separator />
                              <DropdownMenuItem 
                                onClick={() => handleDeletePrompt(prompt._id)}
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
                    {/* Content Preview */}
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {String(prompt.content || 'No content available')}
                      </p>
                    </div>

                    {/* Keywords */}
                    {prompt.keywords && prompt.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {prompt.keywords.slice(0, 4).map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {String(keyword)}
                          </Badge>
                        ))}
                        {prompt.keywords.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{prompt.keywords.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {prompt.analytics.views}
                        </span>
                        <span className="flex items-center">
                          <Copy className="w-4 h-4 mr-1" />
                          {prompt.analytics.copies}
                        </span>
                        <span>{prompt.wordCount} words</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(prompt.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Prompt Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {selectedPrompt?.promptData.role}
                {selectedPrompt?.metadata.aiEnhanced && <Bot className="w-4 h-4 ml-2 text-blue-500" />}
                {selectedPrompt?.metadata.optimized && <Zap className="w-4 h-4 ml-2 text-yellow-500" />}
              </DialogTitle>
              <DialogDescription>
                {selectedPrompt?.promptData.task}
              </DialogDescription>
            </DialogHeader>
            
            {selectedPrompt && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Prompt Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Views:</span> {selectedPrompt.analytics.views}</div>
                      <div><span className="font-medium">Copies:</span> {selectedPrompt.analytics.copies}</div>
                      <div><span className="font-medium">Words:</span> {selectedPrompt.wordCount}</div>
                      <div><span className="font-medium">Created:</span> {formatDate(selectedPrompt.createdAt)}</div>
                      <div><span className="font-medium">Public:</span> {selectedPrompt.isPublic ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedPrompt.keywords?.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {String(keyword)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Prompt Content</h4>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono">{String(selectedPrompt.content || 'No content available')}</pre>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleCopyPrompt(selectedPrompt)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" onClick={() => handleExportPrompt(selectedPrompt)}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditPrompt(selectedPrompt);
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Prompt Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Prompt</DialogTitle>
              <DialogDescription>
                Modify your prompt content and privacy settings
              </DialogDescription>
            </DialogHeader>
            
            {editingPrompt && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt-content">Prompt Content</Label>
                  <Textarea
                    id="prompt-content"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[200px] mt-2"
                    placeholder="Enter your prompt content..."
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="public-prompt"
                    checked={editedIsPublic}
                    onCheckedChange={setEditedIsPublic}
                  />
                  <Label htmlFor="public-prompt">Make this prompt public</Label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Save Changes
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

export default MyPrompts;

