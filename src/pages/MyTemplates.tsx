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
  Users,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, Template } from "@/services/api";
import LibraryPageLayout from "@/components/EchoPrompt/LibraryPageLayout";

const LIST_LIMIT = 100;

const MyTemplates = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Template>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getTemplates({ mine: true, limit: LIST_LIMIT });
      setTemplates(response.success && response.data ? response.data : []);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates.",
        variant: "destructive",
      });
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    let filtered = [...templates];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(q) ||
          template.description?.toLowerCase().includes(q) ||
          template.category?.toLowerCase().includes(q) ||
          template.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    if (filterBy !== "all") {
      switch (filterBy) {
        case "public":
          filtered = filtered.filter((t) => t.isPublic);
          break;
        case "private":
          filtered = filtered.filter((t) => !t.isPublic);
          break;
        case "popular":
          filtered = filtered.filter((t) => (t.usageCount ?? 0) > 20);
          break;
        case "recent":
          filtered = filtered.filter((t) => {
            const days =
              (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return days <= 7;
          });
          break;
      }
    }

    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0));
        break;
      case "rating":
        filtered.sort(
          (a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0),
        );
        break;
      case "alphabetical":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, sortBy, filterBy]);

  const formatDate = (date: string | Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));

  const formatRating = (template: Template) =>
    (template.rating?.average ?? 0).toFixed(1);

  const handleCopyTemplate = async (template: Template) => {
    try {
      const pd = template.promptData;
      const text = `Template: ${template.name}\n\nRole: ${pd.role}\nTask: ${pd.task}\nContext: ${pd.context}\nTone: ${pd.tone}\nOutput Format: ${pd.outputFormat}`;
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Template copied to clipboard." });
    } catch {
      toast({ title: "Error", description: "Failed to copy.", variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await apiService.deleteTemplate(templateId);
      if (response.success) {
        setTemplates((prev) => prev.filter((t) => t._id !== templateId));
        toast({ title: "Deleted", description: "Template removed." });
      } else {
        throw new Error(response.error || "Delete failed");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    }
  };

  const handleExportTemplate = (template: Template) => {
    try {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              name: template.name,
              description: template.description,
              promptData: template.promptData,
              category: template.category,
              tags: template.tags,
              exportedAt: new Date().toISOString(),
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template-${template.name.replace(/\s+/g, "-").toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Template downloaded." });
    } catch {
      toast({ title: "Error", description: "Export failed.", variant: "destructive" });
    }
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      await apiService.useTemplate(template._id);
      localStorage.setItem("selectedTemplate", JSON.stringify(template));
      navigate("/?tab=builder");
      toast({ title: "Template loaded", description: `"${template.name}" opened in the builder.` });
    } catch {
      toast({ title: "Error", description: "Failed to load template.", variant: "destructive" });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      const response = await apiService.updateTemplate(selectedTemplate._id, editForm);
      if (response.success && response.data) {
        setTemplates((prev) =>
          prev.map((t) => (t._id === selectedTemplate._id ? response.data! : t)),
        );
        setIsEditDialogOpen(false);
        toast({ title: "Saved", description: "Template updated." });
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
      <LibraryPageLayout
        title="My Templates"
        description="Manage and organize your prompt templates"
      >
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </LibraryPageLayout>
    );
  }

  return (
    <LibraryPageLayout
      title="My Templates"
      description="Manage and organize your prompt templates"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="recent">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Database, label: "Total", value: templates.length },
          { icon: Users, label: "Public", value: templates.filter((t) => t.isPublic).length },
          { icon: Lock, label: "Private", value: templates.filter((t) => !t.isPublic).length },
          {
            icon: Eye,
            label: "Uses",
            value: templates.reduce((sum, t) => sum + (t.usageCount ?? 0), 0),
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

      {filteredTemplates.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="py-12 text-center">
            <Database className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No templates found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try different search terms or filters."
                : "Save a template from the builder (⌘/Ctrl + Alt + S)."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template._id} className="border-border/40">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="truncate">{template.name}</span>
                      {template.isPublic ? (
                        <Users className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                      )}
                    </CardTitle>
                    {template.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2 text-xs">
                      {template.category || "General"}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedTemplate(template); setIsViewDialogOpen(true); }}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyTemplate(template)}>
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportTemplate(template)}>
                        <Download className="mr-2 h-4 w-4" /> Export
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTemplate(template);
                          setEditForm({
                            name: template.name,
                            description: template.description,
                            category: template.category,
                            isPublic: template.isPublic,
                            tags: template.tags,
                            promptData: { ...template.promptData },
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteTemplate(template._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="line-clamp-1">
                    <span className="font-medium">Role:</span> {template.promptData?.role || "—"}
                  </p>
                  <p className="line-clamp-2 text-muted-foreground">
                    <span className="font-medium">Task:</span> {template.promptData?.task || "—"}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-3">
                    <span className="flex items-center">
                      <Eye className="mr-1 h-3 w-3" />
                      {template.usageCount ?? 0}
                    </span>
                    <span className="flex items-center">
                      <Star className="mr-1 h-3 w-3" />
                      {formatRating(template)}
                    </span>
                  </span>
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(template.createdAt)}
                  </span>
                </div>
                <Button size="sm" className="w-full" onClick={() => handleUseTemplate(template)}>
                  Use in builder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit template</DialogTitle>
            <DialogDescription>Update name, task, and visibility.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={editForm.name ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={editForm.description ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                value={editForm.category ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Task</Label>
              <Textarea
                rows={3}
                value={editForm.promptData?.task ?? ""}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    promptData: { ...p.promptData!, task: e.target.value },
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editForm.isPublic ?? false}
                onCheckedChange={(v) => setEditForm((p) => ({ ...p, isPublic: v }))}
              />
              <Label>Public template</Label>
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

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                <p><span className="font-medium">Role:</span> {selectedTemplate.promptData?.role}</p>
                <p><span className="font-medium">Task:</span> {selectedTemplate.promptData?.task}</p>
                {selectedTemplate.promptData?.tone && (
                  <p><span className="font-medium">Tone:</span> {selectedTemplate.promptData.tone}</p>
                )}
                {selectedTemplate.promptData?.outputFormat && (
                  <p><span className="font-medium">Format:</span> {selectedTemplate.promptData.outputFormat}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleCopyTemplate(selectedTemplate)}>
                  Copy
                </Button>
                <Button onClick={() => { setIsViewDialogOpen(false); handleUseTemplate(selectedTemplate); }}>
                  Use in builder
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </LibraryPageLayout>
  );
};

export default MyTemplates;
