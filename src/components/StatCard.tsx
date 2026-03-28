import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  variant?: "default" | "primary" | "success" | "destructive";
}

const variantStyles = {
  default: "border-border/50",
  primary: "border-primary/30 stat-glow",
  success: "border-success/30",
  destructive: "border-destructive/30",
};

const iconStyles = {
  default: "bg-secondary text-secondary-foreground",
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  destructive: "bg-destructive/15 text-destructive",
};

export default function StatCard({ title, value, icon, subtitle, variant = "default" }: StatCardProps) {
  return (
    <div className={`glass-card p-5 ${variantStyles[variant]} animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-heading font-bold mt-1 animate-count-up">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${iconStyles[variant]}`}>{icon}</div>
      </div>
    </div>
  );
}
