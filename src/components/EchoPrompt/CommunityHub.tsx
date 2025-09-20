import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiService } from '@/services/api';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Star, 
  TrendingUp,
  Users,
  Clock,
  ThumbsUp,
  Download,
  Copy,
  Filter,
  Search
} from 'lucide-react';

interface CommunityPrompt {
  id: string;
  title: string;
  description: string;
  author: string;
  authorAvatar: string;
  category: string;
  tags: string[];
  likes: number;
  downloads: number;
  comments: number;
  createdAt: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  rating: number;
  isLiked: boolean;
  promptData: any;
}

const mockCommunityPrompts: CommunityPrompt[] = [
  {
    id: '1',
    title: 'Professional Email Generator',
    description: 'Generate professional emails for any business situation with perfect tone and structure',
    author: 'Sarah Chen',
    authorAvatar: 'SC',
    category: 'Business',
    tags: ['email', 'professional', 'business'],
    likes: 142,
    downloads: 89,
    comments: 23,
    createdAt: '2 hours ago',
    difficulty: 'Easy',
    rating: 4.8,
    isLiked: false,
    promptData: {
      role: 'Professional Email Writer',
      task: 'Write a professional email',
      context: 'Business communication',
      tone: 'Professional',
      outputFormat: 'Email',
      constraints: 'Use proper business etiquette and clear structure',
      audience: 'Business professionals',
      industry: 'Business',
      complexity: 'Easy'
    }
  },
  {
    id: '2',
    title: 'Code Review Assistant',
    description: 'Get comprehensive code reviews with suggestions for improvement and best practices',
    author: 'Alex Rodriguez',
    authorAvatar: 'AR',
    category: 'Programming',
    tags: ['code', 'review', 'programming'],
    likes: 98,
    downloads: 156,
    comments: 31,
    createdAt: '5 hours ago',
    difficulty: 'Advanced',
    rating: 4.9,
    isLiked: true,
    promptData: {
      role: 'Senior Software Engineer',
      task: 'Review the following code for best practices and potential issues',
      context: 'This is for a production application',
      tone: 'Professional',
      outputFormat: 'Markdown',
      constraints: 'Focus on security and performance',
      audience: 'Development team',
      industry: 'Technology',
      complexity: 'Advanced'
    }
  },
  {
    id: '3',
    title: 'Creative Story Starter',
    description: 'Generate engaging story beginnings with characters, setting, and plot hooks',
    author: 'Emma Wilson',
    authorAvatar: 'EW',
    category: 'Creative',
    tags: ['writing', 'creative', 'story'],
    likes: 76,
    downloads: 203,
    comments: 18,
    createdAt: '1 day ago',
    difficulty: 'Medium',
    rating: 4.6,
    isLiked: false,
    promptData: {
      role: 'Creative Writer',
      task: 'Create an engaging story beginning',
      context: 'Fiction writing with compelling characters and setting',
      tone: 'Creative',
      outputFormat: 'Story',
      constraints: 'Include character development and plot hooks',
      audience: 'General readers',
      industry: 'Creative Writing',
      complexity: 'Medium'
    }
  },
  {
    id: '4',
    title: 'Learning Path Creator',
    description: 'Create personalized learning paths for any subject with structured lessons',
    author: 'Dr. Michael Kim',
    authorAvatar: 'MK',
    category: 'Education',
    tags: ['education', 'learning', 'curriculum'],
    likes: 134,
    downloads: 78,
    comments: 45,
    createdAt: '2 days ago',
    difficulty: 'Medium',
    rating: 4.7,
    isLiked: true,
    promptData: {
      role: 'Educational Designer',
      task: 'Create a personalized learning path',
      context: 'Structured educational curriculum',
      tone: 'Educational',
      outputFormat: 'Learning Plan',
      constraints: 'Include clear objectives and milestones',
      audience: 'Students and learners',
      industry: 'Education',
      complexity: 'Medium'
    }
  },
  {
    id: '5',
    title: 'Social Media Content Planner',
    description: 'Generate engaging social media content with hashtags and posting schedules',
    author: 'Lisa Park',
    authorAvatar: 'LP',
    category: 'Marketing',
    tags: ['social media', 'marketing', 'content'],
    likes: 89,
    downloads: 167,
    comments: 29,
    createdAt: '3 days ago',
    difficulty: 'Easy',
    rating: 4.5,
    isLiked: false,
    promptData: {
      role: 'Social Media Manager',
      task: 'Create engaging social media content',
      context: 'Multi-platform social media campaign',
      tone: 'Casual',
      outputFormat: 'Social Media Posts',
      constraints: 'Include relevant hashtags and posting schedule',
      audience: 'Social media followers',
      industry: 'Social Media Marketing',
      complexity: 'Easy'
    }
  }
];

