import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Mail, 
  MessageSquare, 
  Code, 
  BookOpen, 
  Briefcase,
  Heart,
  Lightbulb,
  Target,
  Users
} from 'lucide-react';

interface BeginnerTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  useCase: string;
  promptData: {
    role: string;
    task: string;
    context: string;
    tone: string;
    outputFormat: string;
  };
}

const beginnerTemplates: BeginnerTemplate[] = [
  {
    id: 'email-professional',
    title: 'Professional Email',
    description: 'Write a clear, professional email for any business situation',
    category: 'Communication',
    icon: <Mail className="w-6 h-6" />,
    difficulty: 'Easy',
    useCase: 'Business emails, follow-ups, introductions',
    promptData: {
      role: 'Professional Communication Expert',
      task: 'Write a professional email',
      context: 'Business communication that is clear and respectful',
      tone: 'Professional and courteous',
      outputFormat: 'Email format'
    }
  },
  {
    id: 'social-media-post',
    title: 'Social Media Post',
    description: 'Create engaging social media content for any platform',
    category: 'Marketing',
    icon: <MessageSquare className="w-6 h-6" />,
    difficulty: 'Easy',
    useCase: 'Instagram, Twitter, LinkedIn, Facebook posts',
    promptData: {
      role: 'Social Media Marketing Expert',
      task: 'Create an engaging social media post',
      context: 'Social media platform with specific audience',
      tone: 'Engaging and authentic',
      outputFormat: 'Social media post with hashtags'
    }
  },
  {
    id: 'learning-explanation',
    title: 'Learning Explanation',
    description: 'Explain complex topics in simple, easy-to-understand terms',
    category: 'Education',
    icon: <BookOpen className="w-6 h-6" />,
    difficulty: 'Easy',
    useCase: 'Teaching, learning, explaining concepts',
    promptData: {
      role: 'Expert Teacher and Educator',
      task: 'Explain a complex topic in simple terms',
      context: 'Educational setting for better understanding',
      tone: 'Clear and encouraging',
      outputFormat: 'Step-by-step explanation with examples'
    }
  },
  {
    id: 'code-explanation',
    title: 'Code Explanation',
    description: 'Get clear explanations of code and programming concepts',
    category: 'Programming',
    icon: <Code className="w-6 h-6" />,
    difficulty: 'Medium',
    useCase: 'Learning to code, understanding existing code',
    promptData: {
      role: 'Senior Software Engineer and Code Reviewer',
      task: 'Explain this code clearly and comprehensively',
      context: 'Educational environment for learning programming',
      tone: 'Technical but accessible',
      outputFormat: 'Code explanation with examples and best practices'
    }
  },
  {
    id: 'job-application',
    title: 'Job Application',
    description: 'Craft compelling cover letters and resume content',
    category: 'Career',
    icon: <Briefcase className="w-6 h-6" />,
    difficulty: 'Medium',
    useCase: 'Job applications, career advancement',
    promptData: {
      role: 'Career Coach and HR Professional',
      task: 'Help with job application materials',
      context: 'Professional job application process',
      tone: 'Confident and professional',
      outputFormat: 'Professional application materials'
    }
  },
  {
    id: 'creative-writing',
    title: 'Creative Writing',
    description: 'Generate creative content, stories, and ideas',
    category: 'Creative',
    icon: <Heart className="w-6 h-6" />,
    difficulty: 'Easy',
    useCase: 'Stories, poems, creative projects',
    promptData: {
      role: 'Creative Writing Expert and Storyteller',
      task: 'Create engaging creative content',
      context: 'Creative writing project',
      tone: 'Imaginative and engaging',
      outputFormat: 'Creative writing piece'
    }
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving',
    description: 'Get structured approaches to solve any problem',
    category: 'Problem Solving',
    icon: <Lightbulb className="w-6 h-6" />,
    difficulty: 'Medium',
    useCase: 'Business problems, personal challenges, decision making',
    promptData: {
      role: 'Problem-Solving Expert and Business Consultant',
      task: 'Provide a structured approach to solve this problem',
      context: 'Problem-solving situation requiring analysis',
      tone: 'Analytical and solution-focused',
      outputFormat: 'Structured problem-solving framework'
    }
  },
  {
    id: 'goal-setting',
    title: 'Goal Setting',
    description: 'Create actionable plans to achieve your goals',
    category: 'Productivity',
    icon: <Target className="w-6 h-6" />,
    difficulty: 'Easy',
    useCase: 'Personal goals, project planning, life planning',
    promptData: {
      role: 'Goal-Setting Coach and Productivity Expert',
      task: 'Create an actionable plan to achieve this goal',
      context: 'Goal achievement and personal development',
      tone: 'Motivational and practical',
      outputFormat: 'Step-by-step action plan with milestones'
    }
  },
  {
    id: 'team-communication',
    title: 'Team Communication',
    description: 'Improve team meetings, collaboration, and communication',
    category: 'Teamwork',
    icon: <Users className="w-6 h-6" />,
    difficulty: 'Medium',
    useCase: 'Team meetings, project updates, collaboration',
    promptData: {
      role: 'Team Communication Expert and Leadership Coach',
      task: 'Improve team communication and collaboration',
      context: 'Professional team environment',
      tone: 'Collaborative and clear',
      outputFormat: 'Team communication strategy and guidelines'
    }
  }
];

interface BeginnerTemplatesProps {
  onTemplateSelect: (template: BeginnerTemplate) => void;
}

const BeginnerTemplates: React.FC<BeginnerTemplatesProps> = ({ onTemplateSelect }) => {
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
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          🚀 Quick Start Templates
        </h2>
        <p className="text-muted-foreground">
          Choose a template to get started instantly - no technical knowledge required!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {beginnerTemplates.map((template) => (
          <Card 
            key={template.id}
            className="hover:shadow-lg transition-all duration-300 cursor-pointer border-border/30 hover:border-primary/50 group"
            onClick={() => onTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    {template.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {template.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.category}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getDifficultyColor(template.difficulty)}`}
                >
                  {template.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                {template.description}
              </p>
              <div className="space-y-2">
                <div className="text-xs font-medium text-foreground">
                  💡 Perfect for:
                </div>
                <p className="text-xs text-muted-foreground">
                  {template.useCase}
                </p>
              </div>
              <Button 
                className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                variant="outline"
                size="sm"
              >
                Use This Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default BeginnerTemplates;
