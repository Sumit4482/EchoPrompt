import type { PromptData } from "@/services/api";

/** When user picks this exact task from suggestions, fill empty detail fields. */
export const TASK_FIELD_BUNDLES: Record<string, Partial<PromptData>> = {
  "Create social media content": {
    role: "Social Media Manager",
    context: "Multi-platform social media campaign",
    tone: "Casual",
    outputFormat: "Social Media Posts",
    audience: "Social media followers",
    industry: "Social Media Marketing",
    complexity: "Beginner",
  },
  "Write an engaging blog post": {
    role: "Content Writer",
    context: "SEO-optimized content for website",
    tone: "Engaging",
    outputFormat: "Blog Post",
    audience: "General readers",
    industry: "Content Marketing",
    complexity: "Intermediate",
  },
  "Create email marketing campaign": {
    role: "Email Marketing Specialist",
    context: "Product launch email sequence",
    tone: "Professional",
    outputFormat: "Email",
    audience: "Email subscribers",
    industry: "E-commerce",
    complexity: "Advanced",
  },
  "Review the following code for best practices and potential issues": {
    role: "Senior Software Engineer",
    context: "This is for a production application",
    tone: "Professional",
    outputFormat: "Markdown",
    constraints: "Focus on security and performance",
    audience: "Development team",
    industry: "Technology",
    complexity: "Advanced",
  },
  "Write comprehensive API documentation": {
    role: "Technical Writer",
    context: "REST API for authentication system",
    tone: "Technical",
    outputFormat: "Markdown",
    audience: "Developers",
    industry: "Technology",
    complexity: "Advanced",
  },
  "Create a comprehensive design brief for a mobile app": {
    role: "UX Designer",
    context: "E-commerce mobile application",
    tone: "Creative",
    outputFormat: "Structured Document",
    audience: "Design team and stakeholders",
    industry: "E-commerce",
    complexity: "Intermediate",
  },
};

export function fillEmptyFromBundle(
  current: PromptData,
  bundle: Partial<PromptData>,
): PromptData {
  const next = { ...current };
  for (const [key, value] of Object.entries(bundle)) {
    if (!value || key === "task") continue;
    const k = key as keyof PromptData;
    if (!(next[k] as string | undefined)?.trim()) (next[k] as string) = value;
  }
  return next;
}

export function applyTaskFieldBundle(
  current: PromptData,
  task: string,
): PromptData {
  const bundle = TASK_FIELD_BUNDLES[task.trim()];
  const next = { ...current, task };
  if (!bundle) return next;
  return fillEmptyFromBundle(next, bundle);
}
