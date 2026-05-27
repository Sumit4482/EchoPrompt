import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Library as LibraryIcon,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Download,
  Eye,
  Calendar,
  Star,
  Users,
  FileText,
  Database,
  ArrowLeft,
  Bot,
  Zap,
  Heart,
  Share2,
  Bookmark,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, Template, GeneratedPrompt } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Library = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  
  // Prompts state
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<GeneratedPrompt[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    loadLibraryContent();
  }, []);

  useEffect(() => {
    if (activeTab === "templates") {
      filterAndSortTemplates();
    } else {
      filterAndSortPrompts();
    }
  }, [templates, prompts, searchQuery, sortBy, filterBy, activeTab]);

  const loadLibraryContent = async () => {
    setIsLoading(true);
    try {
      const [templatesResponse, promptsResponse] = await Promise.all([
        apiService.getPublicTemplates({ limit: 50, sort: 'usageCount', order: 'desc' }),
        apiService.getPublicPrompts({ limit: 50, sort: 'views', order: 'desc' }),
      ]);

      setTemplates(templatesResponse.success && templatesResponse.data ? templatesResponse.data : []);
      setPrompts(promptsResponse.success && promptsResponse.data ? promptsResponse.data : []);
    } catch (error) {
      console.error('Error loading library content:', error);
      setTemplates([]);
      setPrompts([]);
      toast({
        title: "Error",
        description: "Failed to load library content.",
        variant: "destructive",
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
        case "trending":
          filtered = filtered.filter(template => template.usageCount > 100);
          break;
        case "recent":
          filtered = filtered.filter(template => {
            const daysDiff = (Date.now() - new Date(template.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
          });
          break;
        case "top-rated":
          filtered = filtered.filter(template => template.rating.average >= 4.5);
          break;
      }
    }

    // Apply sorting
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case "recent":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        case "trending":
          filtered = filtered.filter(prompt => prompt.analytics.views > 50);
          break;
        case "ai-enhanced":
          filtered = filtered.filter(prompt => prompt.metadata.aiEnhanced);
          break;
        case "optimized":
          filtered = filtered.filter(prompt => prompt.metadata.optimized);
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
      case "popular":
        filtered.sort((a, b) => (b.analytics.views + b.analytics.copies) - (a.analytics.views + a.analytics.copies));
        break;
      case "recent":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  const handleUsePrompt = async (prompt: GeneratedPrompt) => {
    try {
      console.log('🚀 Using prompt:', prompt._id);
      
      // Store prompt data in localStorage for the prompt builder
      localStorage.setItem('selectedPrompt', JSON.stringify(prompt));
      
      // Navigate to home page (prompt builder)
      navigate('/');
      
      toast({
        title: "📝 Prompt Loaded",
        description: "Prompt loaded into prompt builder",
      });
    } catch (error) {
      console.error('❌ Error using prompt:', error);
      toast({
        title: "Error",
        description: "Failed to load prompt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setSelectedPrompt(null);
    setIsViewDialogOpen(true);
  };

  const handleViewPrompt = (prompt: GeneratedPrompt) => {
    setSelectedPrompt(prompt);
    setSelectedTemplate(null);
    setIsViewDialogOpen(true);
  };

  const formatDate = (date: Date | string) => {
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
              <p className="text-muted-foreground">Loading public library...</p>
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
                <h1 className="text-3xl font-bold font-display flex items-center">
                  <LibraryIcon className="w-8 h-8 mr-3 text-primary" />
                  Public Library
                </h1>
                <p className="text-muted-foreground">Discover and use community-shared templates and prompts</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search library..."
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
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
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
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="recent">Recent (7 days)</SelectItem>
                  <SelectItem value="top-rated">Top Rated</SelectItem>
                  {activeTab === "prompts" && (
                    <>
                      <SelectItem value="ai-enhanced">AI Enhanced</SelectItem>
                      <SelectItem value="optimized">Optimized</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates" className="flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Templates ({templates.length})
              </TabsTrigger>
              <TabsTrigger value="prompts" className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Prompts ({prompts.length})
              </TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-6">
              {filteredTemplates.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery ? "Try adjusting your search terms" : "No public templates available"}
                      </p>
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
                              <Users className="w-4 h-4 text-green-500" />
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
                              <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Use Template
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
                                <TrendingUp className="w-4 h-4 mr-1" />
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

                          {/* Creator */}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="w-4 h-4 mr-1" />
                            by @{template.createdBy?.username || 'anonymous'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Prompts Tab */}
            <TabsContent value="prompts" className="mt-6">
              {filteredPrompts.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery ? "Try adjusting your search terms" : "No public prompts available"}
                      </p>
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
                              <span className="mr-2">{prompt.promptData.role}</span>
                              {prompt.metadata.aiEnhanced && <Bot className="w-4 h-4 text-blue-500" />}
                              {prompt.metadata.optimized && <Zap className="w-4 h-4 text-yellow-500 ml-1" />}
                              <Users className="w-4 h-4 text-green-500 ml-1" />
                            </CardTitle>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {prompt.promptData.task}
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
                              <DropdownMenuItem onClick={() => handleUsePrompt(prompt)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Use Prompt
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
                              {prompt.content}
                            </p>
                          </div>

                          {/* Keywords */}
                          {prompt.keywords && prompt.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {prompt.keywords.slice(0, 4).map((keyword, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {keyword}
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

                          {/* Creator */}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="w-4 h-4 mr-1" />
                            by @{prompt.createdBy?.username || 'anonymous'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {selectedTemplate ? selectedTemplate.name : selectedPrompt?.promptData.role}
                <Users className="w-4 h-4 ml-2 text-green-500" />
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate ? selectedTemplate.description : selectedPrompt?.promptData.task}
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
                      <div><span className="font-medium">Creator:</span> @{selectedTemplate.createdBy?.username}</div>
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
                  <Button onClick={() => handleUseTemplate(selectedTemplate)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              </div>
            )}

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
                      <div><span className="font-medium">Creator:</span> @{selectedPrompt.createdBy?.username}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedPrompt.keywords?.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Prompt Content</h4>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono">{selectedPrompt.content}</pre>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleCopyPrompt(selectedPrompt)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button onClick={() => handleUsePrompt(selectedPrompt)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Use Prompt
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

export default Library;
