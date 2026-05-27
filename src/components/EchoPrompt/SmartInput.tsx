import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BuilderSuggestionField } from "@/constants/builderSuggestions";
import { trackSuggestionSelect } from "@/lib/suggestionFeedback";

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  multiline?: boolean;
  className?: string;
  maxSuggestions?: number;
  /** When set, records dropdown selection to improve future rankings */
  suggestionField?: BuilderSuggestionField;
}

function rankSuggestions(suggestions: string[], query: string): string[] {
  const valid = suggestions.filter((s): s is string => Boolean(s && typeof s === "string"));
  const q = query.trim().toLowerCase();

  if (!q) return valid;

  return valid
    .map((suggestion) => {
      const lower = suggestion.toLowerCase();
      let score = -1;

      if (lower === q) {
        score = 1000;
      } else if (lower.startsWith(q)) {
        score = 500 + (100 - Math.min(lower.length, 100));
      } else if (lower.split(/\s+/).some((word) => word.startsWith(q))) {
        score = 300;
      } else if (lower.includes(q)) {
        const idx = lower.indexOf(q);
        score = 200 - idx;
      }

      return score >= 0 ? { suggestion, score } : null;
    })
    .filter((item): item is { suggestion: string; score: number } => item !== null)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.suggestion);
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);

  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-foreground">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

const SmartInput = ({
  value = "",
  onChange,
  placeholder,
  suggestions = [],
  multiline = false,
  className,
  maxSuggestions = 8,
  suggestionField,
}: SmartInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(
    () => rankSuggestions(suggestions, value).slice(0, maxSuggestions),
    [suggestions, value, maxSuggestions]
  );

  const showDropdown =
    isOpen && isFocused && suggestions.length > 0 && (value.trim() === "" || filteredSuggestions.length > 0);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [value, filteredSuggestions.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openSuggestions = useCallback(() => {
    if (suggestions.length > 0) setIsOpen(true);
  }, [suggestions.length]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      openSuggestions();
    },
    [onChange, openSuggestions]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      onChange(suggestion);
      if (suggestionField) {
        trackSuggestionSelect(suggestionField, suggestion);
      }
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.focus();
    },
    [onChange, suggestionField]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        if (!isOpen && suggestions.length > 0) {
          e.preventDefault();
          setIsOpen(true);
          setSelectedIndex(0);
          return;
        }
        if (filteredSuggestions.length > 0) {
          e.preventDefault();
          setIsOpen(true);
          setSelectedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
        }
      } else if (e.key === "ArrowUp") {
        if (filteredSuggestions.length > 0) {
          e.preventDefault();
          setIsOpen(true);
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
        }
      } else if (e.key === "Enter" && selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        e.preventDefault();
        handleSuggestionSelect(filteredSuggestions[selectedIndex]);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    },
    [filteredSuggestions, handleSuggestionSelect, isOpen, selectedIndex, suggestions.length]
  );

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <InputComponent
          ref={inputRef as React.Ref<HTMLInputElement & HTMLTextAreaElement>}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            openSuggestions();
          }}
          onBlur={() => {
            // Delay so mousedown on a suggestion still registers
            window.setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) {
                setIsFocused(false);
              }
            }, 120);
          }}
          placeholder={placeholder}
          className={cn(
            "bg-input/80 backdrop-blur-sm border-border/60 transition-all duration-300",
            "hover:border-primary/50 focus:border-primary focus:bg-input/90",
            "placeholder:text-muted-foreground/60",
            suggestions.length > 0 && "pr-8",
            multiline && "min-h-[80px] resize-none",
            className
          )}
          autoComplete="off"
        />

        {suggestions.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setIsFocused(true);
              inputRef.current?.focus();
              setIsOpen((open) => !open);
            }}
            className={cn(
              "absolute right-2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground",
              multiline ? "top-2" : "top-1/2 -translate-y-1/2"
            )}
          >
            <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
          </Button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-elegant max-h-80 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={cn(
                "w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors duration-200 text-sm text-muted-foreground",
                selectedIndex === index && "bg-accent/50"
              )}
            >
              <HighlightMatch text={suggestion} query={value} />
            </button>
          ))}

          <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border/30 bg-muted/20">
            <span className="font-medium">↑↓</span> navigate •
            <span className="font-medium"> Enter</span> select •
            <span className="font-medium"> Esc</span> close
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartInput;
