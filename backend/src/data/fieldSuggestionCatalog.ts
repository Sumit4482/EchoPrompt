import { SUGGESTION_FIELDS, SuggestionField } from '../constants/suggestionFields';

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim().replace(/\s+/g, ' ');
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function combine(prefixes: string[], items: string[]): string[] {
  const out: string[] = [];
  for (const prefix of prefixes) {
    for (const item of items) {
      out.push(`${prefix} ${item}`);
    }
  }
  return out;
}

function buildRoleSuggestions(): string[] {
  const seniorities = [
    'Junior',
    'Mid-level',
    'Senior',
    'Lead',
    'Principal',
    'Staff',
    'Associate',
  ];
  const engineering = [
    'Software Engineer',
    'Full Stack Developer',
    'Frontend Engineer',
    'Backend Engineer',
    'Mobile Developer',
    'iOS Engineer',
    'Android Engineer',
    'Software Architect',
    'Solutions Architect',
    'Cloud Architect',
    'DevOps Engineer',
    'Site Reliability Engineer',
    'Platform Engineer',
    'Infrastructure Engineer',
    'Security Engineer',
    'Application Security Engineer',
    'QA Engineer',
    'SDET',
    'Test Automation Engineer',
    'Performance Engineer',
    'Data Engineer',
    'Machine Learning Engineer',
    'MLOps Engineer',
    'AI Engineer',
    'Prompt Engineer',
    'Embedded Systems Engineer',
    'Game Developer',
    'Blockchain Developer',
  ];
  const productAndData = [
    'Technical Product Manager',
    'Product Manager',
    'Product Owner',
    'Business Analyst',
    'Data Analyst',
    'Analytics Engineer',
    'BI Developer',
    'Scrum Master',
    'Agile Coach',
    'Engineering Manager',
    'Technical Program Manager',
  ];
  const designAndDocs = [
    'UX Engineer',
    'Developer Advocate',
    'Technical Writer',
    'API Designer',
  ];
  return unique([
    ...combine(seniorities, engineering),
    ...combine(seniorities, productAndData),
    ...designAndDocs,
    'Open Source Maintainer',
    'Code Reviewer',
  ]);
}

function buildTaskSuggestions(): string[] {
  const actions = [
    'Write',
    'Review',
    'Refactor',
    'Debug',
    'Design',
    'Implement',
    'Document',
    'Test',
    'Optimize',
    'Migrate',
    'Analyze',
    'Estimate',
    'Plan',
    'Explain',
    'Compare',
    'Generate',
    'Convert',
    'Validate',
    'Automate',
    'Troubleshoot',
  ];
  const deliverables = [
    'a REST API specification',
    'GraphQL schema and resolvers',
    'unit tests with Jest',
    'integration tests for microservices',
    'E2E tests with Playwright',
    'a pull request description',
    'code review feedback',
    'a technical design document',
    'an architecture decision record (ADR)',
    'a system design for scalability',
    'database schema and migrations',
    'SQL queries for analytics',
    'a data pipeline with validation',
    'CI/CD pipeline configuration',
    'Dockerfile and compose setup',
    'Kubernetes deployment manifests',
    'monitoring and alerting rules',
    'a postmortem for production incident',
    'runbook for on-call engineers',
    'user stories with acceptance criteria',
    'sprint backlog refinement notes',
    'a bug report reproduction steps',
    'regression test plan',
    'performance profiling report',
    'security threat model',
    'OAuth2 authentication flow',
    'caching strategy for high traffic',
    'React component with TypeScript',
    'Node.js Express middleware',
    'error handling and logging strategy',
    'API rate limiting approach',
    'feature flag rollout plan',
    'legacy monolith decomposition plan',
    'event-driven architecture outline',
    'README for open source library',
    'SDK usage examples',
    'OpenAPI documentation',
    'sequence diagram for service calls',
    'ER diagram for relational model',
  ];
  const standalone = [
    'Explain this stack trace and root cause',
    'Suggest fixes for failing unit tests',
    'Break down a large epic into implementable tasks',
    'Write commit messages following conventional commits',
    'Draft RFC for new platform capability',
    'Create test cases from requirements',
    'Map user flow to API endpoints',
    'Identify N+1 query problems and fixes',
    'Propose database indexes for slow queries',
    'Review PR for SOLID and clean code',
    'Generate mock data for local development',
    'Write regex to parse log lines',
    'Compare monolith vs microservices trade-offs',
    'Define SLIs and SLOs for a service',
    'Create checklist for production release',
    'Summarize sprint demo talking points',
    'Translate business rules into pseudocode',
    'Design idempotent webhook handler',
    'Plan zero-downtime database migration',
    'Audit dependencies for security vulnerabilities',
  ];
  return unique([...combine(actions, deliverables), ...standalone]);
}

