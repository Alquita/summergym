import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(getSettingsSync());
  useEffect(() => { getSettings().then(setSettings); }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border px-4 lg:px-8">
      <div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Summer Gym" className="w-9 h-9 rounded-lg object-cover" />
          <div className="hidden sm:block">
            <span className="font-heading font-semibold text-base">{settings.gymName}</span>
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
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <NotificationPanel notifications={notifications} />
          <button onClick={() => navigate(location.pathname === '/configuracion' ? '/' : '/configuracion')}
            className={`p-2 rounded-lg transition-colors ${location.pathname === '/configuracion' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            title="Configuración">
            <SettingsIcon className="w-5 h-5" />
          </button>
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