interface CommunityHubProps {
  onPromptUse: (prompt: CommunityPrompt) => void;
  refreshTrigger?: number; // When this changes, refresh the prompts
}

const CommunityHub: React.FC<CommunityHubProps> = ({ onPromptUse, refreshTrigger }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('trending');
  const [prompts, setPrompts] = useState(mockCommunityPrompts);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['All', 'Business', 'Programming', 'Creative', 'Education', 'Marketing', 'Productivity'];

  // Convert saved prompt to community format
  const convertSavedPromptToCommunity = (savedPrompt: any): CommunityPrompt => {
    return {
      id: savedPrompt._id || savedPrompt.id,
      title: savedPrompt.promptData?.role ? `${savedPrompt.promptData.role} Prompt` : 'Saved Prompt',
      description: `Generated prompt: ${savedPrompt.promptData?.task || 'Custom prompt'}`,
      author: 'You',
      authorAvatar: 'U',
      category: savedPrompt.promptData?.industry || 'General',
      tags: savedPrompt.tags || [savedPrompt.promptData?.role, savedPrompt.promptData?.industry].filter(Boolean),
      likes: 0,
      downloads: 0,
      comments: 0,
      createdAt: new Date(savedPrompt.createdAt).toLocaleDateString(),
      difficulty: savedPrompt.promptData?.complexity === 'Advanced' ? 'Advanced' : 
                 savedPrompt.promptData?.complexity === 'Intermediate' ? 'Medium' : 'Easy',
      rating: 4.5,
      isLiked: false,
      promptData: savedPrompt.promptData || {}
    };
  };

  // Fetch saved prompts and combine with mock data
  const fetchSavedPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getPrompts();
      if (response.success && response.data) {
        const savedPrompts = response.data.map(convertSavedPromptToCommunity);
        setPrompts([...mockCommunityPrompts, ...savedPrompts]);
      }
    } catch (error) {
      console.error('Error fetching saved prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved prompts on component mount
  useEffect(() => {
    fetchSavedPrompts();
  }, []);

  // Refresh prompts when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchSavedPrompts();
    }
  }, [refreshTrigger]);

  const handleLike = (promptId: string) => {
    setPrompts(prev => prev.map(prompt => 
      prompt.id === promptId 
        ? { 
            ...prompt, 
            isLiked: !prompt.isLiked,
            likes: prompt.isLiked ? prompt.likes - 1 : prompt.likes + 1
          }
        : prompt
    ));
  };

  const handleDownload = (promptId: string) => {
    setPrompts(prev => prev.map(prompt => 
      prompt.id === promptId 
        ? { ...prompt, downloads: prompt.downloads + 1 }
        : prompt
    ));
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          🌟 Community Hub
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover, share, and collaborate on the best AI prompts created by our community
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search prompts, tags, or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Sort by:</span>
              <Button
                variant={sortBy === 'trending' ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy('trending')}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Trending
              </Button>
              <Button
                variant={sortBy === 'newest' ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy('newest')}
              >
                <Clock className="w-4 h-4 mr-1" />
                Newest
              </Button>
              <Button
                variant={sortBy === 'popular' ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy('popular')}
              >
                <Heart className="w-4 h-4 mr-1" />
                Most Liked
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary">1,247</div>
            <div className="text-sm text-muted-foreground">Total Prompts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary">3,891</div>
            <div className="text-sm text-muted-foreground">Community Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary">15,672</div>
            <div className="text-sm text-muted-foreground">Downloads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary">4.8</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrompts.map((prompt) => (
          <Card key={prompt.id} className="hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {prompt.authorAvatar}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {prompt.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      by {prompt.author} • {prompt.createdAt}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getDifficultyColor(prompt.difficulty)}`}
                >
                  {prompt.difficulty}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                {prompt.description}
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {prompt.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{prompt.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{prompt.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Download className="w-4 h-4" />
                    <span>{prompt.downloads}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{prompt.comments}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex space-x-2">
                <Button 
                  className="flex-1"
                  onClick={() => onPromptUse(prompt)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Use Prompt
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleLike(prompt.id)}
                >
                  <Heart className={`w-4 h-4 ${prompt.isLiked ? 'text-red-500 fill-current' : ''}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownload(prompt.id)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default CommunityHub;
