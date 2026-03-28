import { Bell, X, AlertTriangle, Clock, Cake } from "lucide-react";
import { useState } from "react";
import { Notification } from "../lib/types";

interface NotificationPanelProps {
  notifications: Notification[];
}

const typeConfig = {
  cuota_vencida: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", label: "Vencida" },
  cuota_por_vencer: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "Por vencer" },
  cumpleanos: { icon: Cake, color: "text-primary", bg: "bg-primary/10", label: "Cumpleaños" },
};

export default function NotificationPanel({ notifications }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = notifications.filter(n => !dismissed.has(n.id));
  const urgentCount = visible.filter(n => n.type === 'cuota_vencida').length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      >
        <Bell className="w-5 h-5" />
        {visible.length > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${urgentCount > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
            {visible.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-[360px] max-h-[70vh] overflow-y-auto glass-card border border-border shadow-2xl animate-fade-in">
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm">Notificaciones ({visible.length})</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {visible.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Todo al día 👍
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {visible.map(n => {
                  const config = typeConfig[n.type];
                  const Icon = config.icon;
                  return (
                    <div key={n.id} className="p-3 hover:bg-secondary/30 transition-colors">
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg ${config.bg} shrink-0 self-start`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">{n.clientName}</span>
                            <button onClick={() => setDismissed(prev => new Set(prev).add(n.id))}
                              className="text-muted-foreground hover:text-foreground shrink-0">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
