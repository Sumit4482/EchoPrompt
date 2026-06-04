import { cn } from "@/lib/utils";
import type { PromptData } from "@/services/api";

const STEPS: { key: keyof PromptData; label: string }[] = [
  { key: "task", label: "Task" },
  { key: "role", label: "Role" },
  { key: "context", label: "Context" },
  { key: "tone", label: "Tone" },
  { key: "outputFormat", label: "Format" },
];

function isStepFilled(promptData: PromptData, key: keyof PromptData): boolean {
  return Boolean((promptData[key] as string | undefined)?.trim());
}

const BuilderProgress = ({ promptData }: { promptData: PromptData }) => (
  <div className="space-y-2">
    <div className="flex gap-1">
      {STEPS.map((step) => {
        const filled = isStepFilled(promptData, step.key);
        return (
          <div
            key={step.key}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              filled ? "bg-primary/55" : "bg-border/30",
            )}
            title={filled ? `${step.label} filled` : `${step.label} empty`}
          />
        );
      })}
    </div>
    <div className="flex justify-between text-[10px] px-0.5">
      {STEPS.map((step) => {
        const filled = isStepFilled(promptData, step.key);
        return (
          <span
            key={step.key}
            className={cn(
              "transition-colors",
              filled ? "text-foreground/70 font-medium" : "text-muted-foreground/50",
            )}
          >
            {step.label}
          </span>
        );
      })}
    </div>
  </div>
);

export default BuilderProgress;
