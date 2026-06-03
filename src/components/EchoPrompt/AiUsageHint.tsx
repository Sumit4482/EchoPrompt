import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { apiService } from "@/services/api";
import { hasGeminiApiKey } from "@/lib/geminiKey";
import { useAuth } from "@/contexts/AuthContext";

const AiUsageHint = () => {
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
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        Using your Gemini key — unlimited AI generations.
      </p>
    );
  }

  if (remaining === null) return null;

  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
      <Sparkles className="w-3.5 h-3.5 text-primary" />
      Free hosted AI: {remaining} of {limit} generations left today.
      {isAuthenticated ? " Add your own key in the profile menu for unlimited." : " Sign in for a higher limit."}
    </p>
  );
};

export default AiUsageHint;
