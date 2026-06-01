import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, DollarSign, Menu, X, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Notification, Settings } from "../lib/types";
import { getSettings, getSettingsSync } from "../lib/store";
import NotificationPanel from "./NotificationPanel";
import logo from "@/assets/summergym.jpg";

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
  const [settings, setSettings] = useState<Settings>(getSettingsSync());
  useEffect(() => { getSettings().then(setSettings); }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-2xl border-b border-border/40 px-4 lg:px-8 shadow-lg shadow-background/40">
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="Summer Gym" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow" />
          <div className="hidden sm:block">
            <span className="font-heading font-bold text-lg tracking-tight block leading-tight">{settings.gymName}</span>
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
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  active
                    ? "text-primary-foreground bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:-translate-y-0.5"
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
          <Link to="/configuracion"
            className={`p-2 rounded-lg transition-colors ${location.pathname === '/configuracion' ? 'text-primary bg-primary/15' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            title="Configuración">
            <SettingsIcon className={`w-5 h-5 ${location.pathname === '/configuracion' ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
          </Link>
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
