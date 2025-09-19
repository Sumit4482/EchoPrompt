import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  multiline?: boolean;
  className?: string;
  fieldName?: string; // For AI-powered suggestions
}

const SmartInput = ({ 
  value, 
  onChange, 
  placeholder, 
  suggestions = [], 
  multiline = false,
  className,
  fieldName = ''
}: SmartInputProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [autoCompletions, setAutoCompletions] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const quotaResetTimer = useRef<NodeJS.Timeout>();

  // getAICompletions function removed - logic moved to useEffect

  // getAISuggestions function removed - logic moved to useEffect

  // Memoized filtered suggestions to prevent infinite loops
  const filteredSuggestions = useMemo(() => {
    const allSuggestions = [...suggestions, ...aiSuggestions];
    
    if (value) {
      const filtered = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      return [...new Set(filtered)]; // Remove duplicates
    }
    return allSuggestions;
  }, [value, suggestions, aiSuggestions]);

  // Real-time AI suggestions and completions
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Clear completions and suggestions when value is empty
    if (!value || !fieldName) {
      setAutoCompletions([]);
      setAiSuggestions([]);
      return;
    }

    // Debounce AI requests to avoid too many API calls
    debounceTimer.current = setTimeout(async () => {
      try {
        setIsLoadingAI(true);
        
        // Only make AI requests for substantial text and specific fields to reduce quota usage
        const shouldUseAI = value.length >= 5 && ['task', 'context', 'role'].includes(fieldName) && !quotaExceeded;
        
        if (shouldUseAI) {
          // Alternate between completions and suggestions to reduce API calls
          const useCompletions = value.length >= 8 && value.endsWith(' ');
          
          if (useCompletions) {
            // Get AI completions for tab completion (only for longer phrases)
            try {
              const completionResponse = await apiService.getCompletions(fieldName, value);
              if (completionResponse.success && completionResponse.data?.completions) {
                setAutoCompletions(completionResponse.data.completions.slice(0, 3));
                setQuotaExceeded(false); // Reset if successful
              }
            } catch (error: any) {
              console.log('AI completions not available:', error);
              setAutoCompletions([]);
              
              // Check if it's a quota error
              if (error?.message?.includes('quota') || error?.message?.includes('429')) {
                setQuotaExceeded(true);
                toast({
                  title: "⏱️ AI Quota Reached",
                  description: "AI suggestions temporarily unavailable. Using local suggestions.",
                  duration: 3000,
                });
                
                // Reset quota state after 2 minutes
                if (quotaResetTimer.current) {
                  clearTimeout(quotaResetTimer.current);
                }
                quotaResetTimer.current = setTimeout(() => {
                  setQuotaExceeded(false);
                }, 120000); // 2 minutes
              }
            }
          } else {
            // Get AI suggestions (less frequent)
            try {
              const suggestionResponse = await apiService.getSuggestions(fieldName, value);
              if (suggestionResponse.success && suggestionResponse.data?.suggestions) {
                setAiSuggestions(suggestionResponse.data.suggestions.slice(0, 5));
                setQuotaExceeded(false); // Reset if successful
              }
            } catch (error: any) {
              console.log('AI suggestions not available:', error);
              setAiSuggestions([]);
              
              // Check if it's a quota error
              if (error?.message?.includes('quota') || error?.message?.includes('429')) {
                setQuotaExceeded(true);
                toast({
                  title: "⏱️ AI Quota Reached",
                  description: "AI suggestions temporarily unavailable. Using local suggestions.",
                  duration: 3000,
                });
              }
            }
          }
        }

      } catch (error) {
        console.error('Error fetching AI suggestions:', error);
        setAutoCompletions([]);
        setAiSuggestions([]);
      } finally {
        setIsLoadingAI(false);
      }
    }, 1000); // Increased debounce to 1 second to reduce API calls

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (quotaResetTimer.current) {
        clearTimeout(quotaResetTimer.current);
      }
    };
  }, [value, fieldName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (quotaResetTimer.current) {
        clearTimeout(quotaResetTimer.current);
      }
    };
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Auto-open dropdown when typing if there are suggestions or AI is working
    if (newValue.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [onChange]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const allSuggestions = [...autoCompletions, ...filteredSuggestions];
    
    if (e.key === 'Tab') {
      e.preventDefault();
      if (autoCompletions.length > 0) {
        // Tab completion with AI suggestions (prioritize AI completions)
        onChange(autoCompletions[0]);
        setIsOpen(false);
        setSelectedIndex(-1);
        toast({
          title: "✨ AI Completed",
          description: "Used AI-powered completion",
          duration: 1500,
        });
      } else if (filteredSuggestions.length > 0) {
        onChange(filteredSuggestions[0]);
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex(prev => 
        prev < allSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : allSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
        e.preventDefault();
        onChange(allSuggestions[selectedIndex]);
        setIsOpen(false);
        setSelectedIndex(-1);
        
        // Show toast for AI completion
        if (selectedIndex < autoCompletions.length) {
          toast({
            title: "🤖 AI Selected",
            description: "Applied AI suggestion",
            duration: 1500,
          });
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, [filteredSuggestions, autoCompletions, onChange, selectedIndex, toast]);

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <InputComponent
          ref={inputRef as any}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "bg-input/80 backdrop-blur-sm border-border/60 transition-all duration-300",
            "hover:border-primary/50 focus:border-primary focus:bg-input/90",
            "placeholder:text-muted-foreground/60",
            multiline && "min-h-[80px] resize-none",
            // AI active indicator
            (autoCompletions.length > 0 || isLoadingAI) && "border-primary/70 ring-1 ring-primary/20",
            className
          )}
        />
        
        {/* AI Indicator */}
        {(isLoadingAI || autoCompletions.length > 0 || quotaExceeded) && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {isLoadingAI ? (
              <Zap className="w-3 h-3 text-primary animate-pulse" />
            ) : autoCompletions.length > 0 ? (
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-medium">Tab</span>
              </div>
            ) : quotaExceeded ? (
              <div className="flex items-center space-x-1" title="AI quota exceeded - using local suggestions">
                <div className="w-3 h-3 rounded-full bg-orange-500/20 border border-orange-500/40"></div>
                <span className="text-xs text-orange-600 font-medium">Local</span>
              </div>
            ) : null}
          </div>
        )}
        
        {/* Suggestions dropdown button */}
        {suggestions.length > 0 && !isLoadingAI && autoCompletions.length === 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (filteredSuggestions.length > 0 || autoCompletions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-elegant max-h-80 overflow-y-auto">
          {isLoadingAI && (
            <div className="px-3 py-2 text-sm text-muted-foreground flex items-center">
              <Zap className="w-3 h-3 mr-2 animate-pulse text-primary" />
              AI is thinking...
            </div>
          )}
          
          {/* AI Auto-completions (Tab completion) */}
          {autoCompletions.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs font-medium text-primary border-b border-border/30 bg-primary/5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Completions
                  </span>
                  <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-xs font-bold">TAB</span>
                </div>
              </div>
              {autoCompletions.slice(0, 3).map((completion, index) => (
                <button
                  key={`completion-${index}`}
                  onClick={() => handleSuggestionClick(completion)}
                  className={cn(
                    "w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors duration-200 text-sm border-l-2",
                    selectedIndex === index ? "bg-accent/50 border-primary" : "border-transparent"
                  )}
                >
                  <div className="flex items-center">
                    <Zap className="w-3 h-3 mr-2 text-primary" />
                    <span className="font-medium">{completion}</span>
                  </div>
                  {index === 0 && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center">
                      <span className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs mr-1">TAB</span>
                      to complete
                    </div>
                  )}
                </button>
              ))}
            </>
          )}

          {/* Regular Suggestions */}
          {filteredSuggestions.length > 0 && (
            <>
              {autoCompletions.length > 0 && (
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground border-b border-border/30">
                  Suggestions
                </div>
              )}
              {filteredSuggestions.slice(0, 8).map((suggestion, index) => {
                const adjustedIndex = index + autoCompletions.length;
                return (
                  <button
                    key={`suggestion-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors duration-200 text-sm",
                      selectedIndex === adjustedIndex ? "bg-accent/50" : ""
                    )}
                  >
                    <div className="flex items-center">
                      <Sparkles className="w-3 h-3 mr-2 text-primary/70" />
                      {suggestion}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Helper text */}
          <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border/30 bg-muted/20">
            <div className="flex items-center justify-between">
              <span>
                <span className="font-medium text-primary">TAB</span> for AI completion • 
                <span className="font-medium">↑↓</span> navigate • 
                <span className="font-medium">Enter</span> select • 
                <span className="font-medium">Esc</span> close
              </span>
              {autoCompletions.length > 0 && (
                <span className="flex items-center text-primary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Ready
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartInput;