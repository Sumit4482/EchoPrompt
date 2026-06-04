import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { apiService } from "@/services/api";
import { hasGeminiApiKey } from "@/lib/geminiKey";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface AiUsageHintProps {
  onConfigureKey?: () => void;
}

const AiUsageHint = ({ onConfigureKey }: AiUsageHintProps) => {
  const { isAuthenticated } = useAuth();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const ownKey = hasGeminiApiKey();

  useEffect(() => {
    if (ownKey) return;
    apiService
      .getAiQuota(ownKey)
      .then((r) => {
        if (r.success && r.data) {
          setRemaining(r.data.remaining);
          setLimit(r.data.limit);
        }
      })
      .catch(() => {});
  }, [ownKey, isAuthenticated]);

  if (ownKey) {
    return (
      <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
        Using your Gemini key — unlimited Enhance. Quota not used.
      </p>
    );
  }

  if (remaining === null) return null;

  return (
    <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
      <span>
        Free hosted Enhance: {remaining} of {limit} left today (resets midnight UTC).
        {isAuthenticated
          ? " Add your own key for unlimited."
          : " Sign in for a higher limit, or add your own key."}
      </span>
      {onConfigureKey && (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs text-primary"
          onClick={onConfigureKey}
        >
          Add Gemini key
        </Button>
      )}
    </p>
  );
};

export default AiUsageHint;
