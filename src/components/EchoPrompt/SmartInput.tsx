import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles } from "lucide-react";
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
  value, 
  onChange, 
  placeholder, 
  suggestions = [], 
  multiline = false,
  className 
}: SmartInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(suggestions);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions);
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && filteredSuggestions.length > 0) {
      e.preventDefault();
      onChange(filteredSuggestions[0]);
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

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
            className
          )}
        />
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
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-elegant max-h-60 overflow-y-auto">
          {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg text-sm"
            >
              <div className="flex items-center">
                <Sparkles className="w-3 h-3 mr-2 text-primary/70" />
                {suggestion}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartInput;