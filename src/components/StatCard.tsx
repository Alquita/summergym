import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  variant?: "default" | "primary" | "success" | "destructive";
}

const variantStyles = {
  default: "border-border/40 hover:border-border/60",
  primary: "border-primary/20 hover:border-primary/40 stat-glow",
  success: "border-success/20 hover:border-success/30",
  destructive: "border-destructive/20 hover:border-destructive/30",
};

const iconStyles = {
  default: "bg-secondary text-secondary-foreground",
  primary: "bg-gradient-to-br from-primary/20 to-accent/20 text-primary",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
};

export default function StatCard({ title, value, icon, subtitle, variant = "default" }: StatCardProps) {
  return (
    <div className={`glass-card p-5 transition-all duration-300 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{title}</p>
          <p className="text-3xl font-heading font-bold mt-2 animate-count-up">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${iconStyles[variant]}`}>{icon}</div>
      </div>
    </div>
  );
}
