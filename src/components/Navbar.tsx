import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, DollarSign, Menu, X } from "lucide-react";
import { useState } from "react";
import { Notification } from "../lib/types";
import NotificationPanel from "./NotificationPanel";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/pagos", label: "Pagos", icon: CreditCard },
  { path: "/caja", label: "Flujo de Caja", icon: DollarSign },
];

interface NavbarProps {
  notifications: Notification[];
}

export default function Navbar({ notifications }: NavbarProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/40 px-4 lg:px-8">
      <div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
            <span className="font-heading font-bold text-primary-foreground text-xl">S</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-heading font-bold text-lg tracking-tight block leading-tight">Summer Gym</span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">Management</span>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <NotificationPanel notifications={notifications} />
          <button className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden pb-4 space-y-1 animate-fade-in">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
