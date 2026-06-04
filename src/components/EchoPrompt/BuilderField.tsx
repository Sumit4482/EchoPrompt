import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import SmartInput from "./SmartInput";
import { BuilderSuggestionField } from "@/constants/builderSuggestions";
import { useDebouncedFieldSearch } from "@/hooks/useDebouncedFieldSearch";
import { mergeSuggestions } from "@/lib/mergeSuggestions";
import { cn } from "@/lib/utils";

type BuilderFieldProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  contextText?: string;
  suggestionField?: BuilderSuggestionField;
  multiline?: boolean;
  maxSuggestions?: number;
  googleStyle?: boolean;
  className?: string;
};

const BuilderField = ({
  label,
  hint,
  value,
  onChange,
  placeholder,
  suggestions = [],
  contextText = "",
  suggestionField,
  multiline,
  maxSuggestions = 12,
  googleStyle,
  className,
}: BuilderFieldProps) => {
  const { hits: searchHits } = useDebouncedFieldSearch(
    suggestionField,
    value,
    Boolean(googleStyle && suggestionField),
  );

  const mergedSuggestions = useMemo(
    () => mergeSuggestions(searchHits, suggestions, 80),
    [searchHits, suggestions],
  );

  return (
    <div className={cn("space-y-2 relative", className)}>
      <div>
        <Label className="text-sm font-medium text-foreground/90">{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground/75 mt-0.5">{hint}</p> : null}
      </div>
      <SmartInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        suggestions={mergedSuggestions}
        contextText={contextText}
        suggestionField={suggestionField}
        multiline={multiline}
        maxSuggestions={maxSuggestions}
        googleStyle={googleStyle}
      />
    </div>
  );
};

export default BuilderField;
