import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

interface StarRatingProps {
  promptId: string;
  ratingCount?: number;
  initialRating?: number;
  ownerId?: string;
  size?: "sm" | "md";
  onRated?: (averageRating: number, totalRatings: number) => void;
}

const StarRating = ({
  promptId,
  ratingCount = 0,
  initialRating = 0,
  ownerId,
  size = "sm",
  onRated,
}: StarRatingProps) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hover, setHover] = useState(0);
  const [displayAvg, setDisplayAvg] = useState(initialRating);
  const [count, setCount] = useState(ratingCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const iconClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const isOwner =
    Boolean(user?.id && ownerId && user.id.toString() === ownerId.toString());

  if (isOwner) {
    return (
      <p className="text-xs text-muted-foreground">Your prompt — ratings from others only</p>
    );
  }

  const handleRate = async (value: number) => {
    if (!isAuthenticated) {
      toast({ title: "Sign in to rate", description: "Community ratings require an account." });
      navigate("/login");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await apiService.ratePrompt(promptId, value);
      if (result.success && result.data) {
        setDisplayAvg(result.data.averageRating);
        setCount(result.data.totalRatings);
        onRated?.(result.data.averageRating, result.data.totalRatings);
        toast({ title: "Thanks for rating!" });
      }
    } catch (error) {
      toast({
        title: "Rating failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-1">
      {count === 0 && (
        <p className="text-xs text-muted-foreground">No ratings yet — be the first</p>
      )}
      <div className="flex items-center gap-2">
      <div className="flex items-center" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={isSubmitting}
            className="p-0.5 text-muted-foreground hover:text-amber-400 disabled:opacity-50"
            onMouseEnter={() => setHover(value)}
            onClick={() => handleRate(value)}
            aria-label={`Rate ${value} stars`}
          >
            <Star
              className={cn(
                iconClass,
                (hover || Math.round(displayAvg)) >= value && "fill-amber-400 text-amber-400",
              )}
            />
          </button>
        ))}
      </div>
      {count > 0 && (
        <span className="text-xs text-muted-foreground">
          {displayAvg.toFixed(1)} ({count})
        </span>
      )}
      </div>
    </div>
  );
};

export default StarRating;
