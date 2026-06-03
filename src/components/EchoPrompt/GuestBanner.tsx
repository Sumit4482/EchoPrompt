import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

const GuestBanner = () => (
  <Alert className="mb-3 py-3 border-primary/30 bg-primary/5">
    <Info className="h-4 w-4 shrink-0" />
    <AlertDescription className="ml-2 space-y-2">
      <p className="text-xs font-medium text-foreground">Try EchoPrompt in 3 steps</p>
      <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-0.5">
        <li>
          Open <strong className="text-foreground">Blueprints</strong> or <strong className="text-foreground">Community</strong> and pick a starting point
        </li>
        <li>
          Go to <strong className="text-foreground">Builder</strong> → fill fields → <strong className="text-foreground">Generate with AI</strong> (free daily, no API key)
        </li>
        <li>
          <Link to="/login" className="text-primary underline underline-offset-2">
            Sign in
          </Link>{" "}
          to save prompts to your library
        </li>
      </ol>
      <div className="flex gap-2 pt-1">
        <Button asChild size="sm" className="h-7 text-xs">
          <Link to="/?tab=builder">Start building</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-7 text-xs">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    </AlertDescription>
  </Alert>
);

export default GuestBanner;
