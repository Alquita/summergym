import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, Clock, Cake, X } from "lucide-react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Pagos from "./pages/Pagos";
import FlujoCaja from "./pages/FlujoCaja";
import Configuracion from "./pages/Configuracion";

import NotFound from "./pages/NotFound";
import { syncClientStatuses, seedIfEmpty, getSettings } from "./lib/store";
import { Notification, Client } from "./lib/types";
import { playNotifSound, unlockAudio } from "./lib/sound";

const queryClient = new QueryClient();

const App = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      await getSettings();
      const { updatedClients, notifications: notifs } = await syncClientStatuses();
      setClients(updatedClients);
      setNotifications(notifs);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    notifications.forEach((n, i) => {
      setTimeout(() => {
        if (n.type === 'cuota_vencida' || n.type === 'cuota_por_vencer') playNotifSound();
        toast.custom(
          (t) => {
            let config: { icon: typeof AlertTriangle; color: string; bg: string; border: string };
            if (n.type === 'cuota_vencida') config = { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' };
            else if (n.type === 'cuota_por_vencer') config = { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' };
            else config = { icon: Cake, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' };
            const Icon = config.icon;
            return (
              <div className={`flex items-start gap-3 p-3 w-full rounded-lg border ${config.bg} ${config.border}`}>
                <Icon className={`w-5 h-5 ${config.color} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{n.clientName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                </div>
                <button onClick={() => toast.dismiss(t)} className="text-muted-foreground hover:text-foreground shrink-0 p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          },
          { duration: 10000 }
        );
      }, (i + 1) * 1200);
    });
  }, [ready]);

  // Desbloquea audio al primer toque del usuario
  useEffect(() => {
    const unlock = () => { unlockAudio(); document.removeEventListener('click', unlock); document.removeEventListener('touchstart', unlock); };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
  }, []);

  // SW update detection — recarga automática cuando hay nueva versión
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const checkUpdate = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      reg?.update();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkUpdate();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar notifications={notifications} />
            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
              {!ready ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">Cargando datos...</div>
              ) : (
                <Routes>
                  <Route path="/" element={<Dashboard clients={clients} notifications={notifications} />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/pagos" element={<Pagos />} />
                  <Route path="/caja" element={<FlujoCaja />} />
                  <Route path="/configuracion" element={<Configuracion />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              )}
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
