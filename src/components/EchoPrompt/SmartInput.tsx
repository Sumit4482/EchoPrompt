import { useState, useRef, useEffect, useCallback, useMemo, useId } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BuilderSuggestionField } from "@/constants/builderSuggestions";
import { trackSuggestionSelect } from "@/lib/suggestionFeedback";
import { getInlineCompletion, rankSuggestions } from "@/lib/suggestionRanking";

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  contextText?: string;
  multiline?: boolean;
  className?: string;
  maxSuggestions?: number;
  suggestionField?: BuilderSuggestionField;
  /** Google-like: inline ghost text, suggestions from 1st character, word-by-word match */
  googleStyle?: boolean;
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

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

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
  googleStyle = false,
}: SmartInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState<DropdownPosition | null>(null);
  const portalId = useId();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rankOptions = useMemo(
    () => ({
      context: contextText,
      googleStyle,
      minScore: googleStyle ? (value.trim().length >= 1 ? 40 : 0) : value.trim().length >= 2 ? 50 : 0,
    }),
    [contextText, googleStyle, value],
  );

  const filteredSuggestions = useMemo(
    () => rankSuggestions(suggestions, value, rankOptions).slice(0, maxSuggestions),
    [suggestions, value, rankOptions, maxSuggestions],
  );

  const browseWhenEmpty = useMemo(
    () => rankSuggestions(suggestions, "", { context: contextText, googleStyle }).slice(0, maxSuggestions),
    [suggestions, contextText, googleStyle, maxSuggestions],
  );

  const displayList =
    value.trim() && filteredSuggestions.length === 0 ? browseWhenEmpty : filteredSuggestions;

  const topSuggestion = displayList[0];

  const inlineSuffix = useMemo(() => {
    if (!googleStyle || !isFocused || selectedIndex >= 0) return null;
    return getInlineCompletion(value, topSuggestion);
  }, [googleStyle, isFocused, selectedIndex, value, topSuggestion]);

  const showNoExactMatch =
    value.trim().length >= 2 && filteredSuggestions.length === 0 && browseWhenEmpty.length > 0;

  const showDropdown =
    isOpen &&
    isFocused &&
    suggestions.length > 0 &&
    (googleStyle ? displayList.length > 0 : value.trim() === "" || displayList.length > 0);

  const highlightQuery = value.trim();

  const updateDropdownPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 16;
    const spaceAbove = rect.top - gap - 16;
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(280, Math.max(120, openUp ? spaceAbove : spaceBelow));

    setDropdownPos({
      left: rect.left,
      width: rect.width,
      maxHeight,
      top: openUp ? rect.top - gap - maxHeight : rect.bottom + gap,
    });
  }, []);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [value, displayList.length]);

  useEffect(() => {
    if (!showDropdown) {
      setDropdownPos(null);
      return;
    }
    updateDropdownPosition();
    const onScrollOrResize = () => updateDropdownPosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [showDropdown, updateDropdownPosition, displayList.length]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      const portal = document.getElementById(portalId);
      if (portal?.contains(target)) return;
      setIsOpen(false);
      setIsFocused(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [portalId]);

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

  const acceptInlineCompletion = useCallback(() => {
    if (!topSuggestion || !inlineSuffix) return false;
    onChange(topSuggestion);
    if (suggestionField) {
      trackSuggestionSelect(suggestionField, topSuggestion);
    }
    setIsOpen(false);
    setSelectedIndex(-1);
    return true;
  }, [inlineSuffix, onChange, suggestionField, topSuggestion]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (googleStyle && (e.key === "Tab" || e.key === "ArrowRight") && inlineSuffix) {
        const el = inputRef.current;
        const atEnd =
          el &&
          "selectionStart" in el &&
          (el.selectionStart === value.length && el.selectionEnd === value.length);
        if (atEnd && selectedIndex < 0) {
          e.preventDefault();
          acceptInlineCompletion();
          return;
        }
      }

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
    [
      acceptInlineCompletion,
      displayList,
      googleStyle,
      handleSuggestionSelect,
      inlineSuffix,
      isOpen,
      selectedIndex,
      suggestions.length,
      value.length,
    ],
  );

  const InputComponent = multiline ? Textarea : Input;

  const inputPadding = cn(
    "rounded-xl border-border/25 transition-all duration-200",
    "hover:border-border/40 focus:border-primary/30 focus:ring-2 focus:ring-primary/10",
    "placeholder:text-muted-foreground/50 text-sm leading-relaxed",
    suggestions.length > 0 && "pr-9",
    multiline && "min-h-[88px] resize-none",
    !multiline && "h-10",
    showDropdown && "ring-2 ring-primary/15 border-primary/30",
    googleStyle && inlineSuffix ? "bg-transparent relative z-[1]" : "bg-background/40 focus:bg-background/60",
    className,
  );

  const dropdownPanel =
    showDropdown && dropdownPos ? (
      <div
        id={portalId}
        role="listbox"
        style={{
          position: "fixed",
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
          maxHeight: dropdownPos.maxHeight,
          zIndex: 9999,
        }}
        className="rounded-xl border border-border/40 bg-popover shadow-xl overflow-y-auto overscroll-contain"
      >
        {showNoExactMatch && (
          <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border/20 bg-muted/30 sticky top-0">
            Suggestions
          </div>
        )}
        {displayList.map((suggestion, index) => (
          <button
            key={`${suggestion}-${index}`}
            type="button"
            role="option"
            aria-selected={selectedIndex === index}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSuggestionSelect(suggestion)}
            className={cn(
              "w-full text-left px-3 py-2.5 text-sm transition-colors block",
              "text-muted-foreground hover:bg-accent hover:text-foreground",
              selectedIndex === index && "bg-accent text-foreground",
            )}
          >
            <HighlightMatch text={suggestion} query={highlightQuery} />
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div ref={containerRef} className="relative isolate">
      <div className="relative">
        {googleStyle && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl",
              "border border-transparent px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
              multiline ? "min-h-[88px]" : "flex items-center min-h-10",
            )}
          >
            <span className="invisible">{value}</span>
            {inlineSuffix ? (
              <span className="text-muted-foreground/45">{inlineSuffix}</span>
            ) : null}
          </div>
        )}

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
              const portal = document.getElementById(portalId);
              if (
                !containerRef.current?.contains(document.activeElement) &&
                !portal?.contains(document.activeElement)
              ) {
                setIsFocused(false);
              }
            }, 120);
          }}
          placeholder={placeholder}
          className={inputPadding}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
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
              "absolute right-2 h-6 w-6 p-0 z-[2] text-muted-foreground hover:text-foreground",
              multiline ? "top-2" : "top-1/2 -translate-y-1/2",
            )}
          >
            <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
          </Button>
        )}
      </div>

      {googleStyle && isFocused && inlineSuffix && (
        <p className="text-[10px] text-muted-foreground/60 mt-1 px-0.5">
          Tab or → to autocomplete · ↑↓ to pick
        </p>
      )}

      {typeof document !== "undefined" && dropdownPanel
        ? createPortal(dropdownPanel, document.body)
        : null}
    </div>
  );
};

export default SmartInput;
