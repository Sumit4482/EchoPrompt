import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Star, 
  TrendingUp,
  Users,
  Clock,
  Award,
  Lightbulb,
  Target
} from 'lucide-react';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  completed: boolean;
  progress: number;
  lessons: number;
  icon: React.ReactNode;
}

const learningModules: LearningModule[] = [
  {
    id: 'ai-basics',
    title: 'AI Fundamentals',
    description: 'Learn the basics of AI and how to interact with AI systems effectively',
    duration: '15 min',
    difficulty: 'Beginner',
    category: 'Foundation',
    completed: false,
    progress: 0,
    lessons: 5,
    icon: <BookOpen className="w-6 h-6" />
  },
  {
    id: 'prompt-engineering',
    title: 'Prompt Engineering',
    description: 'Master the art of writing effective prompts for better AI responses',
    duration: '25 min',
    difficulty: 'Intermediate',
    category: 'Skills',
    completed: false,
    progress: 30,
    lessons: 8,
    icon: <Target className="w-6 h-6" />
  },
  {
    id: 'ai-tools-comparison',
    title: 'AI Tools Comparison',
    description: 'Understand which AI tools work best for different tasks',
    duration: '20 min',
    difficulty: 'Beginner',
    category: 'Tools',
    completed: false,
    progress: 0,
    lessons: 6,
    icon: <TrendingUp className="w-6 h-6" />
  },
  {
    id: 'advanced-techniques',
    title: 'Advanced Techniques',
    description: 'Learn advanced prompting techniques for complex tasks',
    duration: '35 min',
    difficulty: 'Advanced',
    category: 'Expertise',
    completed: false,
    progress: 0,
    lessons: 10,
    icon: <Award className="w-6 h-6" />
  },
  {
    id: 'business-applications',
    title: 'Business Applications',
    description: 'Apply AI to real business scenarios and workflows',
    duration: '30 min',
    difficulty: 'Intermediate',
    category: 'Business',
    completed: false,
    progress: 15,
    lessons: 7,
    icon: <Users className="w-6 h-6" />
  },
  {
    id: 'creative-ai',
    title: 'Creative AI',
    description: 'Unlock your creativity with AI-powered tools and techniques',
    duration: '20 min',
    difficulty: 'Beginner',
    category: 'Creative',
    completed: false,
    progress: 0,
    lessons: 5,
    icon: <Lightbulb className="w-6 h-6" />
  }
];

interface AILearningHubProps {
  onModuleStart: (module: LearningModule) => void;
}

const AILearningHub: React.FC<AILearningHubProps> = ({ onModuleStart }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const categories = ['All', 'Foundation', 'Skills', 'Tools', 'Expertise', 'Business', 'Creative'];
  
  const filteredModules = selectedCategory === 'All' 
    ? learningModules 
    : learningModules.filter(module => module.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalProgress = learningModules.reduce((acc, module) => acc + module.progress, 0) / learningModules.length;

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <BookOpen className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Learning Hub
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Master AI tools and techniques with our interactive learning modules. 
          Start from the basics and become an AI expert at your own pace.
        </p>
        
        {/* Overall Progress */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="transition-all"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Learning Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => (
          <Card 
            key={module.id}
            className="hover:shadow-lg transition-all duration-300 group border-border/30 hover:border-primary/50"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    {module.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {module.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {module.category} • {module.lessons} lessons
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getDifficultyColor(module.difficulty)}`}
                >
                  {module.difficulty}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                {module.description}
              </p>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Progress</span>
                  <span className="text-xs text-muted-foreground">{module.progress}%</span>
                </div>
                <Progress value={module.progress} className="h-1.5" />
              </div>
              
              {/* Module Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{module.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="w-3 h-3" />
                  <span>{module.lessons} lessons</span>
                </div>
              </div>
              
              {/* Action Button */}
              <Button 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                variant={module.completed ? "outline" : "default"}
                onClick={() => onModuleStart(module)}
              >
                {module.completed ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : module.progress > 0 ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Continue
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Learning
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Tips Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <span>💡 Quick Tips for AI Success</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">🎯 Be Specific</h4>
              <p className="text-muted-foreground">The more specific your prompt, the better the AI response</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🔄 Iterate and Improve</h4>
              <p className="text-muted-foreground">Refine your prompts based on the results you get</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">📝 Provide Context</h4>
              <p className="text-muted-foreground">Give AI the background information it needs</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🎨 Experiment</h4>
              <p className="text-muted-foreground">Try different approaches to find what works best</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AILearningHub;