function buildContextSuggestions(): string[] {
  const stacks = [
    'React and TypeScript frontend',
    'Node.js Express backend',
    'Python FastAPI service',
    'Java Spring Boot microservice',
    'Go gRPC service',
    '.NET Web API',
    'PostgreSQL relational database',
    'MongoDB document store',
    'Redis caching layer',
    'AWS serverless architecture',
    'Kubernetes on EKS',
    'GitHub Actions CI pipeline',
  ];
  const situations = [
    'production outage with customer impact',
    'legacy codebase with poor test coverage',
    'greenfield MVP with tight deadline',
    'high-traffic e-commerce checkout',
    'B2B SaaS multi-tenant platform',
    'regulated fintech environment',
    'healthcare HIPAA compliance',
    'real-time data streaming pipeline',
    'mobile app offline-first sync',
    'open source library maintenance',
    'team doing trunk-based development',
    'distributed team across time zones',
  ];
  const phrases = stacks.flatMap((stack) =>
    situations.map((sit) => `Building ${stack} for ${sit}`)
  );
  const extras = [
    'Follow company coding standards',
    'Target Node 20 LTS runtime',
    'Assume microservices with REST between services',
    'Include time and space complexity where relevant',
    'Prefer TypeScript strict mode patterns',
    'Use 12-factor app principles',
    'Consider backward-compatible API changes',
    'Include rollback strategy',
    'Reference existing ADRs and conventions',
    'Optimize for developer experience in local setup',
    'Security-first: validate all inputs',
    'Accessibility WCAG 2.1 AA for UI work',
  ];
  return unique([...phrases.slice(0, 120), ...extras]);
}

const TONE_BASE = [
  'Technical and precise',
  'Professional',
  'Direct and concise',
  'RFC-style formal',
  'Peer-review constructive',
  'Tutorial explanatory',
  'Incident-report factual',
  'Architecture-neutral',
  'Pragmatic engineering',
  'Skeptical and rigorous',
  'Collaborative',
  'Documentation-clear',
];

const OUTPUT_FORMAT_BASE = [
  'Markdown',
  'Markdown with code blocks',
  'JSON',
  'YAML',
  'OpenAPI 3.0 spec',
  'Plain Text',
  'Bullet Points',
  'Numbered List',
  'Table',
  'Mermaid diagram',
  'Sequence diagram (text)',
  'ER diagram (text)',
  'TypeScript code',
  'JavaScript code',
  'Python code',
  'SQL',
  'Shell script',
  'Jest test file outline',
  'PR description template',
  'ADR format',
  'User story + acceptance criteria',
  'Checklist',
  'Diff-style review comments',
];

const CONSTRAINT_BASE = [
  'Use TypeScript with strict types',
  'Follow SOLID principles',
  'Include unit test examples',
  'No pseudocode — production-ready snippets',
  'Explain Big O complexity',
  'Handle edge cases explicitly',
  'Include error handling patterns',
  'Follow REST best practices',
  'Use idiomatic code for the language',
  'Avoid deprecated APIs',
  'Prefer composition over inheritance',
  'Keep functions under 30 lines',
  'Add inline comments for non-obvious logic',
  'Include security considerations (OWASP)',
  'No breaking changes to public API',
  'Support Node 20+ only',
  'Use async/await, not callbacks',
  'Include sample request/response payloads',
  'Reference official docs where applicable',
  'Do not invent library versions',
];

