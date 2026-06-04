import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { dashboardPath } from "@/lib/dashboardRoutes";

interface GuestBannerProps {
  /** Shorter banner on the builder screen */
  compact?: boolean;
}

const GuestBanner = ({ compact = false }: GuestBannerProps) => {
  if (compact) {
    return (
      <Alert className="py-2 border-border/20 bg-muted/15">
        <AlertDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Copy and build free — optional Enhance uses hosted AI or your own key.</span>
          <Link to="/login" className="text-primary underline underline-offset-2">
            Sign in to save
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-3 py-3 border-primary/30 bg-primary/5">
      <Info className="h-4 w-4 shrink-0" />
      <AlertDescription className="ml-2 space-y-2">
        <p className="text-xs font-medium text-foreground">Try EchoPrompt in 3 steps</p>
        <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-0.5">
          <li>
            Open <strong className="text-foreground">Blueprints</strong> or{" "}
            <strong className="text-foreground">Community</strong> for a starting point
          </li>
          <li>
            Use <strong className="text-foreground">Builder</strong> → copy your structured prompt
          </li>
          <li>
            <Link to="/login" className="text-primary underline underline-offset-2">
              Sign in
            </Link>{" "}
            to save to your library
          </li>
        </ol>
        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" className="h-7 text-xs">
            <Link to={dashboardPath("builder")}>Start building</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-7 text-xs">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default GuestBanner;
