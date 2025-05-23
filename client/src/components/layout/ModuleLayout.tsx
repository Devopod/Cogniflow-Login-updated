import { ReactNode } from "react";
import { useLocation } from "wouter";
import ErpNavigation from "@/components/ErpNavigation";
import { cn } from "@/lib/utils";

interface ModuleLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  navigation: Array<{
    title: string;
    path: string;
    isActive: (path: string) => boolean;
  }>;
}

export default function ModuleLayout({
  children,
  title,
  description,
  actions,
  navigation,
}: ModuleLayoutProps) {
  const [location] = useLocation();

  return (
    <ErpNavigation>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>

        <div className="border-b">
          <nav className="flex">
            {navigation.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, "", item.path);
                  const navEvent = new PopStateEvent("popstate");
                  window.dispatchEvent(navEvent);
                }}
                className={cn(
                  "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                  item.isActive(location)
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {item.title}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </ErpNavigation>
  );
}