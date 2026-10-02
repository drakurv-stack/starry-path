import {
  BookOpen,
  Activity,
  Home as HomeIcon,
  Leaf,
  MessageCircle,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";

const items = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/garden", label: "Garden", icon: Leaf },
  { href: "/coach", label: "Coach", icon: MessageCircle },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/community", label: "Community", icon: Users },
  { href: "/urge-watch", label: "Urges", icon: Activity },
];

export function AppNav() {
  const [location, navigate] = useLocation();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-[388px] -translate-x-1/2 rounded-2xl border border-border bg-card p-2 elevation-2"
    >
      <div className="grid grid-cols-6 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = location === href || location.startsWith(`${href}/`);
          return (
            <button
              key={href}
              type="button"
              aria-current={active ? "page" : undefined}
              aria-label={label}
              onClick={() => navigate(href)}
              className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground elevation-1"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}