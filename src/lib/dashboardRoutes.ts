export type DashboardSection = "templates" | "builder" | "community";

export function resolveDashboardSection(tab: string | null): DashboardSection {
  if (tab === "templates" || tab === "community") return tab;
  return "builder";
}

export function dashboardPath(section: DashboardSection): string {
  if (section === "builder") return "/";
  return `/?tab=${section}`;
}
