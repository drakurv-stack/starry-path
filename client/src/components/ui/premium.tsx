import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const ScreenContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { maxWidth?: string }
>(({ className, children, maxWidth = "420px", ...props }, ref) => (
  <div
    ref={ref}
    className={cn("min-h-dvh app-bg text-foreground", className)}
    {...props}
  >
    <div 
      className="mx-auto w-full px-5 py-8 page-in"
      style={{ maxWidth }}
    >
      {children}
    </div>
  </div>
));
ScreenContainer.displayName = "ScreenContainer";

export const GlassCard = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { glow?: boolean; hover?: boolean }
>(({ className, glow = false, hover = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "glass rounded-[1.5rem] border border-white/10 p-6 relative overflow-hidden",
      glow && "glow",
      hover && "transition-all duration-300 hover:bg-white/[0.08] hover:border-white/15 active:scale-[0.99]",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
GlassCard.displayName = "GlassCard";

export const GradientButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: "default" | "lg" }
>(({ className, size = "default", children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "grad-pill shine w-full rounded-full font-semibold tracking-tight text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
      size === "default" && "px-5 py-4 text-[15px]",
      size === "lg" && "px-6 py-5 text-base font-bold",
      className
    )}
    {...props}
  >
    <span className="inline-flex items-center justify-center gap-2">
      {children}
    </span>
  </button>
));
GradientButton.displayName = "GradientButton";

export const GhostButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "w-full rounded-full border border-white/10 bg-white/5 px-5 py-4 text-[15px] font-semibold text-white/85 transition-all hover:bg-white/10 active:scale-[0.99]",
      className
    )}
    {...props}
  >
    {children}
  </button>
));
GhostButton.displayName = "GhostButton";

export const IconButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "p-2.5 rounded-full hover:bg-white/5 text-white/70 transition-all active:scale-95",
      className
    )}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = "IconButton";

interface HeaderProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  centered?: boolean;
}

export function Header({ title, subtitle, kicker, onBack, rightElement, centered = false }: HeaderProps) {
  return (
    <header className={cn("flex items-center justify-between mb-6", centered && "text-center")}>
      {onBack ? (
        <IconButton onClick={onBack} className="-ml-2" data-testid="button-back">
          <ChevronLeft className="h-6 w-6" />
        </IconButton>
      ) : (
        <div className="w-10" />
      )}
      
      <div className={cn("flex-1", centered && "text-center")}>
        {kicker && (
          <div className="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase mb-1">
            {kicker}
          </div>
        )}
        <div className="text-sm font-bold text-white tracking-tight">{title}</div>
        {subtitle && (
          <div className="text-xs text-white/50 mt-0.5">{subtitle}</div>
        )}
      </div>
      
      {rightElement ? rightElement : <div className="w-10" />}
    </header>
  );
}

export const StatPill = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    icon?: React.ReactNode;
    label: string;
    value: string | number;
    accent?: "default" | "success" | "warning" | "danger";
  }
>(({ className, icon, label, value, accent = "default", ...props }, ref) => {
  const accentStyles = {
    default: "border-white/10 bg-white/5",
    success: "border-emerald-500/20 bg-emerald-500/10",
    warning: "border-amber-500/20 bg-amber-500/10",
    danger: "border-rose-500/20 bg-rose-500/10",
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border p-4",
        accentStyles[accent],
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-[11px] text-white/50 font-medium">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-white tracking-tight">
        {value}
      </div>
    </div>
  );
});
StatPill.displayName = "StatPill";

export const Chip = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    selected?: boolean;
    accent?: "default" | "cyan" | "purple" | "amber" | "rose";
  }
>(({ className, selected = false, accent = "default", children, ...props }, ref) => {
  const accentStyles = {
    default: selected ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]" : "bg-white/5 border-white/10 text-white/60",
    cyan: selected ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.15)]" : "bg-white/5 border-white/10 text-white/60",
    purple: selected ? "bg-purple-500/20 border-purple-500/40 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.15)]" : "bg-white/5 border-white/10 text-white/60",
    amber: selected ? "bg-amber-500/20 border-amber-500/40 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.15)]" : "bg-white/5 border-white/10 text-white/60",
    rose: selected ? "bg-rose-500/20 border-rose-500/40 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]" : "bg-white/5 border-white/10 text-white/60",
  };
  
  return (
    <button
      ref={ref}
      className={cn(
        "px-4 py-2.5 rounded-2xl border text-[12px] font-bold transition-all active:scale-95 hover:bg-white/10",
        accentStyles[accent],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
Chip.displayName = "Chip";

export const ProgressBar = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: number; max?: number }
>(({ className, value, max = 100, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-2 w-full rounded-full bg-white/10 overflow-hidden", className)}
    {...props}
  >
    <motion.div
      className="h-full grad-pill rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    />
  </div>
));
ProgressBar.displayName = "ProgressBar";

export const ActionCard = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    accent?: "default" | "cyan" | "green" | "rose";
    badge?: React.ReactNode;
  }
>(({ className, icon, title, subtitle, accent = "default", badge, ...props }, ref) => {
  const accentOverlay = {
    default: "from-white/5 to-transparent",
    cyan: "from-cyan-500/10 to-transparent",
    green: "from-emerald-500/10 to-transparent",
    rose: "from-rose-500/10 to-transparent",
  };
  
  return (
    <button
      ref={ref}
      className={cn(
        "glass relative rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:bg-white/[0.08] hover:border-white/15 active:scale-[0.98]",
        className
      )}
      {...props}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 rounded-3xl pointer-events-none", accentOverlay[accent])} />
      
      <div className="relative">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
          {icon}
        </div>
        <div className="mt-4 text-[15px] font-semibold text-white tracking-tight">
          {title}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-white/60 leading-relaxed">
            {subtitle}
          </div>
        )}
      </div>
      
      {badge}
    </button>
  );
});
ActionCard.displayName = "ActionCard";

export const SectionLabel = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-[10px] font-black tracking-[0.25em] text-white/40 uppercase mb-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
SectionLabel.displayName = "SectionLabel";

interface CarouselDotsProps {
  total: number;
  current: number;
  onChange?: (index: number) => void;
}

export function CarouselDots({ total, current, onChange }: CarouselDotsProps) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={cn(
            "h-2 flex-1 max-w-8 rounded-full transition-all duration-300",
            i === current
              ? "bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)]"
              : "bg-white/15 hover:bg-white/25"
          )}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

export const PageTransition = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const FadeIn = ({ 
  children, 
  className,
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);
