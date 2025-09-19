import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, Zap, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { apiService } from "@/services/api";

interface AIStatusIndicatorProps {
  isGenerating?: boolean;
  lastGenerationStatus?: 'success' | 'fallback' | null;
  className?: string;
}

const AIStatusIndicator = ({ 
  isGenerating = false, 
  lastGenerationStatus = null,
  className = "" 
}: AIStatusIndicatorProps) => {
  const [analytics, setAnalytics] = useState<{
    successRate: number;
    totalAttempts: number;
    successCount: number;
    fallbackCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiService.getAIGenerationAnalytics();
        if (response.success && response.data) {
          setAnalytics(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch AI analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const getStatusIcon = () => {
    if (isGenerating) {
      return <Clock className="w-3 h-3 animate-spin" />;
    }
    
    switch (lastGenerationStatus) {
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'fallback':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      default:
        return <Bot className="w-3 h-3" />;
    }
  };

  const getStatusText = () => {
    if (isGenerating) {
      return "Generating...";
    }
    
    switch (lastGenerationStatus) {
      case 'success':
        return "AI Enhanced";
      case 'fallback':
        return "Fallback Mode";
      default:
        return "AI Ready";
    }
  };

  const getStatusColor = () => {
    if (isGenerating) {
      return "bg-blue-500/20 text-blue-600 border-blue-500/30";
    }
    
    switch (lastGenerationStatus) {
      case 'success':
        return "bg-green-500/20 text-green-600 border-green-500/30";
      case 'fallback':
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge 
        variant="outline" 
        className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium ${getStatusColor()}`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </Badge>
      
      {analytics && analytics.totalAttempts > 0 && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <span>{Math.round(analytics.successRate)}%</span>
          <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
              style={{ width: `${analytics.successRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStatusIndicator;
