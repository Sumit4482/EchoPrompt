import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "./Header";
import { Button } from "@/components/ui/button";

interface LibraryPageLayoutProps {
  title: string;
  description: string;
  backTo?: string;
  children: ReactNode;
}

const LibraryPageLayout = ({
  title,
  description,
  backTo = "/",
  children,
}: LibraryPageLayoutProps) => (
  <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <main className="flex-1 overflow-y-auto pt-16">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6">
          <Link to={backTo}>
            <Button variant="ghost" size="sm" className="mb-3 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </main>
  </div>
);

export default LibraryPageLayout;
