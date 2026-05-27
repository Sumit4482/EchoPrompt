import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiService, GeneratedPrompt } from '@/services/api';
import { Copy, Search } from 'lucide-react';

interface CommunityHubProps {
  onPromptUse: (prompt: GeneratedPrompt) => void;
  refreshTrigger?: number;
}

const CommunityHub: React.FC<CommunityHubProps> = ({ onPromptUse, refreshTrigger }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getPublicPrompts({ limit: 50, sort: 'createdAt', order: 'desc' });
      setPrompts(response.success && response.data ? response.data : []);
    } catch (error) {
      console.error('Error loading community prompts:', error);
      setPrompts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    if (refreshTrigger) {
      loadPrompts();
    }
  }, [refreshTrigger]);

  const filteredPrompts = prompts.filter((prompt) => {
    const query = searchQuery.toLowerCase();
    return (
      prompt.content.toLowerCase().includes(query) ||
      prompt.promptData?.task?.toLowerCase().includes(query) ||
      prompt.promptData?.role?.toLowerCase().includes(query) ||
      prompt.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Community</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Public prompts shared by users.</p>
        </div>
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-4">Loading prompts...</p>
      ) : filteredPrompts.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground border border-dashed border-border/40 rounded-xl">
          <p className="text-sm">No public prompts yet.</p>
          <p className="text-xs mt-1">Save a prompt as public to share it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPrompts.map((prompt, i) => (
            <Card key={prompt._id} className={`flex flex-col border-border/40 card-hover animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">
                  {prompt.promptData?.role || 'Prompt'}
                </CardTitle>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {prompt.promptData?.task || prompt.content.slice(0, 120)}
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-2 mt-auto space-y-3">
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs h-5 px-1.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{prompt.analytics?.views ?? 0} views</span>
                  <span>{prompt.analytics?.copies ?? 0} copies</span>
                </div>
                <Button className="w-full h-8 text-xs" onClick={() => onPromptUse(prompt)}>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Use prompt
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityHub;
