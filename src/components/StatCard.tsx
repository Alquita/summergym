import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  variant?: "default" | "primary" | "success" | "destructive" | "electric" | "violet";
}

const variantStyles: Record<string, string> = {
  default: "bg-card",
  primary: "bg-primary/10",
  success: "bg-success/10",
  destructive: "bg-destructive/10",
  electric: "bg-electric/10",
  violet: "bg-violet/10",
};

const iconStyles: Record<string, string> = {
  default: "bg-secondary text-secondary-foreground",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  electric: "bg-electric text-electric-foreground",
  violet: "bg-violet text-violet-foreground",
};

const valueStyles: Record<string, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  destructive: "text-destructive",
  electric: "text-electric",
  violet: "text-violet",
};

export default function StatCard({ title, value, icon, subtitle, variant = "default" }: StatCardProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className={`text-3xl font-heading font-bold mt-1 tabular-nums ${valueStyles[variant]}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
