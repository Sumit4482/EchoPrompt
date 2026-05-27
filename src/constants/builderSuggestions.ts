import { PromptData } from '@/services/api';

export type BuilderSuggestionField = keyof Pick<
  PromptData,
  | 'role'
  | 'task'
  | 'context'
  | 'tone'
  | 'outputFormat'
  | 'constraints'
  | 'responseLength'
  | 'audience'
  | 'industry'
  | 'mood'
  | 'language'
  | 'complexity'
>;

export type BuilderFieldSuggestions = Record<BuilderSuggestionField, string[]>;

/** Offline fallback — tech/engineering focused; superseded by API catalog when available */
export const STATIC_FIELD_SUGGESTIONS: BuilderFieldSuggestions = {
  role: [
    'Senior Software Engineer',
    'Software Architect',
    'Full Stack Developer',
    'Backend Engineer',
    'Frontend Engineer',
    'DevOps Engineer',
    'Site Reliability Engineer',
    'QA Engineer',
    'SDET',
    'Technical Product Manager',
    'Data Analyst',
    'Data Engineer',
    'Machine Learning Engineer',
    'Security Engineer',
    'Engineering Manager',
  ],
  task: [
    'Review pull request for code quality and security',
    'Write unit tests for existing service',
    'Design REST API for new feature',
    'Debug production error from stack trace',
    'Create technical design document',
    'Refactor legacy module to improve testability',
    'Write SQL queries for product metrics',
    'Draft user stories with acceptance criteria',
    'Document architecture decision (ADR)',
    'Plan database migration with zero downtime',
  ],
  context: [
    'Node.js TypeScript microservice on AWS',
    'React SPA with REST backend',
    'Legacy monolith being split into services',
    'Production incident — need root cause analysis',
    'CI/CD via GitHub Actions',
    'PostgreSQL with read replicas',
    'Team follows trunk-based development',
  ],
  tone: [
    'Technical and precise',
    'RFC-style formal',
    'Peer-review constructive',
    'Direct and concise',
    'Tutorial explanatory',
  ],
  outputFormat: [
    'Markdown with code blocks',
    'TypeScript code',
    'OpenAPI 3.0 spec',
    'JSON',
    'Mermaid diagram',
    'PR description template',
    'ADR format',
    'Jest test outline',
  ],
  constraints: [
    'TypeScript strict mode',
    'Include unit test examples',
    'Follow SOLID principles',
    'Explain time/space complexity',
    'Handle edge cases explicitly',
    'OWASP security considerations',
  ],
  responseLength: [
    'Brief (code + short explanation)',
    'Medium (structured sections)',
    'Comprehensive (design doc length)',
  ],
  audience: [
    'Senior engineers',
    'Software architects',
    'Backend team',
    'Frontend team',
    'QA and SDETs',
    'Product managers',
    'Data analysts',
    'Engineering managers',
  ],
  industry: [
    'B2B SaaS',
    'Developer Tools',
    'FinTech',
    'HealthTech',
    'E-commerce',
    'Cybersecurity',
    'AI/ML Platform',
  ],
  mood: [
    'Analytical',
    'Methodical',
    'Urgent (incident)',
    'Neutral',
  ],
  language: [
    'English',
    'TypeScript',
    'JavaScript',
    'Python',
    'SQL',
  ],
  complexity: [
    'Junior-friendly',
    'Mid-level engineer',
    'Senior engineer',
    'Architecture level',
  ],
};
