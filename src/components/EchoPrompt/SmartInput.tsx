import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BuilderSuggestionField } from "@/constants/builderSuggestions";
import { trackSuggestionSelect } from "@/lib/suggestionFeedback";
import { rankSuggestions } from "@/lib/suggestionRanking";

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  /** Task + role text — boosts suggestions when this field is empty or being typed */
  contextText?: string;
  multiline?: boolean;
  className?: string;
  maxSuggestions?: number;
  suggestionField?: BuilderSuggestionField;
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
  contextText = "",
  multiline = false,
  className,
  maxSuggestions = 10,
  suggestionField,
}: SmartInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(
    () =>
      rankSuggestions(suggestions, value, {
        context: contextText,
        minScore: value.trim().length >= 2 ? 50 : 0,
      }).slice(0, maxSuggestions),
    [suggestions, value, contextText, maxSuggestions],
  );

  const browseWhenEmpty = useMemo(
    () =>
      rankSuggestions(suggestions, "", { context: contextText }).slice(0, maxSuggestions),
    [suggestions, contextText, maxSuggestions],
  );

  const displayList =
    value.trim() && filteredSuggestions.length === 0 ? browseWhenEmpty : filteredSuggestions;

  const showNoExactMatch =
    value.trim().length >= 2 && filteredSuggestions.length === 0 && browseWhenEmpty.length > 0;

  const showDropdown =
    isOpen &&
    isFocused &&
    suggestions.length > 0 &&
    (value.trim() === "" || displayList.length > 0);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [value, displayList.length]);

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
      onChange(e.target.value);
      openSuggestions();
    },
    [onChange, openSuggestions],
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
    [onChange, suggestionField],
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
        if (displayList.length > 0) {
          e.preventDefault();
          setIsOpen(true);
          setSelectedIndex((prev) => (prev < displayList.length - 1 ? prev + 1 : 0));
        }
      } else if (e.key === "ArrowUp") {
        if (displayList.length > 0) {
          e.preventDefault();
          setIsOpen(true);
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayList.length - 1));
        }
      } else if (e.key === "Enter" && selectedIndex >= 0 && displayList[selectedIndex]) {
        e.preventDefault();
        handleSuggestionSelect(displayList[selectedIndex]);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    },
    [displayList, handleSuggestionSelect, isOpen, selectedIndex, suggestions.length],
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
            className,
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
              multiline ? "top-2" : "top-1/2 -translate-y-1/2",
            )}
          >
            <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
          </Button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-elegant max-h-80 overflow-y-auto">
          {showNoExactMatch && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border/30 bg-muted/15">
              No exact match — related picks for your task:
            </div>
          )}

          {displayList.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={cn(
                "w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors duration-200 text-sm text-muted-foreground",
                selectedIndex === index && "bg-accent/50",
              )}
            >
              <HighlightMatch text={suggestion} query={value.trim() || contextText.split(" ").slice(-1)[0] || ""} />
            </button>
          ))}

          <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border/30 bg-muted/20">
            <span className="font-medium">↑↓</span> navigate ·
            <span className="font-medium"> Enter</span> select
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartInput;
