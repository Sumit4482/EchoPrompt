import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  multiline?: boolean;
  className?: string;
}

const SmartInput = ({ 
  value = '', 
  onChange, 
  placeholder, 
  suggestions = [], 
  multiline = false,
  className
}: SmartInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on current value
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion && typeof suggestion === 'string' && value && suggestion.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Auto-open dropdown when typing if there are suggestions
    if (newValue.length > 0 && suggestions.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [onChange, suggestions.length]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        e.preventDefault();
        onChange(filteredSuggestions[selectedIndex]);
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, [filteredSuggestions, onChange, selectedIndex]);

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <InputComponent
          ref={inputRef as any}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length > 0 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "bg-input/80 backdrop-blur-sm border-border/60 transition-all duration-300",
            "hover:border-primary/50 focus:border-primary focus:bg-input/90",
            "placeholder:text-muted-foreground/60",
            multiline && "min-h-[80px] resize-none",
            className
          )}
        />
        
        {/* Suggestions dropdown button */}
        {suggestions.length > 0 && (
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
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-elegant max-h-80 overflow-y-auto">
          {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
            <button
              key={`suggestion-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                "w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors duration-200 text-sm",
                selectedIndex === index ? "bg-accent/50" : ""
              )}
            >
              {suggestion}
            </button>
          ))}

          {/* Helper text */}
          <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border/30 bg-muted/20">
            <span className="font-medium">↑↓</span> navigate • 
            <span className="font-medium">Enter</span> select • 
            <span className="font-medium">Esc</span> close
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartInput;