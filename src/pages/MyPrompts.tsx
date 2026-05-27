import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Edit,
  Trash2,
  Download,
  Eye,
  Calendar,
  Zap,
  Bot,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, GeneratedPrompt } from "@/services/api";
import LibraryPageLayout from "@/components/EchoPrompt/LibraryPageLayout";

const LIST_LIMIT = 100;

const MyPrompts = () => {
  const { toast } = useToast();
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
  const [isSaving, setIsSaving] = useState(false);

  const loadPrompts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getPrompts({ limit: LIST_LIMIT });
      setPrompts(response.success && response.data ? response.data : []);
    } catch (error) {
      console.error("Error loading prompts:", error);
      toast({
        title: "Error",
        description: "Failed to load prompts. Sign in and try again.",
        variant: "destructive",
      });
      setPrompts([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  useEffect(() => {
    let filtered = [...prompts];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (prompt) =>
          prompt.content?.toLowerCase().includes(q) ||
          prompt.promptData?.role?.toLowerCase().includes(q) ||
          prompt.promptData?.task?.toLowerCase().includes(q) ||
          prompt.keywords?.some((k) => k.toLowerCase().includes(q)),
      );
    }

    if (filterBy !== "all") {
      switch (filterBy) {
        case "ai-enhanced":
          filtered = filtered.filter((p) => p.metadata?.aiEnhanced);
          break;
        case "optimized":
          filtered = filtered.filter((p) => p.metadata?.optimized);
          break;
        case "public":
          filtered = filtered.filter((p) => p.isPublic);
          break;
        case "private":
          filtered = filtered.filter((p) => !p.isPublic);
          break;
        case "recent":
          filtered = filtered.filter((p) => {
            const days =
              (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return days <= 7;
          });
          break;
      }
    }

    switch (sortBy) {
      case "popular":
        filtered.sort(
          (a, b) =>
            (b.analytics?.views ?? 0) +
            (b.analytics?.copies ?? 0) -
            ((a.analytics?.views ?? 0) + (a.analytics?.copies ?? 0)),
        );
        break;
      case "wordCount":
        filtered.sort((a, b) => (b.wordCount ?? 0) - (a.wordCount ?? 0));
        break;
      case "alphabetical":
        filtered.sort((a, b) =>
          (a.promptData?.role || "").localeCompare(b.promptData?.role || ""),
        );
        break;
      default:
        filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    setFilteredPrompts(filtered);
  }, [prompts, searchQuery, sortBy, filterBy]);

  const formatDate = (date: string | Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));

  const handleCopyPrompt = async (prompt: GeneratedPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content || "");
      toast({ title: "Copied", description: "Prompt copied to clipboard." });
    } catch {
      toast({ title: "Error", description: "Failed to copy.", variant: "destructive" });
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      const response = await apiService.deletePrompt(promptId);
      if (response.success) {
        setPrompts((prev) => prev.filter((p) => p._id !== promptId));
        toast({ title: "Deleted", description: "Prompt removed." });
      } else {
        throw new Error(response.error || "Delete failed");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete prompt.",
        variant: "destructive",
      });
    }
  };

  const handleExportPrompt = (prompt: GeneratedPrompt) => {
    try {
      const blob = new Blob([prompt.content || ""], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prompt-${prompt._id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Prompt downloaded." });
    } catch {
      toast({ title: "Error", description: "Export failed.", variant: "destructive" });
    }
  };

  const handleUsePrompt = (prompt: GeneratedPrompt) => {
    localStorage.setItem("selectedPrompt", JSON.stringify(prompt));
    navigate("/?tab=builder");
    toast({ title: "Prompt loaded", description: "Opened in the builder." });
  };

  const handleSaveEdit = async () => {
    if (!editingPrompt) return;
    setIsSaving(true);
    try {
      const response = await apiService.updatePrompt(editingPrompt._id, {
        content: editedContent,
        isPublic: editedIsPublic,
      });
      if (response.success) {
        setPrompts((prev) =>
          prev.map((p) =>
            p._id === editingPrompt._id
              ? { ...p, content: editedContent, isPublic: editedIsPublic }
              : p,
          ),
        );
        setIsEditDialogOpen(false);
        setEditingPrompt(null);
        toast({ title: "Saved", description: "Prompt updated." });
      } else {
        throw new Error(response.error || "Update failed");
      }
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <LibraryPageLayout title="My Prompts" description="Your saved generated prompts">
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </LibraryPageLayout>
    );
  }

  return (
    <LibraryPageLayout title="My Prompts" description="Your saved generated prompts">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              <SelectItem value="alphabetical">By Role</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="ai-enhanced">AI Enhanced</SelectItem>
              <SelectItem value="optimized">Optimized</SelectItem>
              <SelectItem value="recent">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: FileText, label: "Total", value: prompts.length },
          { icon: Eye, label: "Public", value: prompts.filter((p) => p.isPublic).length },
          {
            icon: Bot,
            label: "AI Enhanced",
            value: prompts.filter((p) => p.metadata?.aiEnhanced).length,
          },
          {
            icon: Zap,
            label: "Views",
            value: prompts.reduce((sum, p) => sum + (p.analytics?.views ?? 0), 0),
          },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="border-border/40">
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrompts.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No prompts found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try different search terms or filters."
                : "Generate and save prompts from the builder (⌘/Ctrl + S)."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredPrompts.map((prompt) => (
            <Card key={prompt._id} className="border-border/40">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      <span className="truncate">{prompt.promptData?.role || "Prompt"}</span>
                      {prompt.metadata?.aiEnhanced && (
                        <Bot className="h-3.5 w-3.5 text-blue-500" />
                      )}
                      {prompt.metadata?.optimized && (
                        <Zap className="h-3.5 w-3.5 text-yellow-500" />
                      )}
                      {prompt.isPublic ? (
                        <Eye className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-orange-500" />
                      )}
                    </CardTitle>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {prompt.promptData?.task || "No task"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedPrompt(prompt);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyPrompt(prompt)}>
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportPrompt(prompt)}>
                        <Download className="mr-2 h-4 w-4" /> Export
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingPrompt(prompt);
                          setEditedContent(prompt.content || "");
                          setEditedIsPublic(prompt.isPublic ?? false);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeletePrompt(prompt._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {prompt.content || "No content"}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {prompt.wordCount ?? 0} words · {prompt.analytics?.views ?? 0} views
                  </span>
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(prompt.createdAt)}
                  </span>
                </div>
                <Button size="sm" className="w-full" onClick={() => handleUsePrompt(prompt)}>
                  Use in builder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPrompt?.promptData?.role || "Prompt"}</DialogTitle>
            <DialogDescription>{selectedPrompt?.promptData?.task}</DialogDescription>
          </DialogHeader>
          {selectedPrompt && (
            <div className="space-y-4">
              <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/30 p-4 text-sm">
                {selectedPrompt.content}
              </pre>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleCopyPrompt(selectedPrompt)}>
                  Copy
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleUsePrompt(selectedPrompt);
                  }}
                >
                  Use in builder
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit prompt</DialogTitle>
            <DialogDescription>Update content and visibility.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea
                rows={10}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editedIsPublic} onCheckedChange={setEditedIsPublic} />
              <Label>Public prompt</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LibraryPageLayout>
  );
};

export default MyPrompts;