const RESPONSE_LENGTH_BASE = [
  'Minimal (code only)',
  'Brief (1-2 paragraphs + code)',
  'Short (1 screen)',
  'Medium (structured sections)',
  'Long (full design doc)',
  'Comprehensive (RFC-length)',
  'Bullet summary only',
  'Under 200 words',
  'Under 500 words',
];

const AUDIENCE_BASE = [
  'Junior developers',
  'Senior engineers',
  'Software architects',
  'Backend team',
  'Frontend team',
  'Full stack team',
  'QA and SDETs',
  'DevOps/SRE',
  'Product managers',
  'Technical product owners',
  'Data analysts',
  'Data engineers',
  'Engineering managers',
  'On-call engineers',
  'Open source contributors',
  'Code reviewers',
  'Non-technical stakeholders',
  'Security team',
  'Platform team',
];

const INDUSTRY_BASE = [
  'B2B SaaS',
  'Developer Tools',
  'FinTech',
  'HealthTech',
  'E-commerce',
  'EdTech',
  'Cybersecurity',
  'Cloud Infrastructure',
  'AI/ML Platform',
  'Gaming',
  'IoT',
  'Enterprise Software',
  'Startup MVP',
  'Open Source',
  'Government Tech',
  'AdTech',
  'Logistics Tech',
  'PropTech',
];

const MOOD_BASE = [
  'Analytical',
  'Calm under pressure',
  'Urgent (incident)',
  'Methodical',
  'Curious',
  'Skeptical',
  'Confident',
  'Neutral',
  'Cautious',
];

const LANGUAGE_BASE = [
  'English',
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'Go',
  'C#',
  'Rust',
  'Kotlin',
  'Swift',
  'SQL',
  'Bash',
  'Spanish (comments)',
  'French (comments)',
];

const COMPLEXITY_BASE = [
  'Junior-friendly',
  'Mid-level engineer',
  'Senior engineer',
  'Staff+ depth',
  'Architecture level',
  'Interview-level rigor',
  'Production operations',
  'Proof-of-concept only',
  'Deep dive',
];

export function buildSuggestionCatalog(): Record<SuggestionField, string[]> {
  return {
    role: buildRoleSuggestions(),
    task: buildTaskSuggestions(),
    context: buildContextSuggestions(),
    tone: unique(TONE_BASE),
    outputFormat: unique(OUTPUT_FORMAT_BASE),
    constraints: unique(CONSTRAINT_BASE),
    responseLength: unique(RESPONSE_LENGTH_BASE),
    audience: unique(AUDIENCE_BASE),
    industry: unique(INDUSTRY_BASE),
    mood: unique(MOOD_BASE),
    language: unique(LANGUAGE_BASE),
    complexity: unique(COMPLEXITY_BASE),
  };
}

export function buildCatalogDocuments(): Array<{
  field: SuggestionField;
  value: string;
  weight: number;
  source: 'catalog';
}> {
  const catalog = buildSuggestionCatalog();
  const docs: Array<{ field: SuggestionField; value: string; weight: number; source: 'catalog' }> = [];

  for (const field of SUGGESTION_FIELDS) {
    const values = catalog[field];
    values.forEach((value, index) => {
      docs.push({
        field,
        value,
        weight: Math.max(1, values.length - index),
        source: 'catalog',
      });
    });
  }

  return docs;
}

export function getCatalogStats(): Record<SuggestionField, number> {
  const catalog = buildSuggestionCatalog();
  return SUGGESTION_FIELDS.reduce(
    (acc, field) => {
      acc[field] = catalog[field].length;
      return acc;
    },
    {} as Record<SuggestionField, number>
  );
}
