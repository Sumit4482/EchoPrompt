import { Link } from "react-router-dom";
import { Edit3, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DashboardSection,
  dashboardPath,
} from "@/lib/dashboardRoutes";

const SECTIONS: {
  id: DashboardSection;
  label: string;
  shortLabel: string;
  icon: typeof Zap;
}[] = [
  { id: "builder", label: "Builder", shortLabel: "Build", icon: Edit3 },
  { id: "templates", label: "Blueprints", shortLabel: "Plans", icon: Zap },
  { id: "community", label: "Community", shortLabel: "Share", icon: Users },
];

interface DashboardNavProps {
  active: DashboardSection;
}

const DashboardNav = ({ active }: DashboardNavProps) => (
  <aside
    className={cn(
      "shrink-0 flex flex-col border-r border-border/15 bg-card/30",
      "w-[4.25rem] md:w-44",
    )}
    aria-label="Main navigation"
  >
    <nav className="flex flex-col gap-0.5 p-2 md:p-3 flex-1">
      {SECTIONS.map(({ id, label, shortLabel, icon: Icon }) => {
        const isActive = active === id;
        return (
          <Link
            key={id}
            to={dashboardPath(id)}
            replace
            title={label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col md:flex-row items-center md:gap-2.5 rounded-xl px-2 py-2 md:px-2.5 md:py-2 transition-colors w-full no-underline",
              "text-muted-foreground hover:text-foreground hover:bg-muted/30",
              isActive && "bg-primary/10 text-foreground border border-primary/20 shadow-sm",
            )}
          >
            <Icon
              className={cn(
                "w-[1.125rem] h-[1.125rem] shrink-0",
                isActive ? "text-primary" : "opacity-70",
              )}
            />
            <span className="hidden md:block text-sm font-medium truncate">{label}</span>
            <span className="md:hidden text-[9px] font-medium leading-none mt-1 opacity-80">
              {shortLabel}
            </span>
          </Link>
        );
      })}
    </nav>
  </aside>
);

export default DashboardNav;
