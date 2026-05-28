import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  variant?: "default" | "primary" | "success" | "destructive" | "electric" | "violet";
}

const variantStyles: Record<string, string> = {
  default: "from-secondary/40 to-secondary/10 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]",
  primary: "from-primary/15 via-accent/10 to-transparent hover:shadow-[0_0_50px_-10px_hsl(var(--primary)/0.55)]",
  success: "from-success/15 via-lime/10 to-transparent hover:shadow-[0_0_50px_-10px_hsl(var(--success)/0.45)]",
  destructive: "from-destructive/15 via-accent/10 to-transparent hover:shadow-[0_0_50px_-10px_hsl(var(--destructive)/0.45)]",
  electric: "from-electric/15 via-violet/10 to-transparent hover:shadow-[0_0_50px_-10px_hsl(var(--electric)/0.45)]",
  violet: "from-violet/15 via-accent/10 to-transparent hover:shadow-[0_0_50px_-10px_hsl(var(--violet)/0.45)]",
};

const iconStyles: Record<string, string> = {
  default: "bg-secondary text-secondary-foreground",
  primary: "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30",
  success: "bg-gradient-to-br from-success to-lime text-success-foreground shadow-lg shadow-success/30",
  destructive: "bg-gradient-to-br from-destructive to-accent text-destructive-foreground shadow-lg shadow-destructive/30",
  electric: "bg-gradient-to-br from-electric to-violet text-electric-foreground shadow-lg shadow-electric/30",
  violet: "bg-gradient-to-br from-violet to-accent text-violet-foreground shadow-lg shadow-violet/30",
};

const valueStyles: Record<string, string> = {
  default: "text-foreground",
  primary: "gradient-text",
  success: "text-success",
  destructive: "text-destructive",
  electric: "text-electric",
  violet: "text-violet",
};

export default function StatCard({ title, value, icon, subtitle, variant = "default" }: StatCardProps) {
  return (
    <div className={`glass-card glass-card-hover relative overflow-hidden p-5 bg-gradient-to-br ${variantStyles[variant]} group`}>
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500 from-current to-transparent" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">{title}</p>
          <p className={`text-4xl font-heading font-bold mt-2 animate-count-up tabular-nums ${valueStyles[variant]}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-2xl shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
