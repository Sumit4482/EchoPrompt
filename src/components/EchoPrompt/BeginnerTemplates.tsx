import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { apiService, Template } from '@/services/api';

const PAGE_SIZE = 9;

interface BeginnerTemplatesProps {
  onTemplateSelect: (template: Template) => void;
}

const BeginnerTemplates: React.FC<BeginnerTemplatesProps> = ({ onTemplateSelect }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'usageCount' | 'rating' | 'createdAt'>('usageCount');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Load categories once
  useEffect(() => {
    apiService.getCategories()
      .then(r => { if (r.success && r.data) setCategories(r.data); })
      .catch(() => {});
  }, []);

  const fetchTemplates = useCallback(async (
    pg: number,
    q: string,
    cat: string,
    sort: string,
    append = false
  ) => {
    append ? setIsLoadingMore(true) : setIsLoading(true);
    try {
      const response = await apiService.getPublicTemplates({
        page: pg,
        limit: PAGE_SIZE,
        search: q || undefined,
        category: cat !== 'all' ? cat : undefined,
        sort,
        order: sort === 'createdAt' ? 'desc' : 'desc',
      });

      if (response.success && response.data) {
        setTemplates(prev => append ? [...prev, ...response.data!] : response.data!);
        setTotal(response.pagination?.total ?? response.data.length);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      if (!append) setTemplates([]);
    } finally {
      append ? setIsLoadingMore(false) : setIsLoading(false);
    }
  }, []);

  // Refetch from page 1 when filters change
  useEffect(() => {
    setPage(1);
    fetchTemplates(1, search, category, sortBy);
  }, [search, category, sortBy, fetchTemplates]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTemplates(nextPage, search, category, sortBy, true);
  };

  const hasMore = templates.length < total;

  // Skeleton cards
  const SkeletonCard = () => (
    <Card className="flex flex-col border-border/40">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="h-4 w-3/4 bg-muted/40 rounded animate-pulse" />
        <div className="h-3 w-full bg-muted/30 rounded animate-pulse mt-2" />
        <div className="h-3 w-2/3 bg-muted/20 rounded animate-pulse mt-1" />
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <div className="h-3 w-20 bg-muted/30 rounded animate-pulse mb-3" />
        <div className="h-8 w-full bg-muted/30 rounded animate-pulse" />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Templates</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLoading ? 'Loading…' : `${total} template${total !== 1 ? 's' : ''} — click to load into builder`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 text-xs w-full sm:w-40">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-8 text-xs w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="usageCount">Most Used</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="createdAt">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border/40 rounded-xl">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No templates found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || category !== 'all' ? 'Try adjusting your filters.' : 'Seed the database or create templates from the builder.'}
          </p>
          {(search || category !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => { setSearch(''); setCategory('all'); }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((template, i) => (
              <Card
                key={template._id}
                className={`flex flex-col border-border/40 card-hover animate-slide-up stagger-${Math.min(i + 1, 6)}`}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium leading-snug">{template.name}</CardTitle>
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  {template.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{template.description}</p>
                  )}
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-2 mt-auto space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">{template.category}</Badge>
                    <span className="text-xs text-muted-foreground">{template.usageCount} uses</span>
                    {template.rating.average > 0 && (
                      <span className="text-xs text-muted-foreground">★ {template.rating.average.toFixed(1)}</span>
                    )}
                  </div>
                  <Button
                    className="w-full h-8 text-xs"
                    variant="outline"
                    onClick={() => onTemplateSelect(template)}
                  >
                    Use template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-2"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isLoadingMore ? 'Loading…' : `Load more (${total - templates.length} remaining)`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BeginnerTemplates;
